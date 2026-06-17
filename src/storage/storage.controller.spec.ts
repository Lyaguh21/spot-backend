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

  it("returns url string for a single uploaded file", async () => {
    const files = [createFile("1.jpg")];

    jest
      .mocked(storageService.uploadFiles)
      .mockResolvedValue("https://storage/1.jpg");

    await expect(controller.uploadFile(files)).resolves.toBe(
      "https://storage/1.jpg",
    );
    expect(storageService.uploadFiles).toHaveBeenCalledWith(files);
  });

  it("returns url array for multiple uploaded files", async () => {
    const files = [createFile("1.jpg"), createFile("2.jpg")];
    const urls = ["https://storage/1.jpg", "https://storage/2.jpg"];

    jest.mocked(storageService.uploadFiles).mockResolvedValue(urls);

    await expect(controller.uploadFile(files)).resolves.toEqual(urls);
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
