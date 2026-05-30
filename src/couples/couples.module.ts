import { Module } from '@nestjs/common';
import { CouplesService } from './couples.service';
import { CouplesController } from './couples.controller';

@Module({
  providers: [CouplesService],
  controllers: [CouplesController]
})
export class CouplesModule {}
