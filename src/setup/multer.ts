import multer, { StorageEngine, Multer } from "multer";
import sharp from "sharp";
import { UTApi, UTFile } from "uploadthing/server";

const storageImg: StorageEngine = multer.memoryStorage();
const uploadImg: Multer = multer({ storage: storageImg });

const processAndUploadImage = async (
  file: Express.Multer.File,
): Promise<string> => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const customFileName = `image-${uniqueSuffix}.webp`;

  const processedBuffer = await sharp(file.buffer)
    .resize(250)
    .webp({ quality: 80 })
    .toBuffer();

  const utapi = new UTApi();
  const utFile = new UTFile([processedBuffer], customFileName);
  const uploadResponse = await utapi.uploadFiles([utFile]);
  const fileUrl = uploadResponse[0].data?.ufsUrl;
  if (!fileUrl) {
    throw new Error("Failed to upload image to UploadThing");
  }
  return fileUrl;
};

export { uploadImg, processAndUploadImage };
