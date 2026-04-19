/**
 * Uploads an image file to ImgBB and returns the display URL with progress tracking.
 * @param {File} file - The image file to upload.
 * @param {Function} onProgress - Optional callback for upload progress (0-100).
 * @returns {Promise<string>} - The URL of the uploaded image.
 */
export function uploadImageToImgBB(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Standard API key - should preferably come from env but keeping it robust
    const API_KEY = "1d1f0d90c8b5e24ebdfec95f9c4019ab";
    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();
    
    // Listen for progress updates
    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            resolve(response.data.url);
          } else {
            reject(new Error(response.error?.message || "Upload failed"));
          }
        } catch (e) {
          reject(new Error("Failed to parse response"));
        }
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    
    xhr.open("POST", `https://api.imgbb.com/1/upload?key=${API_KEY}`);
    xhr.send(formData);
  });
}
