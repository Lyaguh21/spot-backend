import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'user_123' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'Саша' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'SupePassword123' })
  @IsString()
  @MinLength(4)
  password!: string;
}
