import { Injectable } from "@nestjs/common";
import { PutObjectCommand, S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadedStorageFile {
  readonly originalname: string;
  readonly buffer: Buffer;
  readonly mimetype: string;
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
  ): Promise<string> {
    const key = `${folder}/${Date.now()}-${randomUUID()}-${file.originalname}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
  }

  async uploadFiles(
    files: UploadedStorageFile[],
    folder = "visits",
  ): Promise<string | string[]> {
    const urls = await Promise.all(
      files.map((file) => this.uploadFile(file, folder)),
    );

    return urls.length === 1 ? urls[0] : urls;
  }

  private getKeyFromUrl(url: string): string {
    const bucket = process.env.S3_BUCKET!;

    const marker = `/${bucket}/`;

    const index = url.indexOf(marker);

    if (index === -1) {
        throw new Error("Invalid storage url");
    }

    return url.substring(index + marker.length);
  }

  async generateSignedUrl(url: string) {
    const key = this.getKeyFromUrl(url);

    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
    });

    const signedUrl = await getSignedUrl(this.s3, command, {
        expiresIn: 60 * 60,
    });

    return signedUrl;
  }

  async generateSignedUrls(urls: string[]) {
    return Promise.all(
        urls.map((url) => this.generateSignedUrl(url)),
    );
  }
}
