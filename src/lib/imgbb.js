/**
 * Uploads an image file to ImgBB and returns the display URL.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} - The URL of the uploaded image.
 */
export async function uploadImageToImgBB(file) {
    const API_KEY = "1d1f0d90c8b5e24ebdfec95f9c4019ab";
    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
            return data.data.url;
        } else {
            throw new Error(data.error?.message || "Failed to upload image");
        }
    } catch (error) {
        console.error("ImgBB Upload Error:", error);
        throw error;
    }
}
