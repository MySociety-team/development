/**
 * Client-side image compression and conversion utility.
 * Resizes large photos to optimal dimensions and converts to JPEG base64 data URLs.
 */

export const compressImage = (file, { maxWidth = 1280, maxHeight = 1280, quality = 0.75 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      return reject(new Error("Selected file is not a valid image."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image for compression."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling ratio
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const ratio = Math.min(widthRatio, heightRatio);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback if canvas context is unavailable
          return resolve({
            dataUrl: event.target.result,
            name: file.name,
            size: file.size
          });
        }

        // Draw image smoothly
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        // Estimate size from base64 string
        const sizeInBytes = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          name: file.name,
          size: sizeInBytes
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export const compressMultipleImages = async (fileList, options = {}) => {
  const files = Array.from(fileList);
  const results = await Promise.all(
    files.map((file) =>
      compressImage(file, options).catch((err) => {
        console.error(`Failed to compress ${file.name}:`, err);
        return null;
      })
    )
  );
  return results.filter(Boolean);
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
