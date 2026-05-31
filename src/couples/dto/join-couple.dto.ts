import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class JoinCoupleDto {
    @ApiProperty({ example: 'ABCDE' })
    @IsString()
    inviteCode!: string;
}