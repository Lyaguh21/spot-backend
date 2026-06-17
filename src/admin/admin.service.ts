import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) {}

    async stats() {
        const users = this.prisma.user.count();
        const couples = this.prisma.couple.count();
        const places = this.prisma.place.count();

        const [usersCount, couplesCount, placesCount] = await Promise.all([
            users,
            couples,
            places,
        ]);

        return {
            users: usersCount,
            couples: couplesCount,
            places: placesCount,
        };
    }


    async getUsersStats() {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                avatarUrl: true,
                createdAt: true,
            },
        });

        if (!users.length) {
            return [];
        }

        const userIds = users.map((user) => user.id);

        const uniqueUserPlaces = await this.prisma.visit.findMany({
            where: {
                userId: {
                    in: userIds,
                },
            },
            select: {
                userId: true,
                placeId: true,
            },
            distinct: ['userId', 'placeId'],
        });

        const placesByUserId = new Map<string, number>();

        for (const visit of uniqueUserPlaces) {
            if (!visit.userId) {
                continue;
            }

            placesByUserId.set(
                visit.userId,
                (placesByUserId.get(visit.userId) ?? 0) + 1,
            );
        }

        return users.map((user) => ({
            ...user,
            places: placesByUserId.get(user.id) ?? 0,
        }));
    }

    async getCoupleStats() {
        const couples = await this.prisma.couple.findMany({
            select: {
                id: true,
                createdAt: true,
                members: {
                    select: {
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

        const filteredCouples = couples.filter((c) => c.members.length === 2);

        const coupleIds = filteredCouples.map((couple) => couple.id);

        const uniqueCoupleVisits = await this.prisma.visit.findMany({
            where: {
                coupleId: {
                    in: coupleIds,
                },
            },
            select: {
                coupleId: true,
                placeId: true,
            },
            distinct: ['coupleId', 'placeId'],
        });

        const placesByCoupleId = new Map<string, number>();

        for (const visit of uniqueCoupleVisits) {
            if (!visit.coupleId) {
                continue;
            }

            placesByCoupleId.set(
                visit.coupleId,
                (placesByCoupleId.get(visit.coupleId) ?? 0) + 1,
            );
        }

        return filteredCouples.map((couple) => {
            const members = couple.members.map((m) => m.user);

            return {
                id: couple.id,
                createdAt: couple.createdAt,
                members,
                places: placesByCoupleId.get(couple.id) ?? 0,
            };
        });
    }

    async getBugReports() {
        return this.prisma.bugReport.findMany({
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
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async deleteBugReport(id: string) {
        const report = await this.prisma.bugReport.findUnique({
            where: { id },
        });

        if (!report) {
            throw new NotFoundException('Bug report not found');
        }

        await this.prisma.bugReport.delete({
            where: { id },
        });

        return {
            message: 'Bug report deleted successfully',
        };
}
}
