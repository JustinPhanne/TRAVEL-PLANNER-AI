import ImageKit from "@imagekit/nodejs";

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
  throw new Error("Add IMAGEKIT_PRIVATE_KEY to your .env file");
}

export const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

export async function uploadCoverImageFromUrl(
  sourceUrl: string,
  fileName: string,
): Promise<string> {
  const result = await imagekit.files.upload({
    file: sourceUrl,
    fileName,
    folder: "/trip-covers",
    useUniqueFileName: true,
  });

  if (!result.url) {
    throw new Error("ImageKit upload did not return a URL");
  }

  return result.url;
}
