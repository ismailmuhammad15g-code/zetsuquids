export interface ResizeOptions {
  width?: number;
  height?: number;
  format?: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
  fitMode?: "fill" | "contain" | "cover";
  backgroundColor?: string;
}

export async function resizeImage(
  file: File,
  options: ResizeOptions = {}
): Promise<Blob> {
  const {
    width = 1200,
    height = 675,
    format = "image/jpeg",
    quality = 92,
    fitMode = "fill",
    backgroundColor = "#ffffff",
  } = options;

  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  let dx = 0, dy = 0, dw = width, dh = height;

  if (fitMode === "cover") {
    const scale = Math.max(width / img.width, height / img.height);
    sw = width / scale;
    sh = height / scale;
    sx = (img.width - sw) / 2;
    sy = (img.height - sh) / 2;
  } else if (fitMode === "contain") {
    const scale = Math.min(width / img.width, height / img.height);
    dw = img.width * scale;
    dh = img.height * scale;
    dx = (width - dw) / 2;
    dy = (height - dh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      format,
      quality / 100
    );
  });
}
