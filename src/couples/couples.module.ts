import { Module } from '@nestjs/common';
import { CouplesService } from './couples.service';
import { CouplesController } from './couples.controller';
import { UsersModule } from 'src/users/users.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [UsersModule, StorageModule],
  providers: [CouplesService],
  controllers: [CouplesController],
  exports: [CouplesService]
})
export class CouplesModule {}
