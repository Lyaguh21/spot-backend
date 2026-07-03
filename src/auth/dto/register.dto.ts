import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'alex' })
  @IsString()
  @Length(3, 10)
  @Matches(/^[A-Za-z]+$/)
  username!: string;

  @ApiProperty({ example: 'Саша' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'SupePassword123' })
  @IsString()
  @MinLength(4)
  password!: string;
}
