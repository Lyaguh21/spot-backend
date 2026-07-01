import { ApiPropertyOptional } from '@nestjs/swagger';
import { VisitStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Max,
    ValidateNested,
} from 'class-validator';

export class UpdateVisitRatingDto {
    @ApiPropertyOptional({ example: 'nickname' })
    @IsString()
    nickname!: string;

    @ApiPropertyOptional({ example: 5, minimum: 0, maximum: 5 })
    @IsNumber()
    @IsPositive()
    @Max(5)
    rating!: number;
}

export class UpdateVisitDto {
    @ApiPropertyOptional({ example: 'Big Kremlin Palace' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ example: 'Good place for walking' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'Moscow, Krymsky Val, 9' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({
        type: [UpdateVisitRatingDto],
        example: [
            { nickname: 'first_user', rating: 5 },
            { nickname: 'second_user', rating: 4 },
        ],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateVisitRatingDto)
    ratings?: UpdateVisitRatingDto[];

    @ApiPropertyOptional({ example: false, default: false })
    @IsOptional()
    @IsBoolean()
    isFavorite?: boolean;

    @ApiPropertyOptional({
        type: [String],
        example: [
            "https://storage.../1.jpg",
            "https://storage.../2.jpg"
        ]
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    photos?: string[];

    @ApiPropertyOptional({ example: '', default: '' })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({ example: '', default: '' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({
        enum: VisitStatus,
        example: VisitStatus.PLANNED,
        description: 'VISITED for visited places, PLANNED for places in plans',
    })
    @IsOptional()
    @IsEnum(VisitStatus)
    status?: VisitStatus;

    @ApiPropertyOptional({ example: '2026-05-30T10:00:00.000Z', format: 'date-time' })
    @IsOptional()
    @IsString()
    visitDate?: string;
}
