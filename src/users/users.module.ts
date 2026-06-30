import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { StorageModule } from "src/storage/storage.module";

@Module({
  imports: [JwtModule.register({}), StorageModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
