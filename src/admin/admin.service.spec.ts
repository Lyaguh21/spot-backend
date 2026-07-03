import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    user: {
      count: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    userSubscription: {
      deleteMany: jest.Mock;
    };
    coupleSubscription: {
      deleteMany: jest.Mock;
    };
    coupleMember: {
      deleteMany: jest.Mock;
    };
    emailVerificationCode: {
      deleteMany: jest.Mock;
    };
    couple: {
      findMany: jest.Mock;
    };
    visit: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    bugReport: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      deleteMany: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let storage: {
    signUrl: jest.Mock;
    signUrls: jest.Mock;
    deleteFiles: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        count: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      userSubscription: {
        deleteMany: jest.fn(),
      },
      coupleSubscription: {
        deleteMany: jest.fn(),
      },
      coupleMember: {
        deleteMany: jest.fn(),
      },
      emailVerificationCode: {
        deleteMany: jest.fn(),
      },
      couple: {
        findMany: jest.fn(),
      },
      visit: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      bugReport: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (operations: unknown[]) => operations),
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

  it('counts only active users, couples with two active members, and visited places', async () => {
    prisma.user.count.mockResolvedValue(2);
    prisma.couple.findMany.mockResolvedValue([
      {
        id: 'couple-1',
        members: [
          { user: { id: 'user-1', isDeleted: false } },
          { user: { id: 'user-2', isDeleted: false } },
        ],
      },
      {
        id: 'couple-2',
        members: [{ user: { id: 'user-3', isDeleted: false } }],
      },
      {
        id: 'couple-3',
        members: [
          { user: { id: 'user-4', isDeleted: false } },
          { user: { id: 'user-5', isDeleted: true } },
        ],
      },
    ]);
    prisma.visit.findMany.mockResolvedValue([
      { placeId: 'place-1' },
      { placeId: 'place-2' },
    ]);

    await expect(service.stats()).resolves.toEqual({
      users: 2,
      couples: 1,
      places: 2,
    });

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { isDeleted: false },
    });
    expect(prisma.visit.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            user: {
              isDeleted: false,
            },
          },
          {
            coupleId: {
              in: ['couple-1'],
            },
          },
        ],
      },
      distinct: ['placeId'],
      select: {
        placeId: true,
      },
    });
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

  it('physically deletes a user and related records so username can be reused', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
    });

    await service.deleteUser('user-1');

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith([
      prisma.userSubscription.deleteMany.mock.results[0].value,
      prisma.userSubscription.deleteMany.mock.results[1].value,
      prisma.coupleSubscription.deleteMany.mock.results[0].value,
      prisma.coupleMember.deleteMany.mock.results[0].value,
      prisma.emailVerificationCode.deleteMany.mock.results[0].value,
      prisma.bugReport.deleteMany.mock.results[0].value,
      prisma.visit.deleteMany.mock.results[0].value,
      prisma.user.delete.mock.results[0].value,
    ]);
    expect(prisma.userSubscription.deleteMany).toHaveBeenNthCalledWith(1, {
      where: { followerId: 'user-1' },
    });
    expect(prisma.userSubscription.deleteMany).toHaveBeenNthCalledWith(2, {
      where: { targetUserId: 'user-1' },
    });
    expect(prisma.coupleSubscription.deleteMany).toHaveBeenCalledWith({
      where: { followerId: 'user-1' },
    });
    expect(prisma.coupleMember.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.emailVerificationCode.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.bugReport.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.visit.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });
});
