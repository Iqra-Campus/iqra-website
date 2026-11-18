// Resizes a chosen photo to a small square JPEG (data URL) so it can be stored in Firestore without Firebase Storage.
export async function photoToDataUrl(file: File, size = 480, wide = false): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image is too large (max 10 MB).");
  const bmp = await createImageBitmap(file);
  // Centre-crop to a square (profile photos) or a 16:9 landscape (course covers).
  const outW = wide ? 720 : size, outH = wide ? 405 : size;
  const targetRatio = outW / outH;
  let sw = bmp.width, sh = bmp.height;
  if (sw / sh > targetRatio) sw = Math.round(sh * targetRatio); else sh = Math.round(sw / targetRatio);
  const canvas = document.createElement("canvas");
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image.");
  ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, outW, outH);
  for (const q of [0.82, 0.7, 0.55]) {
    const url = canvas.toDataURL("image/jpeg", q);
    if (url.length < 200_000) return url;
  }
  throw new Error("Image could not be made small enough. Try another photo.");
}
