import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Visibility, Place, OwnerType } from '@prisma/client';
import { UpdateVisitDto } from './dto/update-visit.dto';

@Injectable()
export class VisitsService {
    constructor(private readonly prisma: PrismaService) {}
    
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

        switch (dto.ownerType) {
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
                ownerType: dto.ownerType,
                userId,
                coupleId,

                description: dto.description,
                rating: dto.rating ?? null,
                isFavorite: dto.isFavorite ?? false,

                visitDate: new Date(dto.visitDate),
                visibility: dto.visibility ?? Visibility.PUBLIC,
            },
            include: {
                place: true,
            },
        });

        return visit;
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

        return visit;
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

        if (visit.userId !== userId) {
            throw new ForbiddenException('Unauthorized');
        }

        return this.prisma.visit.update({
            where: {
                id: visitId,
            },
            data: {
                description: dto.description,
                rating: dto.rating,
                isFavorite: dto.isFavorite,
                visibility: dto.visibility,
                visitDate: dto.visitDate ? new Date(dto.visitDate) : undefined,
            }
        })
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

        if (visit.userId !== userId) {
            throw new ForbiddenException('Unauthorized');
        }

        await this.prisma.visit.delete({
            where: { id: visitId },
        });

        return { message: 'Visit deleted' };    
    }
}