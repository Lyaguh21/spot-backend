import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OwnerType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';

export class VisitRatingDto {
    @ApiProperty({ example: 'nickname' })
    @IsString()
    nickname!: string;

    @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
    @IsNumber()
    @Min(1)
    @Max(5)
    rating!: number;
}

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

    @ApiPropertyOptional({
        enum: OwnerType,
        default: OwnerType.USER,
        example: OwnerType.USER,
        description: 'USER for personal visits, COUPLE for couple visits',
    })
    @IsOptional()
    @IsEnum(OwnerType)
    ownerType?: OwnerType;

    @ApiPropertyOptional({
        example: 'clz123coupleid',
        description: 'Required only when ownerType is COUPLE',
    })
    @IsOptional()
    @IsString()
    coupleId?: string;

    @ApiPropertyOptional({ example: 'Хорошее место для прогулок' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        type: [VisitRatingDto],
        example: [
            { nickname: 'first_user', rating: 5 },
            { nickname: 'second_user', rating: 4 },
        ],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VisitRatingDto)
    ratings?: VisitRatingDto[];

    @ApiPropertyOptional({ example: false, default: false })
    @IsOptional()
    @IsBoolean()
    isFavorite?: boolean;

    @ApiPropertyOptional({ example: '', default: '' })
    @IsOptional()
    @IsString()
    photoURL?: string;

    @ApiPropertyOptional({ example: '', default: '' })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({ example: '', default: '' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiProperty({ example: '2026-05-30T10:00:00.000Z', format: 'date-time' })
    @IsDateString()
    visitDate!: string;
}
