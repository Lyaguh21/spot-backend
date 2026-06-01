import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCoupleDto {
    @ApiPropertyOptional({example: 'Любим путешествовать'})
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional({example: false})
    @IsOptional()
    @IsBoolean()
    isPrivate?: boolean;
}