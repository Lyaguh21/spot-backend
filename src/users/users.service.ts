import { Injectable, NotFoundException } from '@nestjs/common';
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
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.userProfileSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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
      where: {
        username,
      },
      select: this.userProfileSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

// async findById(id: string) {
//   const user =
//     await this.prisma.user.findUnique({
//       where: { id },
//       include: {
//         coupleMember: {
//           include: {
//             couple: true,
//           },
//         },
//       },
//     });

//   if (!user) {
//     throw new NotFoundException(
//       'User not found',
//     );
//   }

//   return user;
// }

async findById(id: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new NotFoundException(
      'User not found',
    );
  }

  return user;
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



}
