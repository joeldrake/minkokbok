/** Längsta sidan på en sparad omslagsbild. Räcker för omslaget i full bredd på en retinaskärm. */
const MAX_SIDE = 1600;

/**
 * Krymper en bild från t.ex. kamerarullen innan den sparas, så att den tar
 * runt 100–300 kB i stället för flera MB. Bilden ritas via <img>, som följer
 * EXIF-rotationen och i Safari även kan läsa HEIC.
 */
export async function prepareCoverImage(file: Blob): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas saknas');
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Safari kan inte skapa WebP och ger då PNG, som blir stor. Använd JPEG i stället.
    const webp = await toBlob(canvas, 'image/webp', 0.8);
    return webp.type === 'image/webp' ? webp : await toBlob(canvas, 'image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Kunde inte spara bilden'))), type, quality),
  );
}
