import { Module } from '@nestjs/common';
import { CouplesService } from './couples.service';
import { CouplesController } from './couples.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [CouplesService],
  controllers: [CouplesController],
  exports: [CouplesService]
})
export class CouplesModule {}
