import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';

export class UpdateVisitRatingDto {
    @ApiPropertyOptional({ example: 'nickname' })
    @IsString()
    nickname!: string;

    @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
    @IsNumber()
    @Min(1)
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

    @ApiPropertyOptional({ example: '2026-05-30T10:00:00.000Z', format: 'date-time' })
    @IsOptional()
    @IsString()
    visitDate?: string;
}
