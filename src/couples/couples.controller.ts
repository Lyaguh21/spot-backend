import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiBody,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
    ApiCreatedResponse,
} from '@nestjs/swagger';

import { UsersService } from '../users/users.service';
import { CouplesService } from './couples.service';
import { JoinCoupleDto } from './dto/join-couple.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/auth/types/auth-user.type';
import { UpdateCoupleDto } from './dto/update-couple.dto';

@ApiTags('couples')
@ApiBearerAuth('accessToken')
@Controller('couples')
export class CouplesController {
    constructor(
        private readonly couples: CouplesService,
        private readonly users: UsersService
    ) {}

    @ApiOperation({ summary: 'Создать пару' })
    @ApiCreatedResponse({ description: 'Созданная пара' })
    @Get()
    create(@CurrentUser('id') userId: string) {
        return this.couples.create(userId);
    }

    @ApiOperation({ summary: 'Присоединиться к паре по коду' })
    @ApiBody({ type: JoinCoupleDto })
    @ApiOkResponse({ description: 'Успешное присоединение' })
    @Post('join')
    join(
        @CurrentUser('id') userId: string,
        @Body() dto: JoinCoupleDto,
    ) {
        return this.couples.join(userId, dto);
    }

    @ApiOperation({ summary: 'Получить мою пару' })
    @ApiOkResponse({ description: 'Информация о моей паре' })
    @Get('me')
    getMyCouple(@CurrentUser('id') userId: string) {
        return this.couples.getMyCouple(userId);
    }

    @ApiOperation({ summary: 'Обновить профиль пары' })
    @ApiOkResponse({ description: 'Информация о паре обновлена' })
    @Patch(':id')
    update(
        @Param('id') coupleId: string,
        @CurrentUser() user: AuthUser,
        @Body() dto: UpdateCoupleDto,
    ) {
        return this.couples.update(dto, String(user.id), coupleId);
    }

    @ApiOperation({ summary: 'Обновить код приглашения' })
    @ApiCreatedResponse({ description: 'Новый код приглашения' })
    @Post('reset-invite-code')
    resetInviteCode(@CurrentUser('id') userId: string) {
        return this.couples.resetInviteCode(userId);
    }

    @ApiOperation({ summary: 'Получить пару по id' })
    @ApiParam({ name: 'id', example: 'couple_123' })
    @ApiOkResponse({ description: 'Данные пары' })
    @Get(':id')
    findOne(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.couples.findOne(id, userId);
    }

    @ApiOperation({ summary: 'Получить посещения пары' })
    @ApiParam({ name: 'id', example: 'couple_123' })
    @ApiOkResponse({ description: 'Список посещений пары' })
    @Get(':id/visits')
    findVisits(@Param('id') id: string) {
        return this.couples.findVisits(id);
    }

    @ApiOperation({ summary: 'Получить места, которые посетила пара' })
    @ApiOkResponse({ description: 'Список мест, которые посетила пара' })
    @Get(':id/places')
    getCouplePlaces(@Param('id') id: string,) {
        return this.couples.getCouplePlaces(id);
    }

    @ApiOperation({ summary: 'Выйти из пары' })
    @ApiOkResponse({ description: 'Успешный выход из пары' })
    @Delete(':id')
    coupleLeave(
        @Param('id') coupleId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.couples.coupleLeave(coupleId, String(user.id));
    }

    @ApiOperation({ summary: 'Подписаться на пару' })
    @ApiOkResponse({ description: 'Успешная подписка на пару' })
    @Post(':id/follow')
    followToCouple(
        @Param('id') coupleId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.users.follow(String(user.id), {
            coupleId,
        });
    }

    @ApiOperation({ summary: 'Отписаться от пары' })
    @ApiOkResponse({ description: 'Успешная отписка от пары' })
    @Delete(':id/follow')
    unfollowToCouple(
        @Param('id') coupleId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.users.unfollow(String(user.id), {
            coupleId,
        });
    }

    @ApiOperation({ summary: 'Получить подписчиков пары' })
    @ApiParam({ name: 'id', example: 'couple_123' })
    @ApiOkResponse({ description: 'Список подписчиков пары' })
    @Get(':id/followers')
    getFollowers(
        @Param('id') id: string,
    ) {
        return this.couples.getFollowers(id);
    }
}
