import { Test, TestingModule } from '@nestjs/testing';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('StorageService', () => {
  let service: StorageService;
  let sendSpy: jest.SpyInstance;

  beforeEach(async () => {
    process.env.S3_ENDPOINT = 'https://s3.example.com';
    process.env.S3_BUCKET = 'bucket';
    process.env.S3_ACCESS_KEY = 'access-key';
    process.env.S3_SECRET_KEY = 'secret-key';

    sendSpy = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    jest.mocked(getSignedUrl).mockResolvedValue('https://signed.example.com/photo.jpg');

    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    sendSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns canonical and signed urls after uploading a file', async () => {
    const result = await service.uploadFile({
      originalname: 'photo.jpg',
      buffer: Buffer.from('file'),
      mimetype: 'image/jpeg',
    });

    expect(result).toEqual({
      url: expect.stringMatching(
        /^https:\/\/s3\.example\.com\/bucket\/visits\/\d+-[0-9a-f-]+-photo\.jpg$/,
      ),
      signedUrl: 'https://signed.example.com/photo.jpg',
    });
    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.anything(),
      { expiresIn: 60 * 60 },
    );
  });

  it('encodes uploaded file names in public storage urls', async () => {
    const result = await service.uploadFile({
      originalname: 'photo one.jpg',
      buffer: Buffer.from('file'),
      mimetype: 'image/jpeg',
    });

    expect(result.url).toMatch(
      /^https:\/\/s3\.example\.com\/bucket\/visits\/\d+-[0-9a-f-]+-photo%20one\.jpg$/,
    );
  });

  it('unwraps legacy upload response strings before using storage urls', () => {
    expect(
      service.normalizeStorageUrl(
        '{"data":"https://s3.example.com/bucket/visits/photo.jpg"}',
      ),
    ).toBe('https://s3.example.com/bucket/visits/photo.jpg');
  });

  it('unwraps structured upload response strings before using storage urls', () => {
    expect(
      service.normalizeStorageUrl(
        '{"data":{"url":"https://s3.example.com/bucket/visits/photo.jpg","signedUrl":"https://signed.example.com/photo.jpg"}}',
      ),
    ).toBe('https://s3.example.com/bucket/visits/photo.jpg');
  });

  it('removes transient signed url parts from storage urls', () => {
    expect(
      service.normalizeStorageUrl(
        'https://s3.example.com/bucket/visits/photo.jpg?X-Amz-Signature=123#preview',
      ),
    ).toBe('https://s3.example.com/bucket/visits/photo.jpg');
  });

  it('normalizes encoded storage urls to canonical encoded urls', () => {
    expect(
      service.normalizeUrlForPersistence(
        'https://s3.example.com/bucket/visits/photo%20one.jpg?X-Amz-Signature=123',
      ),
    ).toBe('https://s3.example.com/bucket/visits/photo%20one.jpg');
  });

  it('signs encoded storage urls using the decoded object key', async () => {
    await service.signUrl(
      'https://s3.example.com/bucket/visits/photo%20one.jpg',
    );

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'bucket',
          Key: 'visits/photo one.jpg',
        }),
      }),
      { expiresIn: 60 * 60 },
    );
  });

  it('deletes a storage object by normalized url', async () => {
    await (service as any).deleteFile(
      'https://s3.example.com/bucket/visits/photo.jpg?X-Amz-Signature=123',
    );

    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'bucket',
          Key: 'visits/photo.jpg',
        }),
      }),
    );
  });
});
