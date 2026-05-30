import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class JoinCoupleDto {
    @ApiProperty({ example: 'abcd-1234' })
    @IsString()
    inviteCode!: string;
}