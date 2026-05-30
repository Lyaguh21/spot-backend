import { Visibility } from '@prisma/client';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateVisitDto {
    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    rating?: number;

    @IsOptional()
    @IsBoolean()
    isFavorite?: boolean;

    @IsOptional()
    @IsString()
    visitDate?: string;

    @IsOptional()
    @IsString()
    visibility?: Visibility;
}