import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetFeedDto } from './dto/get-feed.dto';
import { StorageService } from 'src/storage/storage.service';
import { VisitsService } from 'src/visits/visits.service';

@Injectable()
export class FeedService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly visit: VisitsService,
    ) {}

    async getFeed(userId: string, dto: GetFeedDto) {
        const followedUsers = await this.prisma.userSubscription.findMany({
            where: {
                followerId: userId,
            }
        })

        const followedCouples = await this.prisma.coupleSubscription.findMany({
            where: {
                followerId: userId,
            }
        })

        const visits = await this.prisma.visit.findMany({
            where: {
                OR: [
                    {
                        userId: {
                            in: followedUsers.map(user => user.targetUserId)
                        }
                    },
                    {
                        coupleId: {
                            in: followedCouples.map(couple => couple.targetCoupleId)
                        }
                    }
                ]
            },
            include: {
                place: true,

                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatarUrl: true
                    }
                },

                couple: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        name: true,
                                        avatarUrl: true
                                    }
                                }
                            }
                        }
                    }
                },
            },

            orderBy:{
                createdAt: 'desc'
            },

            skip: (dto.page - 1) * dto.limit,
            take: dto.limit,
        })

        return this.visit.signVisitsPhotos(visits);
    }
}
