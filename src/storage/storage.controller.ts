import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { StorageService, type UploadedStorageFile } from "./storage.service";
import { FilesInterceptor } from "@nestjs/platform-express";

@ApiTags("storage")
@Controller("storage")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @ApiOperation({ summary: "Загрузить файл" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
        },
      },
      required: ["file"],
    },
  })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { type: "string" },
        {
          type: "array",
          items: { type: "string" },
        },
      ],
    },
  })
  @Post("upload")
  @UseInterceptors(FilesInterceptor("file"))
  uploadFile(@UploadedFiles() files: UploadedStorageFile[]) {
    if (!files?.length) {
      throw new BadRequestException("File is required");
    }

    return this.storageService.uploadFiles(files);
  }
}
