import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

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

    @ApiPropertyOptional({
        type: [String],
        example: ["https://example.com/screenshot-1.png", "https://example.com/screenshot-2.png"],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    photos?: string[];
}