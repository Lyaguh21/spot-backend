import { Injectable } from "@nestjs/common";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadedStorageFile {
  readonly originalname: string;
  readonly buffer: Buffer;
  readonly mimetype: string;
}

export interface StorageFileReference {
  readonly url: string;
  readonly signedUrl: string;
}

@Injectable()
export class StorageService {
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: "ru-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(
    file: UploadedStorageFile,
    folder = "visits",
  ): Promise<StorageFileReference> {
    const key = `${folder}/${Date.now()}-${randomUUID()}-${file.originalname}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = this.buildStorageUrl(key);

    return {
      url,
      signedUrl: await this.generateSignedUrlByKey(key),
    };
  }

  async uploadFiles(
    files: UploadedStorageFile[],
    folder = "visits",
  ): Promise<StorageFileReference | StorageFileReference[]> {
    const urls = await Promise.all(
      files.map((file) => this.uploadFile(file, folder)),
    );

    return urls.length === 1 ? urls[0] : urls;
  }

  normalizeUrlForPersistence(url: string): string {
    const unwrappedUrl = this.unwrapSerializedStorageUrl(url).trim();

    if (!unwrappedUrl) {
      return unwrappedUrl;
    }

    const key = this.tryGetKeyFromUrl(unwrappedUrl);

    return key ? this.buildStorageUrl(key) : unwrappedUrl;
  }

  normalizeUrlsForPersistence(urls?: string[] | null): string[] {
    return (urls ?? []).map((url) => this.normalizeUrlForPersistence(url));
  }

  normalizeStorageUrl(url: string): string {
    const unwrappedUrl = this.unwrapSerializedStorageUrl(url).trim();

    if (!unwrappedUrl) {
      return unwrappedUrl;
    }

    try {
      const parsedUrl = new URL(unwrappedUrl);
      parsedUrl.search = "";
      parsedUrl.hash = "";

      return parsedUrl.toString();
    } catch {
      return unwrappedUrl.split("#")[0].split("?")[0];
    }
  }

  private unwrapSerializedStorageUrl(url: string): string {
    const trimmedUrl = url.trim();

    if (!trimmedUrl.startsWith("{") && !trimmedUrl.startsWith("[")) {
      return url;
    }

    try {
      const parsed = JSON.parse(trimmedUrl) as unknown;

      if (typeof parsed === "string") {
        return this.unwrapSerializedStorageUrl(parsed);
      }

      if (parsed && typeof parsed === "object" && "url" in parsed) {
        const url = (parsed as { url?: unknown }).url;

        if (typeof url === "string") {
          return this.unwrapSerializedStorageUrl(url);
        }
      }

      if (parsed && typeof parsed === "object" && "data" in parsed) {
        const data = (parsed as { data?: unknown }).data;

        if (typeof data === "string") {
          return this.unwrapSerializedStorageUrl(data);
        }

        if (data && typeof data === "object" && "url" in data) {
          const url = (data as { url?: unknown }).url;

          if (typeof url === "string") {
            return this.unwrapSerializedStorageUrl(url);
          }
        }
      }
    } catch {
      return url;
    }

    return url;
  }

  private buildStorageUrl(key: string): string {
    const endpoint = process.env.S3_ENDPOINT?.replace(/\/+$/, "");
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');

    return `${endpoint}/${process.env.S3_BUCKET}/${encodedKey}`;
  }

  private getStorageUrlPrefixes(): string[] {
    const endpoint = process.env.S3_ENDPOINT?.replace(/\/+$/, "");
    const publicUrl = process.env.S3_PUBLIC_URL?.replace(/\/+$/, "");
    const bucket = process.env.S3_BUCKET!;
    const prefixes: string[] = [];

    if (endpoint) {
      prefixes.push(`${endpoint}/${bucket}/`);
    }

    if (publicUrl) {
      prefixes.push(`${publicUrl}/`);
    }

    return prefixes;
  }

  private tryGetKeyFromUrl(url: string): string | null {
    const normalizedUrl = this.normalizeStorageUrl(url);
    const bucket = process.env.S3_BUCKET!;

    for (const prefix of this.getStorageUrlPrefixes()) {
      if (normalizedUrl.startsWith(prefix)) {
        return this.decodeStorageKey(normalizedUrl.substring(prefix.length));
      }
    }

    const marker = `/${bucket}/`;
    const index = normalizedUrl.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return this.decodeStorageKey(normalizedUrl.substring(index + marker.length));
  }

  private decodeStorageKey(key: string): string {
    try {
      return decodeURIComponent(key);
    } catch {
      return key;
    }
  }

  private getKeyFromUrl(url: string): string {
    const key = this.tryGetKeyFromUrl(url);

    if (!key) {
      throw new Error("Invalid storage url");
    }

    return key;
  }

  private async generateSignedUrlByKey(key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 60 * 60,
    });

    return signedUrl;
  }

  private async generateSignedUrl(url: string) {
    return this.generateSignedUrlByKey(this.getKeyFromUrl(url));
  }

  async signUrl(url?: string | null): Promise<string | null> {
    if (!url) {
      return null;
    }

    if (!this.tryGetKeyFromUrl(url)) {
      return this.unwrapSerializedStorageUrl(url).trim();
    }

    return this.generateSignedUrl(url);
  }

  async signUrls(urls: string[]): Promise<string[]> {
    const signedUrls = await Promise.all(urls.map((url) => this.signUrl(url)));

    return signedUrls.filter((url): url is string => Boolean(url));
  }

  async deleteFile(url?: string | null): Promise<void> {
    if (!url) {
      return;
    }

    const key = this.tryGetKeyFromUrl(url);

    if (!key) {
      return;
    }

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      }),
    );
  }

  async deleteFiles(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => this.deleteFile(url)));
  }
}
