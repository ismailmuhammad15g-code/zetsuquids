export interface ResizeOptions {
  width?: number;
  height?: number;
  format?: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
  fitMode?: "fill" | "contain" | "cover";
  backgroundColor?: string;
}

/**
 * Resizes an image using the ResizePro API.
 * @param file - The image file to resize.
 * @param options - Resizing options.
 * @returns A promise that resolves to the resized image as a Blob.
 */
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

  const formData = new FormData();
  formData.append("image", file);
  formData.append("width", String(width));
  formData.append("height", String(height));
  formData.append("format", format);
  formData.append("quality", String(quality));
  formData.append("fitMode", fitMode);
  formData.append("backgroundColor", backgroundColor);

  try {
    const res = await fetch("https://resizepro.onspace.app/api/resize", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let errorMessage = "Resize failed";
      try {
        const err = await res.json();
        errorMessage = err.message || errorMessage;
      } catch (e) {
        // Fallback for non-JSON errors
      }
      throw new Error(errorMessage);
    }

    return await res.blob();
  } catch (error) {
    console.error("ResizePro API Error:", error);
    throw error;
  }
}
