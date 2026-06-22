import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VisitsModule } from 'src/visits/visits.module';

@Module({
  imports: [PrismaModule, VisitsModule],
  providers: [FeedService],
  controllers: [FeedController]
})
export class FeedModule {}
