export interface OptimizedImageResult {
  dataUrl: string;
  fileName: string;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  width: number;
  height: number;
}

/**
 * Optimizes an image file from a mobile phone or computer.
 * Downscales high-resolution photos (e.g. 12-48MP from phones) to crisp web-ready
 * dimensions (max 1200px) so they fit comfortably in state and storage
 * without losing visual clarity.
 */
export function optimizeImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.85
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file from device'));

    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();

      img.onerror = () => reject(new Error('Could not process image format'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio-preserving dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // If canvas context fails, fallback to raw data
          return resolve({
            dataUrl: rawDataUrl,
            fileName: file.name,
            originalSizeBytes: file.size,
            optimizedSizeBytes: file.size,
            width: img.width,
            height: img.height,
          });
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG transparency if PNG, otherwise use high-quality JPEG
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const optimizedDataUrl = canvas.toDataURL(mimeType, quality);
        const approxSize = Math.round((optimizedDataUrl.length * 3) / 4);

        resolve({
          dataUrl: optimizedDataUrl,
          fileName: file.name,
          originalSizeBytes: file.size,
          optimizedSizeBytes: approxSize,
          width,
          height,
        });
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable string (e.g. 240 KB, 1.2 MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
