import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUserVisitsDto } from './dto/get-user-visits.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userProfileSelect = {
    id: true,
    username: true,
    name: true,
    avatarUrl: true,
    bio: true,
    visibility: true,
    createdAt: true,
  } as const;

  getAll() {
    return this.prisma.user.findMany({
      select: this.userProfileSelect,
    });
  }

  private async getUserStats(userId: string) {
    const places = await this.prisma.visit.findMany({
      where: {
        userId,
      },
      distinct: ['placeId'],
      select: {
        placeId: true,
      },
    });

    const placesCount = places.length;

    const followersCount = await this.prisma.userSubscription.count({
      where: {
        targetUserId: userId,
      },
    });

    const followingCount = await this.prisma.userSubscription.count({
      where: {
        followerId: userId,
      },
    });

    return {
      places: placesCount,
      followers: followersCount,
      following: followingCount
    };
  }

  async getMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        visibility: true,
      
        coupleMembers: {
          select: {
            couple: {
              select: {
                id: true,
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
            },
          },
        },
      },
    });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    const couple = user.coupleMembers[0]?.couple;
  
    const partner = couple?.members
      .map((m) => m.user)
      .find((u) => u.id !== user.id);

      const stats = await this.getUserStats(user.id);
  
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      visibility: user.visibility,
    
      coupleId: couple?.id ?? null,
    
      partner: partner
      ? {
          id: partner.id,
          username: partner.username,
          name: partner.name,
          avatarUrl: partner.avatarUrl,
        }: null,

      stats
    };
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: dto,
      select: this.userProfileSelect,
    });

    //  if (dto.username) {
    //    проверить уникальность
    //  }
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        visibility: true,
      
        coupleMembers: {
          select: {
            couple: {
              select: {
                id: true,
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
            },
          },
        },
      },
    });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    const couple = user.coupleMembers[0]?.couple;
  
    const partner = couple?.members
      .map((m) => m.user)
      .find((u) => u.id !== user.id);

      const stats = await this.getUserStats(user.id);
  
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      visibility: user.visibility,
    
      coupleId: couple?.id ?? null,
    
      partner: partner
      ? {
          id: partner.id,
          username: partner.username,
          name: partner.name,
          avatarUrl: partner.avatarUrl,
        }: null,
        stats
    };
  }

  async findById(id: string) {
    const user =
      await this.prisma.user.findUnique({
        where: { id },
        include: {
          coupleMembers: {
            include: {
              couple: true,
            },
          },
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      visibility: user.visibility,
    }
  }

  async getUserVisits(username: string, query: GetUserVisitsDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    return this.prisma.visit.findMany({
      where: {
        userId: user.id,
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserPlaces(username: string, query: GetUserVisitsDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    const visits = await this.prisma.visit.findMany({
      where: {
        userId: user.id,
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

  async follow(currentUserId: string, username: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id === currentUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    if (await this.prisma.userSubscription.findFirst({
      where: {
        followerId: currentUserId,
        targetUserId: user.id,
      },
    })) {
      throw new BadRequestException('Already following this user');
    }

    await this.prisma.userSubscription.create({
      data: {
        followerId: currentUserId,
        targetUserId: user.id,
      },
    });

    return {
      message: 'Followed successfully',
    };
  }

  async unfollow(currentUserId: string, username: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.userSubscription.deleteMany({
      where:{
        followerId: currentUserId,
        targetUserId: user.id,
      }
    })

    return { 
      message: 'Unfollowed successfully' 
    };
  }


}
