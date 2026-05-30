import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class GetUserVisitsDto {
  @Type(() => Number)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsOptional()
  limit = 20;

  @IsOptional()
  tag?: string;

  @Transform(({ value }) =>
    value === 'true',
  )
  @IsOptional()
  favorite?: boolean;
}