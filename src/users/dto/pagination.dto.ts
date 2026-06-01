import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    limit = 20;

    @IsOptional()
    @IsString()
    search?: string;
}