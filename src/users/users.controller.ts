import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/auth/types/auth-user.type';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { GetUserVisitsDto } from './dto/get-user-visits.dto';

@ApiTags('users')
@ApiBearerAuth('accessToken')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiOperation({ summary: 'Получить мой профиль' })
  // @ApiOkResponse({ type: UserProfileResponseDto })
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.users.getMe(String(user.id));
  }

  @ApiOperation({ summary: 'Обновить мой профиль' })
  @ApiBody({ type: UpdateUserDto })
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
    return this.users.updateMe(String(user.id), dto);
  }

  @ApiOperation({ summary: 'Получить пользователя по username' })
  @ApiParam({ name: 'username', example: 'alex' })
  @Get(':username')
  findByUsername(@Param('username') username: string) {
    return this.users.findByUsername(username);
  }

  @Get('id/:id')
  findById(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @ApiOperation({ summary: 'Получить посещения пользователя' })
  @ApiOkResponse({ description: 'Список посещений пользователя' })
  @Get(':username/visits')
  getUserVisits(
    @Param('username') username: string,
    @Query() query: GetUserVisitsDto,
  ) {
    return this.users.getUserVisits(username, query);
  }
}
