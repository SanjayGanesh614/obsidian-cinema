/**
 * Asynchronously decodes poster images off the main thread via createImageBitmap
 * with { premultiplyAlpha: 'none' }, preventing UI thread freeze while preserving
 * pristine poster quality, accurate colors, and uncorrupted alpha channels.
 */
export async function loadPosterBitmap(imageUrl: string): Promise<ImageBitmap> {
  if (!imageUrl) {
    throw new Error('Image URL is empty');
  }

  if (typeof fetch === 'function' && typeof createImageBitmap === 'function') {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      return await createImageBitmap(blob, { premultiplyAlpha: 'none' });
    } catch (fetchErr) {
      if (typeof Image !== 'undefined') {
        return new Promise<ImageBitmap>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            createImageBitmap(img, { premultiplyAlpha: 'none' }).then(resolve).catch(reject);
          };
          img.onerror = reject;
          img.src = imageUrl;
        });
      }
      throw fetchErr;
    }
  }

  throw new Error('createImageBitmap is not supported in this environment');
}
