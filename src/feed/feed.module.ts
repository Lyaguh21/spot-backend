import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VisitsModule } from 'src/visits/visits.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [PrismaModule, VisitsModule, StorageModule],
  providers: [FeedService],
  controllers: [FeedController]
})
export class FeedModule {}
