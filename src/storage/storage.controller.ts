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
      type: "object",
      properties: {
        data: {
          oneOf: [
            { type: "string" },
            {
              type: "array",
              items: { type: "string" },
            },
          ],
        },
      },
      required: ["data"],
    },
  })
  @Post("upload")
  @UseInterceptors(FilesInterceptor("file"))
  async uploadFile(@UploadedFiles() files: UploadedStorageFile[]) {
    if (!files?.length) {
      throw new BadRequestException("File is required");
    }

    const uploaded = await this.storageService.uploadFiles(files);

    if (Array.isArray(uploaded)) {
      return {
        data: uploaded,
      };
    }

    return {
      data: uploaded,
    };
  }
}
