import { ApiPropertyOptional } from '@nestjs/swagger';
import { Visibility } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUrl, Length } from 'class-validator';

function normalizeAvatarUrl(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === '') {
    return value as null | undefined;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    if (trimmedValue.startsWith('{')) {
      try {
        return normalizeAvatarUrl(JSON.parse(trimmedValue) as unknown);
      } catch {
        return trimmedValue;
      }
    }

    return trimmedValue;
  }

  if (typeof value !== 'object') {
    return value as string;
  }

  const record = value as { data?: unknown; url?: unknown; signedUrl?: unknown };

  if (record.data !== undefined) {
    return normalizeAvatarUrl(record.data);
  }

  if (typeof record.url === 'string') {
    return normalizeAvatarUrl(record.url);
  }

  if (typeof record.signedUrl === 'string') {
    return normalizeAvatarUrl(record.signedUrl);
  }

  return value as unknown as string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Алекс' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @ApiPropertyOptional({ example: 'Люблю кофе и хорошие обеды' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/alex.jpg' })
  @IsOptional()
  @Transform(({ value }) => normalizeAvatarUrl(value))
  @IsUrl()
  avatarUrl?: string | null;

  @ApiPropertyOptional({ example: Visibility.PUBLIC, enum: Visibility })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
