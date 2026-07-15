import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const source = await readFile(resolve(root, "public/favicon.svg"));

const pngTargets = [
  [16, "public/favicon-16x16.png"],
  [32, "public/favicon-32x32.png"],
  [180, "public/apple-touch-icon.png"],
  [192, "public/android-chrome-192x192.png"],
  [512, "public/android-chrome-512x512.png"],
] as const;

await Promise.all(
  pngTargets.map(([size, target]) =>
    sharp(source)
      .resize(size, size, { fit: "fill" })
      .png({ compressionLevel: 9, palette: true })
      .toFile(resolve(root, target)),
  ),
);

const icoImages = await Promise.all(
  [16, 32, 48].map(async (size) => ({
    size,
    data: await sharp(source)
      .resize(size, size, { fit: "fill" })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer(),
  })),
);

function createIco(images: Array<{ size: number; data: Buffer }>) {
  const directorySize = 6 + images.length * 16;
  const directory = Buffer.alloc(directorySize);
  directory.writeUInt16LE(0, 0);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(images.length, 4);

  let imageOffset = directorySize;
  images.forEach(({ size, data }, index) => {
    const entryOffset = 6 + index * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, entryOffset);
    directory.writeUInt8(size >= 256 ? 0 : size, entryOffset + 1);
    directory.writeUInt8(0, entryOffset + 2);
    directory.writeUInt8(0, entryOffset + 3);
    directory.writeUInt16LE(1, entryOffset + 4);
    directory.writeUInt16LE(32, entryOffset + 6);
    directory.writeUInt32LE(data.length, entryOffset + 8);
    directory.writeUInt32LE(imageOffset, entryOffset + 12);
    imageOffset += data.length;
  });

  return Buffer.concat([directory, ...images.map(({ data }) => data)]);
}

const ico = createIco(icoImages);
await Promise.all([
  writeFile(resolve(root, "app/favicon.ico"), ico),
  writeFile(resolve(root, "public/favicon.ico"), ico),
]);
