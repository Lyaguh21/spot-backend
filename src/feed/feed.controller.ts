import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { GetFeedDto } from './dto/get-feed.dto';

@ApiTags('feed')
@ApiBearerAuth('accessToken')
@Controller('feed')
export class FeedController {
    constructor(private readonly feed: FeedService) {}

    @ApiOperation({ summary: 'Получить ленту' })
    @ApiOkResponse({ description: 'Список записей ленты' })
    @Get()
    getFeed(
        @CurrentUser('id') userId: string,
        @Query() dto: GetFeedDto
    ) {
        return this.feed.getFeed(userId, dto);
    }
}
