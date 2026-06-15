import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateBugReportDto {
    @ApiProperty({ example: "Ошибка при поиске" })
    @IsString()
    title!: string;

    @ApiProperty({ example: "Поиск не работает по названию места, возвращает пустой результат" })
    @IsString()
    description!: string;

    @ApiProperty({ example: "BUG" })
    @IsString()
    type!: string;

    @ApiProperty({ example: "https://example.com/screenshot.png", required: false })
    @IsOptional()
    @IsString()
    photoUrl?: string;
}