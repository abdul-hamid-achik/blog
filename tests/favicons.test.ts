import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "..");

describe("brand icons", () => {
  it("keeps the vector source aligned with the editorial palette", async () => {
    const source = await readFile(
      resolve(repositoryRoot, "public/favicon.svg"),
      "utf8",
    );

    expect(source).toContain("#20211f");
    expect(source).toContain("#f3f0e8");
    expect(source).toContain("#e58463");
  });

  it.each([
    ["public/favicon-16x16.png", 16],
    ["public/favicon-32x32.png", 32],
    ["public/apple-touch-icon.png", 180],
    ["public/android-chrome-192x192.png", 192],
    ["public/android-chrome-512x512.png", 512],
  ])("renders %s at %ipx", async (relativePath, size) => {
    const metadata = await sharp(
      resolve(repositoryRoot, relativePath),
    ).metadata();

    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(size);
    expect(metadata.height).toBe(size);
  });

  it("packages the standard favicon sizes in the ICO file", async () => {
    const icon = await readFile(resolve(repositoryRoot, "app/favicon.ico"));

    expect(icon.readUInt16LE(0)).toBe(0);
    expect(icon.readUInt16LE(2)).toBe(1);
    expect(icon.readUInt16LE(4)).toBe(3);
    expect([icon.readUInt8(6), icon.readUInt8(22), icon.readUInt8(38)]).toEqual(
      [16, 32, 48],
    );

    const frameOffsets = [0, 1, 2].map((index) =>
      icon.readUInt32LE(6 + index * 16 + 12),
    );

    for (const frameOffset of frameOffsets) {
      expect(icon.subarray(frameOffset, frameOffset + 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
      // PNG IHDR color type 6 is truecolor with alpha. Turbopack requires
      // embedded ICO PNG frames to be RGBA rather than indexed-color images.
      expect(icon.readUInt8(frameOffset + 25)).toBe(6);
    }
  });
});
