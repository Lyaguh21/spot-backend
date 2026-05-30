import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Visibility, Place } from '@prisma/client';
import { UpdateVisitDto } from './dto/update-visit.dto';

@Injectable()
export class VisitsService {
    constructor(private readonly prisma: PrismaService) {}
    
    async create(userId: string, dto: CreateVisitDto) {

        let place: Place

        if (dto.externalId) {
            const existing = await this.prisma.place.findUnique({
                where: {
                    externalId: dto.externalId,
                },
            });
            
            if (existing) {
                place = existing;
            } else {
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
        } else {
            place = await this.prisma.place.create({
                data: {
                    title: dto.title,
                    lat: dto.lat,
                    lng: dto.lng,
                    address: dto.address,
                    websiteUrl: dto.websiteUrl,
                }
            })
        }

        const visit = await this.prisma.visit.create({
            data: {
                placeId: place.id,
                userId: userId,
                description: dto.description,
                rating: dto.rating,
                isFavorite: dto.isFavorite,
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
                visitDate: dto.visitDate ? new Date(dto.visitDate) : undefined,
                visibility: dto.visibility,
            }
        })
    }

    async remove(userId: string, visitId: string) {
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