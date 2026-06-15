import { Controller, Get, SetMetadata, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

const ROLES_KEY = 'roles';

@ApiTags('admin')
@ApiBearerAuth('accessToken')
@Controller('admin')
@UseGuards(RolesGuard)
@SetMetadata(ROLES_KEY, [UserRole.ADMIN])
export class AdminController {
   constructor(private readonly admin: AdminService) {}

   @ApiOperation({ summary: 'Получить сводную статистику админки' })
   @ApiOkResponse({
      description: 'Общая статистика',
      schema: {
         example: {
            users: 128,
            couples: 42,
            places: 319,
         },
      },
   })
   @Get('stats')
   stats() {
      return this.admin.stats();
   }

   @ApiOperation({ summary: 'Получить статистику пользователей' })
   @ApiOkResponse({description: 'Список пользователей с количеством уникальных мест'})
   @Get('users')
   getUsers() {
      return this.admin.getUsersStats();
   }

   @ApiOperation({ summary: 'Получить статистику пар' })
   @ApiOkResponse({description: 'Список пар с количеством уникальных мест'})
   @Get('couples')
   getCouples() {
      return this.admin.getCoupleStats();
   }
}
