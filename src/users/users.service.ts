import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { GetUserVisitsDto } from "./dto/get-user-visits.dto";
import { PaginationDto } from "./dto/pagination.dto";
import { toPlacesWithVisitsResponse } from "src/visits/visit-response.mapper";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private getAccessSecret() {
    return this.config.get<string>("JWT_ACCESS_SECRET", { infer: true })!;
  }

  private async resolveCurrentUserIdFromAccessToken(token?: string) {
    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        tokenVersion: number;
      }>(token, {
        secret: this.getAccessSecret(),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { tokenVersion: true },
      });

      if (!user || user.tokenVersion !== payload.tokenVersion) {
        return null;
      }

      return payload.sub;
    } catch {
      return null;
    }
  }

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
      distinct: ["placeId"],
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

    const followingUsersCount = await this.prisma.userSubscription.count({
      where: {
        followerId: userId,
      },
    });

    const followingCouplesCount = await this.prisma.coupleSubscription.count({
      where: {
        followerId: userId,
      },
    });

    return {
      places: placesCount,
      followers: followersCount,
      following: followingUsersCount + followingCouplesCount,
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
      throw new NotFoundException("User not found");
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
          }
        : null,

      stats,
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

  async findByUsername(username: string, accessToken?: string) {
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
      throw new NotFoundException("User not found");
    }

    const currentUserId =
      await this.resolveCurrentUserIdFromAccessToken(accessToken);
    let isFollowing = false;

    if (currentUserId && currentUserId !== user.id) {
      const existing = await this.prisma.userSubscription.findFirst({
        where: {
          followerId: currentUserId,
          targetUserId: user.id,
        },
        select: { id: true },
      });
      isFollowing = Boolean(existing);
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
          }
        : null,
      stats,
      isFollowing,
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
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
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      visibility: user.visibility,
    };
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

    const visits = await this.prisma.visit.findMany({
      where: {
        userId: user.id,
      },
      include: {
        place: true,
      },
      orderBy: {
        visitDate: "desc",
      },
    });

    return toPlacesWithVisitsResponse(visits);
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
        visitDate: "desc",
      },
    });

    return toPlacesWithVisitsResponse(visits);
  }

  async follow(
    currentUserId: string,
    target: {
      username?: string;
      coupleId?: string;
    },
  ) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: currentUserId,
      },
    });

    if (!currentUser) {
      throw new NotFoundException("Current user not found");
    }

    // ? подписка на пользователя

    if (target.username) {
      const targetUser = await this.prisma.user.findUnique({
        where: {
          username: target.username,
        },
      });

      if (!targetUser) {
        throw new NotFoundException("Target user not found");
      }

      if (targetUser.id === currentUserId) {
        throw new BadRequestException("Cannot follow yourself");
      }

      const existing = await this.prisma.userSubscription.findFirst({
        where: {
          followerId: currentUserId,
          targetUserId: targetUser.id,
        },
      });

      if (existing) {
        throw new BadRequestException("Already following this user");
      }

      await this.prisma.userSubscription.create({
        data: {
          followerId: currentUserId,
          targetUserId: targetUser.id,
        },
      });

      return { message: "Followed user successfully" };
    }

    // ? подписка на пару

    if (target.coupleId) {
      const couple = await this.prisma.couple.findUnique({
        where: {
          id: target.coupleId,
        },
      });

      if (!couple) {
        throw new NotFoundException("Target couple not found");
      }

      const existing = await this.prisma.coupleSubscription.findFirst({
        where: {
          followerId: currentUserId,
          targetCoupleId: target.coupleId,
        },
      });

      if (existing) {
        throw new BadRequestException("Already following this couple");
      }

      await this.prisma.coupleSubscription.create({
        data: {
          followerId: currentUserId,
          targetCoupleId: target.coupleId,
        },
      });

      return { message: "Followed couple successfully" };
    }
  }

  async unfollow(
    currentUserId: string,
    target: {
      username?: string;
      coupleId?: string;
    },
  ) {
    if (target.username) {
      const targetUser = await this.prisma.user.findUnique({
        where: {
          username: target.username,
        },
      });

      if (!targetUser) {
        throw new NotFoundException("Target user not found");
      }

      await this.prisma.userSubscription.deleteMany({
        where: {
          followerId: currentUserId,
          targetUserId: targetUser.id,
        },
      });

      return { message: "Unfollowed user successfully" };
    }

    if (target.coupleId) {
      const couple = await this.prisma.couple.findUnique({
        where: {
          id: target.coupleId,
        },
      });

      if (!couple) {
        throw new NotFoundException("Target couple not found");
      }

      await this.prisma.coupleSubscription.deleteMany({
        where: {
          followerId: currentUserId,
          targetCoupleId: target.coupleId,
        },
      });

      return { message: "Unfollowed couple successfully" };
    }
  }

  async getFollowers(username: string, query: PaginationDto) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const where = {
      targetUserId: user.id,

      ...(query.search && {
        follower: {
          OR: [
            {
              username: {
                contains: query.search,
                mode: "insensitive" as const,
              }
            },
            {
              name: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          ]
        }
      })
    }

    const followers = await this.prisma.userSubscription.findMany({
      where,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const total = await this.prisma.userSubscription.count({
      where
    })

    return {
      items: followers.map((item) => item.follower),
      total,
      page: query.page,
      limit: query.limit,
    }
  }

  async getFollowing(username: string, query: PaginationDto) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const whereUsers: any = {
      followerId: user.id,
    };

    const whereCouples: any = {
      followerId: user.id,
    };

    if (query.search) {
      const q = query.search;

      whereUsers.targetUser = {
        OR: [
          {
            username: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ],
      };

      whereCouples.targetCouple = {
        members: {
          some: {
            user: {
              OR: [
                {
                  username: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
                {
                  name: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        },
      };
    }

    const [users, couples, totalUsers, totalCouples] = await Promise.all([
      this.prisma.userSubscription.findMany({
        where: whereUsers,
        include: {
          targetUser: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),

      this.prisma.coupleSubscription.findMany({
        where: whereCouples,
        include: {
          targetCouple: {
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
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),

      this.prisma.userSubscription.count({
        where: whereUsers,
      }),

      this.prisma.coupleSubscription.count({
        where: whereCouples,
      }),
    ]);

    return {
      items: [
        ...couples.map(item => ({
          type: 'COUPLE',
          ...item.targetCouple,
        })),
        ...users.map(item => ({
          type: 'USER',
          ...item.targetUser,
        })),
      ],
      total: totalUsers + totalCouples,
      page: query.page,
      limit: query.limit,
    };
  } 
}

