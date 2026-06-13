import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class GetFeedDto {
    @IsOptional()
    @Type(() => Number)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    limit = 20;
}