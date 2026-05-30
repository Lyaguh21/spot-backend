import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
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
  // @ApiOkResponse({ type: UserProfileResponseDto })
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
    return this.users.updateMe(String(user.id), dto);
  }

  @ApiOperation({ summary: 'Получить пользователя по username' })
  @ApiParam({ name: 'username', example: 'alex' })
  // @ApiOkResponse({ type: UserProfileResponseDto })
  @Get(':username')
  findByUsername(@Param('username') username: string) {
    return this.users.findByUsername(username);
  }
}
