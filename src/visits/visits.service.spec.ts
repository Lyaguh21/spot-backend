import { Test, TestingModule } from '@nestjs/testing';
import { OwnerType, VisitStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { VisitsService } from './visits.service';

describe('VisitsService', () => {
  let service: VisitsService;
  let prisma: {
    visit: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    place: {
      update: jest.Mock;
    };
    coupleMember: {
      findFirst: jest.Mock;
    };
  };
  let storage: {
    normalizeUrlsForPersistence: jest.Mock;
    signUrls: jest.Mock;
    signUrl: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      visit: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      place: {
        update: jest.fn(),
      },
      coupleMember: {
        findFirst: jest.fn(),
      },
    };
    storage = {
      normalizeUrlsForPersistence: jest.fn((urls?: string[] | null) => urls ?? []),
      signUrls: jest.fn(async (urls: string[]) => urls),
      signUrl: jest.fn(async (url?: string | null) => url ?? null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitsService,
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

    service = module.get<VisitsService>(VisitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('updates the related place address when a visit address is patched', async () => {
    const visit = {
      id: 'visit-1',
      placeId: 'place-1',
      ownerType: OwnerType.USER,
      userId: 'user-1',
      coupleId: null,
    };
    const updatedVisit = {
      ...visit,
      title: 'Cafe',
      description: '',
      ratings: [],
      isFavorite: false,
      photos: ['https://storage/visits/1.jpg'],
      icon: 'coffee',
      color: 'blue',
      status: VisitStatus.VISITED,
      visitDate: new Date('2026-07-01T10:00:00.000Z'),
      place: {
        id: 'place-1',
        title: 'Cafe',
        lat: 55.7,
        lng: 37.6,
        address: 'Moscow',
        websiteUrl: null,
        externalId: null,
      },
    };

    prisma.visit.findUnique.mockResolvedValue(visit);
    prisma.place.update.mockResolvedValue({ id: 'place-1' });
    prisma.visit.update.mockResolvedValue(updatedVisit);

    await service.update('user-1', 'visit-1', {
      address: '  Moscow  ',
      photos: ['https://storage/visits/1.jpg'],
    });

    expect(prisma.place.update).toHaveBeenCalledWith({
      where: {
        id: 'place-1',
      },
      data: {
        address: 'Moscow',
      },
    });
    expect(prisma.visit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'visit-1',
        },
        data: expect.objectContaining({
          photos: ['https://storage/visits/1.jpg'],
        }),
      }),
    );
  });
});
