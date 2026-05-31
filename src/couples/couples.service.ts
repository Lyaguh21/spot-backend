import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes } from 'crypto';
import { JoinCoupleDto } from './dto/join-couple.dto';

@Injectable()
export class CouplesService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * create(userId, dto)

join(userId, inviteCode)

leave(userId)

getById(id)

update(userId, coupleId, dto)
     */

    generateUniqueInviteCode(length: number = 6): string {
        return randomBytes(length)
        .toString('base64')
        .replace(/[+/=]/g, '')
        .slice(0, length)
        .toUpperCase();
    }

    async create(userId: string) {
        const existingMembership = await this.prisma.coupleMember.findFirst({
            where: {
                userId,
            },
            include: {
                couple: true,
            },
        });

        if (existingMembership) {
            return existingMembership.couple;
        }

        const couple = await this.prisma.couple.create({
            data: {
                inviteCode: this.generateUniqueInviteCode(),
            },
        });

        await this.prisma.coupleMember.create({
            data: {
                userId,
                coupleId: couple.id,
            },
        });

        return couple;
    }

    async join(userId: string, dto: JoinCoupleDto) {
        const existingMembership = await this.prisma.coupleMember.findFirst({
            where: {
                userId,
            },
            include: {
                couple: {
                    include: { 
                        members: true 
                    } 
                } 
            },
        });

        if (existingMembership) {
            const oldCouple = existingMembership.couple;

            if (oldCouple.members.length > 1) {
            throw new BadRequestException('Cannot join another couple while in a couple with more than 1 member');
            }

            await this.prisma.coupleMember.delete({ where: { id: existingMembership.id } });
            await this.prisma.couple.delete({ where: { id: oldCouple.id } });
        }

        

        const couple = await this.prisma.couple.findUnique({
            where: {
                inviteCode: dto.inviteCode,
            },
            include: {
                members: true
            }
        })

        if (!couple) {
            throw new NotFoundException('Invalid invite code');
        }

        if (couple.members.length >= 2) {
            throw new BadRequestException('Couple is already full');
        }

        return await this.prisma.coupleMember.create({
            data: {
                userId,
                coupleId: couple.id,
            }
        })
    }

    async resetInviteCode(userId: string) {
        const couple = await this.getMyCouple(userId);

        if ((couple as any).status === 'NOT_COUPLE') {
            throw new NotFoundException('User is not in a couple');
        }

        const inviteCode = this.generateUniqueInviteCode();

        await this.prisma.couple.update({
            where: {
                id: (couple as any).id,
            },
            data: {
                inviteCode,
            },
        });

        return {
            inviteCode,
        };
    }

    async getMyCouple(userId: string) {
        const membership = await this.prisma.coupleMember.findFirst({
            where: {
                userId,
            },
            include: {
                couple: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        name: true,
                                        avatarUrl: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!membership) {
            return {
                status: 'NOT_COUPLE',
            };
        }

        const couple = membership.couple;

        const generatedName = couple.members
        .map(member => member.user.name)
        .join(' & ');

        return {
            status: 'SUCCESS',
            ...couple,
            generatedName,
        };
    }

    async findOne(id: string) {
        const couple = await this.prisma.couple.findUnique({
            where: { 
                id 
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });

        if (!couple) {
            throw new NotFoundException('Couple not found');
        }

        const displayName = couple.members
        .map(member => member.user.name)
        .join(' & ');

        return {
            ...couple,
            displayName,
        };
    }

    async findVisits(coupleId: string) {
        return this.prisma.visit.findMany({
            where: {
                coupleId,
            },
            include: {
                place: true,
            },
            orderBy: {
                visitDate: 'desc',
            },
        });
    }

    async getCouplePlaces(coupleId: string) {
        const couple = await this.prisma.couple.findUnique({
            where: {
                id: coupleId,
            },
        });
    
        if (!couple) {
            throw new NotFoundException();
        }
    
        const visits = await this.prisma.visit.findMany({
            where: {
                coupleId: couple.id,
            },
            include: {
                place: true,
            },
            orderBy: {
                visitDate: 'desc',
            },
        });
    
        const placesMap = new Map();
    
        for (const visit of visits) {
            if (!placesMap.has(visit.place.id)) {
                placesMap.set(visit.place.id, {
                    place: visit.place,
                    visits: [],
                });
            }
    
            const { place, ...visitWithoutPlace } = visit;
    
            placesMap.get(visit.place.id).visits.push(visitWithoutPlace);
        }
    
        return {
            map: Array.from(placesMap.values()),
        };
    }
}
