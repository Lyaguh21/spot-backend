import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Place, OwnerType, Prisma } from '@prisma/client';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { toVisitResponse } from './visit-response.mapper';
import { StorageService } from 'src/storage/storage.service';
import { signPhotos, signVisitResponse } from 'src/storage/storage-sign.helper';

@Injectable()
export class VisitsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    private toRatingsJson(
        ratings?: { nickname: string; rating: number }[],
    ): Prisma.InputJsonValue | undefined {
        if (!ratings) {
            return undefined;
        }

        return ratings.map(({ nickname, rating }) => ({
            nickname,
            rating,
        })) as Prisma.InputJsonValue;
    }

    // public async signVisitPhotos<T extends { photos: string[] }>(visit: T): Promise<T> {
    //     return {
    //         ...visit,
    //         photos: await this.storage.generateSignedUrls(
    //             visit.photos ?? [],
    //         ),
    //     };
    // }

    // public async signVisitsPhotos<T extends { photos: string[] }>(visits: T[]): Promise<T[]> {
    //     return Promise.all(
    //         visits.map((visit) => this.signVisitPhotos(visit)),
    //     );
    // }   
    
    async create(
        currentUserId: string,
        dto: CreateVisitDto,
    ) {

        let place: Place | null = null;
        
        if (dto.externalId) {
            place = await this.prisma.place.findUnique({
                where: {
                    externalId: dto.externalId,
                },
            });
        }

        if (!place) {
            place = await this.prisma.place.findFirst({
                where: {
                    lat: dto.lat,
                    lng: dto.lng,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
        }

        if (!place) {
            place = await this.prisma.place.create({
                data: {
                    externalId: dto.externalId,
                    title: dto.title,
                    lat: dto.lat,
                    lng: dto.lng,
                    address: dto.address,
                    websiteUrl: dto.websiteUrl,
                },
            });
        }

        let userId: string | null = null;
        let coupleId: string | null = null;
        const ownerType = dto.ownerType ?? OwnerType.USER;

        switch (ownerType) {
            case OwnerType.USER:
                userId = currentUserId;
                break;

            case OwnerType.COUPLE:
                if (!dto.coupleId) {
                    throw new BadRequestException(
                        'coupleId is required for couple visits',
                    );
                }

                const membership =
                    await this.prisma.coupleMember.findFirst({
                        where: {
                            userId: currentUserId,
                            coupleId: dto.coupleId,
                        },
                    });

                if (!membership) {
                    throw new ForbiddenException(
                        'You are not a member of this couple',
                    );
                }

                coupleId = dto.coupleId;
                break;

            default:
                throw new BadRequestException(
                    'Invalid owner type',
                );
        }

        const visit = await this.prisma.visit.create({
            data: {
                placeId: place.id,
                ownerType,
                userId,
                coupleId,

                title: dto.title,
                description: dto.description,
                ratings: this.toRatingsJson(dto.ratings) ?? [],
                isFavorite: dto.isFavorite ?? false,
                photos: this.storage.normalizeUrlsForPersistence(dto.photos),
                icon: dto.icon,
                color: dto.color,
                status: dto.status,

                visitDate: new Date(dto.visitDate),
            },
            include: {
                place: true,
            },
        });

        return signVisitResponse(
            this.storage,
            toVisitResponse(visit),
        );
    }

    async findOne(id: string) {
        const visit = await this.prisma.visit.findUnique({
            where: { 
                id 
            },
            include: {
                place: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatarUrl: true,
                    }
                },
            },
        });

        if (!visit) {
            throw new NotFoundException('Visit not found');
        }

        return signVisitResponse(
            this.storage,
            toVisitResponse(visit),
        );
    }

    async update(userId: string, visitId: string, dto: UpdateVisitDto) {
        const visit = await this.prisma.visit.findUnique({
            where: {
                id: visitId,
            },
        });

        if (!visit) {
            throw new NotFoundException('Visit not found');
        }

        await this.assertCanManageVisit(userId, visit);

        const updatedVisit = await this.prisma.visit.update({
            where: {
                id: visitId,
            },
            data: {
                title: dto.title,
                description: dto.description,
                ratings: this.toRatingsJson(dto.ratings),
                isFavorite: dto.isFavorite,
                photos:
                    dto.photos === undefined
                        ? undefined
                        : this.storage.normalizeUrlsForPersistence(dto.photos),
                icon: dto.icon,
                color: dto.color,
                status: dto.status,
                visitDate: dto.visitDate ? new Date(dto.visitDate) : undefined,
            },
            include: {
                place: true,
            },
        });

        return signVisitResponse(
            this.storage,
            toVisitResponse(updatedVisit),
        );
    }

    async delete(userId: string, visitId: string) {
        const visit = await this.prisma.visit.findUnique({
            where: {
                id: visitId,
            },
        });

        if (!visit) {
            throw new NotFoundException('Visit not found');
        }

        await this.assertCanManageVisit(userId, visit);

        await this.prisma.visit.delete({
            where: { id: visitId },
        });

        return { message: 'Visit deleted' };    
    }

    private async assertCanManageVisit(
        userId: string,
        visit: {
            ownerType: OwnerType;
            userId: string | null;
            coupleId: string | null;
        },
    ) {
        if (visit.ownerType === OwnerType.USER) {
            if (visit.userId !== userId) {
                throw new ForbiddenException('Unauthorized');
            }

            return;
        }

        if (!visit.coupleId) {
            throw new ForbiddenException('Unauthorized');
        }

        const membership = await this.prisma.coupleMember.findFirst({
            where: {
                userId,
                coupleId: visit.coupleId,
            },
            select: {
                id: true,
            },
        });

        if (!membership) {
            throw new ForbiddenException('Unauthorized');
        }
    }
}
