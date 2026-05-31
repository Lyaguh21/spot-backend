import {
    Body,
    Controller,
    Get,
    Param,
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

import { CouplesService } from './couples.service';
import { JoinCoupleDto } from './dto/join-couple.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('couples')
@ApiBearerAuth('accessToken')
@Controller('couples')
export class CouplesController {
    constructor(private readonly couples: CouplesService) {}

    @ApiOperation({ summary: 'Создать пару' })
    @ApiCreatedResponse({ description: 'Созданная пара' })
    @Post()
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
    findOne(@Param('id') id: string) {
        return this.couples.findOne(id);
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
}
