import { Test, TestingModule } from "@nestjs/testing";
import { StorageController } from "./storage.controller";
import { StorageService, type UploadedStorageFile } from "./storage.service";

describe("StorageController", () => {
  let controller: StorageController;
  let storageService: Pick<StorageService, "uploadFiles">;

  beforeEach(async () => {
    storageService = {
      uploadFiles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageService,
          useValue: storageService,
        },
      ],
    }).compile();

    controller = module.get<StorageController>(StorageController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("returns persistent and signed url data for a single uploaded file", async () => {
    const files = [createFile("1.jpg")];
    const uploaded = {
      url: "https://storage/1.jpg",
      signedUrl: "https://storage/1.jpg?signed=1",
    };

    jest
      .mocked(storageService.uploadFiles)
      .mockResolvedValue(uploaded);

    await expect(controller.uploadFile(files)).resolves.toEqual({
      data: uploaded,
    });
    expect(storageService.uploadFiles).toHaveBeenCalledWith(files);
  });

  it("returns persistent and signed url data for multiple uploaded files", async () => {
    const files = [createFile("1.jpg"), createFile("2.jpg")];
    const urls = [
      {
        url: "https://storage/1.jpg",
        signedUrl: "https://storage/1.jpg?signed=1",
      },
      {
        url: "https://storage/2.jpg",
        signedUrl: "https://storage/2.jpg?signed=1",
      },
    ];

    jest.mocked(storageService.uploadFiles).mockResolvedValue(urls);

    await expect(controller.uploadFile(files)).resolves.toEqual({
      data: urls,
    });
    expect(storageService.uploadFiles).toHaveBeenCalledWith(files);
  });
});

function createFile(originalname: string): UploadedStorageFile {
  return {
    originalname,
    buffer: Buffer.from("file"),
    mimetype: "image/jpeg",
  };
}
