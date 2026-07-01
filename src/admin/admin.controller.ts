import { Controller, Delete, Get, Param, Patch, SetMetadata, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

const ROLES_KEY = 'roles';

@ApiTags('admin')
@ApiBearerAuth('accessToken')
@Controller('admin')
@UseGuards(RolesGuard)
@SetMetadata(ROLES_KEY, [UserRole.ADMIN])
export class AdminController {
   constructor(private readonly admin: AdminService) {}

   @ApiOperation({ summary: 'Получить сводную статистику админки' })
   @ApiOkResponse({description: 'Общая статистика'})
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

   @Delete('users/:id')
   @ApiOperation({ summary: 'Удалить пользователя' })
   deleteUser(
      @Param('id') id: string,
   ) {
      return this.admin.deleteUser(id);
   }

   @Patch('users/:id/restore')
   @ApiOperation({ summary: 'Восстановить пользователя' })
   restoreUser(
      @Param('id') id: string,
   ) {
      return this.admin.restoreUser(id);
   }

   @ApiOperation({ summary: 'Получить статистику пар' })
   @ApiOkResponse({description: 'Список пар с количеством уникальных мест'})
   @Get('couples')
   getCouples() {
      return this.admin.getCoupleStats();
   }

   @ApiOperation({ summary: 'Получить список баг-репортов' })
   @ApiOkResponse({description: 'Список баг-репортов'})
   @Get('bug-reports')
   getBugReports() {
      return this.admin.getBugReports();
   }

   @ApiOperation({ summary: 'Удалить баг-репорт' })
   @ApiParam({ name: 'id', example: 'bug_123' })
   @ApiOkResponse({ description: 'Баг-репорт удалён' })
   @Delete('bug-reports/:id')
   deleteBugReport(@Param('id') id: string) {
      return this.admin.deleteBugReport(id);
   }
}
