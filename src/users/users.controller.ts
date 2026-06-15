import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import type { AuthUser } from "src/auth/types/auth-user.type";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";
import { GetUserVisitsDto } from "./dto/get-user-visits.dto";
import { Public } from "src/auth/decorators/public.decorator";
import type { Request } from "express";
import { PaginationDto } from "./dto/pagination.dto";
import { CreateBugReportDto } from "./dto/create-bug-report.dto";

@ApiTags("users")
@ApiBearerAuth("accessToken")
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiOperation({ summary: 'Поиск пользователей' })
  @ApiOkResponse({ description: 'Список пользователей' })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiQuery({ name: "search", required: false, type: String, example: "user" })
  @Get('search')
  searchUsers(
    @Query() query: PaginationDto,
  ) {
    return this.users.searchUsers(query);
  }

  @ApiOperation({ summary: "Получить мой профиль" })
  @Get("me")
  getMe(@CurrentUser() user: AuthUser) {
    return this.users.getMe(String(user.id));
  }

  @ApiOperation({ summary: "Обновить мой профиль" })
  @ApiBody({ type: UpdateUserDto })
  @Patch("me")
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
    return this.users.updateMe(String(user.id), dto);
  }

  @Public()
  @ApiOperation({ summary: "Получить пользователя по username" })
  @ApiParam({ name: "username", example: "alex" })
  @Get(":username")
  findByUsername(@Param("username") username: string, @Req() req: Request) {
    return this.users.findByUsername(username, req.cookies?.accessToken);
  }

  @Public()
  @ApiOperation({ summary: "Получить пользователя по id" })
  @ApiParam({ name: "id", example: "user_123" })
  @ApiOkResponse({ description: "Пользователь найден" })
  @Get("id/:id")
  findById(@Param("id") id: string) {
    return this.users.findById(id);
  }

  @Public()
  @ApiOperation({ summary: "Получить посещения пользователя" })
  @ApiOkResponse({ description: "Список посещений пользователя" })
  @Get(":username/visits")
  getUserVisits(
    @Param("username") username: string,
    @Query() query: GetUserVisitsDto,
  ) {
    return this.users.getUserVisits(username, query);
  }

  @ApiOperation({ summary: "Получить места, которые посетил пользователь" })
  @ApiOkResponse({ description: "Список мест, которые посетил пользователь" })
  @Get(":username/places")
  getUserPlaces(
    @Param("username") username: string,
    @Query() query: GetUserVisitsDto,
  ) {
    return this.users.getUserPlaces(username, query);
  }

  @ApiOperation({ summary: "Подписаться на пользователя" })
  @ApiOkResponse({ description: "Успешная подписка на пользователя" })
  @Post(":username/follow")
  followToUser(
    @Param("username") username: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.follow(String(user.id), { username });
  }

  @ApiOperation({ summary: "Отписаться от пользователя" })
  @ApiOkResponse({ description: "Успешная отписка от пользователя" })
  @Delete(":username/follow")
  unfollowToUser(
    @Param("username") username: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.unfollow(String(user.id), { username });
  }

  @Public()
  @ApiOperation({ summary: "Получить подписчиков пользователя" })
  @ApiParam({ name: "username", example: "user_123" })
  @ApiOkResponse({ description: "Список подписчиков пользователя" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiQuery({ name: "search", required: false, type: String, example: "user" })
  @Get(":username/followers")
  getFollowers(
    @Param("username") username: string,
    @Query() query: PaginationDto,
  ) {
    return this.users.getFollowers(username, query);
  }

  @Public()
  @ApiOperation({ summary: "Получить подписки пользователя" })
  @ApiParam({ name: "username", example: "user_123" })
  @ApiOkResponse({ description: "Список подписок пользователя" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiQuery({ name: "search", required: false, type: String, example: "user" })
  @Get(":username/following")
  getFollowing(
    @Param("username") username: string,
    @Query() query: PaginationDto,
  ) {
    return this.users.getFollowing(username, query);
  }

  @ApiOperation({ summary: "Создать баг-репорт" })
  @ApiBody({ type: CreateBugReportDto })
  @ApiOkResponse({ description: "Баг-репорт успешно создан" })
  @Post('bug-reports')
  createBugReport(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBugReportDto,
  ) {
    return this.users.createBugReport(user.id, dto);
  }
}

