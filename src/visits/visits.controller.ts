import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
    ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { VisitsService } from './visits.service';

@ApiTags('visits')
@ApiBearerAuth('accessToken')
@Controller('visits')
export class VisitsController {
    constructor(private readonly visits: VisitsService) {}

    @ApiOperation({ summary: 'Создать посещение' })
    @ApiBody({ type: CreateVisitDto })
    @ApiCreatedResponse({ description: 'Созданное посещение' })
    @Post()
    create(
        @CurrentUser('sub') userId: string, 
        @Body() dto: CreateVisitDto,
    ) {
        return this.visits.create(userId, dto);
    }

    @ApiOperation({ summary: 'Получить посещение по id' })
    @ApiParam({ name: 'id', example: 'clz123visitid' })
    @ApiOkResponse({ description: 'Данные посещения' })
    @ApiNotFoundResponse({ description: 'Visit not found' })
    @Get(':id')
    findOne(@Param('id') id: string,) {
        return this.visits.findOne(id);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Получить посещения пользователя' })
    @ApiParam({ name: 'userId', example: '2994aa76-2c5e-48ab-acbe-367c9a7957dc' })
    @ApiOkResponse({ description: 'Список посещений пользователя' })
    findByUser(@Param('userId') userId: string) {
        return this.visits.findByUser(userId);
    }

    @Get('couple/:coupleId')
    @ApiOperation({ summary: 'Получить посещения пары' })
    @ApiParam({ name: 'coupleId', example: 'couple_123' })
    @ApiOkResponse({ description: 'Список посещений пары' })
    findByCouple(@Param('coupleId') coupleId: string) {
        return this.visits.findByCouple(coupleId);
    }

    @ApiOperation({ summary: 'Обновить посещение' })
    @ApiParam({ name: 'id', example: 'clz123visitid' })
    @ApiBody({ type: UpdateVisitDto })
    @ApiOkResponse({ description: 'Обновлённое посещение' })
    @ApiNotFoundResponse({ description: 'Visit not found' })
    @Patch(':id')
    update(
        @CurrentUser('sub') userId: string,
        @Param('id') id: string,
        @Body() dto: UpdateVisitDto,
    ) {
        return this.visits.update(userId, id, dto);
    }

    @ApiOperation({ summary: 'Удалить посещение' })
    @ApiParam({ name: 'id', example: 'clz123visitid' })
    @ApiOkResponse({ description: 'Посещение удалено' })
    @ApiNotFoundResponse({ description: 'Visit not found' })
    @Delete(':id')
    delete(
        @CurrentUser('sub') userId: string,
        @Param('id') id: string,
    ) {
        return this.visits.delete(userId, id);
    }
}
