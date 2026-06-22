import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [VisitsService],
  controllers: [VisitsController],
  exports: [VisitsService]
})
export class VisitsModule {}
