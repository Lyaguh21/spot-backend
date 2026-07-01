import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    bugReport: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let storage: {
    signUrl: jest.Mock;
    signUrls: jest.Mock;
    deleteFiles: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      bugReport: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    storage = {
      signUrl: jest.fn(async (url?: string | null) =>
        url ? `${url}?signed=1` : null,
      ),
      signUrls: jest.fn(async (urls: string[]) =>
        urls.map((url) => `${url}?signed=1`),
      ),
      deleteFiles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: StorageService,
          useValue: storage,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('signs bug report photos and user avatars for private bucket reads', async () => {
    prisma.bugReport.findMany.mockResolvedValue([
      {
        id: 'report-1',
        photos: [
          'https://s3.example.com/bucket/bug-reports/screenshot.jpg',
        ],
        user: {
          id: 'user-1',
          username: 'alex',
          name: 'Alex',
          avatarUrl: 'https://s3.example.com/bucket/avatars/avatar.jpg',
        },
      },
    ]);

    await expect(service.getBugReports()).resolves.toEqual([
      {
        id: 'report-1',
        photos: [
          'https://s3.example.com/bucket/bug-reports/screenshot.jpg?signed=1',
        ],
        user: {
          id: 'user-1',
          username: 'alex',
          name: 'Alex',
          avatarUrl: 'https://s3.example.com/bucket/avatars/avatar.jpg?signed=1',
        },
      },
    ]);
  });

  it('deletes bug report storage files before deleting the database record', async () => {
    const photos = ['https://s3.example.com/bucket/bug-reports/screenshot.jpg'];
    prisma.bugReport.findUnique.mockResolvedValue({
      id: 'report-1',
      photos,
    });
    prisma.bugReport.delete.mockResolvedValue({});

    await service.deleteBugReport('report-1');

    expect(storage.deleteFiles).toHaveBeenCalledWith(photos);
    expect(prisma.bugReport.delete).toHaveBeenCalledWith({
      where: { id: 'report-1' },
    });
    expect(storage.deleteFiles.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.bugReport.delete.mock.invocationCallOrder[0],
    );
  });
});
