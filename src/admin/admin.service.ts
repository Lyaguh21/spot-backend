import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { signAvatar } from 'src/storage/storage-sign.helper';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class AdminService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

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
                isDeleted: true,
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

        return Promise.all(
            users.map(async (user) => ({
                ...(await signAvatar(this.storage, user)),
                places: placesByUserId.get(user.id) ?? 0,
            })),
        );
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

        return Promise.all(filteredCouples.map(async (couple) => {
            const members = await Promise.all(
                couple.members.map((m) => signAvatar(this.storage, m.user)),
            );

            return {
                id: couple.id,
                createdAt: couple.createdAt,
                members,
                places: placesByCoupleId.get(couple.id) ?? 0,
            };
        }));
    }

    async getBugReports() {
        const reports = await this.prisma.bugReport.findMany({
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

        return Promise.all(
            reports.map(async (report) => ({
                ...report,
                photos: await this.storage.signUrls(report.photos ?? []),
                user: await signAvatar(this.storage, report.user),
            })),
        );
    }

    async deleteBugReport(id: string) {
        const report = await this.prisma.bugReport.findUnique({
            where: { id },
        });

        if (!report) {
            throw new NotFoundException('Bug report not found');
        }

        await this.storage.deleteFiles(report.photos ?? []);

        await this.prisma.bugReport.delete({
            where: { id },
        });

        return {
            message: 'Bug report deleted successfully',
        };
    }

    async deleteUser(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                isDeleted: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.isDeleted) {
            throw new BadRequestException('User already deleted');
        }

        await this.prisma.user.update({
            where: { id },
            data: {
                isDeleted: true,
                hashedRefreshToken: null,
                tokenVersion: {
                    increment: 1,
                },
            },
        });

        return {
            message: 'User deleted',
        };
    }

    async restoreUser(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                isDeleted: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.isDeleted) {
            throw new BadRequestException('User is not deleted');
        }

        await this.prisma.user.update({
            where: { id },
            data: {
                isDeleted: false,
            },
        });

        return {
            message: 'User restored',
        };
    }

    async banUser(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, isBanned: true },
        });
    
        if (!user) {
            throw new NotFoundException('User not found');
        }
    
        if (user.isBanned) {
            throw new BadRequestException('User already banned');
        }
    
        await this.prisma.user.update({
            where: { id },
            data: {
                isBanned: true,
                tokenVersion: {
                    increment: 1,
                },
            },
        });
    
        return { message: 'User banned' };
    }

    async unbanUser(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, isBanned: true },
        });
    
        if (!user) {
            throw new NotFoundException('User not found');
        }
    
        if (!user.isBanned) {
            throw new BadRequestException('User is not banned');
        }
    
        await this.prisma.user.update({
            where: { id },
            data: {
                isBanned: false,
            },
        });
    
        return { message: 'User unbanned' };
}
}
