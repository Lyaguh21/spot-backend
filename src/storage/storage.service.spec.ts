import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('unwraps legacy upload response strings before using storage urls', () => {
    expect(
      service.normalizeStorageUrl(
        '{"data":"https://s3.example.com/bucket/visits/photo.jpg"}',
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
});
