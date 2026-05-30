import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Visibility } from '@prisma/client';
import { OwnerType } from '@prisma/client';
import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class CreateVisitDto {
    
    // Place

    @ApiPropertyOptional({ example: 'ext-123' })
    @IsOptional()
    @IsString()
    externalId?: string;

    @ApiProperty({ example: 'Парк Горького' })
    @IsString()
    title!: string;

    @ApiProperty({ example: 55.7297 })
    @IsNumber()
    lat!: number;

    @ApiProperty({ example: 37.6033 })
    @IsNumber()
    lng!: number;

    @ApiPropertyOptional({ example: 'Москва, Крымский Вал, 9' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ example: 'https://gorkypark.ru' })
    @IsOptional()
    @IsString()
    websiteUrl?: string;

    // Visit

    @IsEnum(OwnerType)
    ownerType!: OwnerType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    coupleId?: string;

    @ApiPropertyOptional({ example: 'Хорошее место для прогулок' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiProperty({ example: true })
    @IsBoolean()
    isFavorite!: boolean;

    @ApiProperty({ example: '2026-05-30T10:00:00.000Z', format: 'date-time' })
    @IsDateString()
    visitDate!: string;

    @ApiPropertyOptional({ example: Visibility.PUBLIC, enum: Visibility })
    @IsOptional()
    @IsEnum(Visibility)
    visibility?: Visibility;
}