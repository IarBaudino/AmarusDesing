"use client";

type ClientCompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

/** Formatos que el navegador puede decodificar en canvas. HEIC/HEIF se dejan al servidor. */
const CANVAS_DECODABLE = /^image\/(jpeg|jpg|png|webp)$/;

/** Por debajo de este tamaño no vale la pena comprimir en cliente. */
const MIN_BYTES_TO_COMPRESS = 1024 * 1024;

/**
 * Reduce y comprime una imagen en el navegador antes de subirla, para que el
 * cuerpo de la petición no supere el límite de la función serverless (~4.5 MB).
 * El servidor vuelve a comprimir con Sharp; esto es solo una primera pasada.
 * Si el formato no es decodificable o algo falla, devuelve el archivo original.
 */
export async function compressImageInBrowser(
  file: File,
  { maxWidth = 1600, maxHeight = 2000, quality = 0.85 }: ClientCompressOptions = {}
): Promise<File> {
  const mime = (file.type || "").toLowerCase().split(";")[0].trim();

  if (!CANVAS_DECODABLE.test(mime)) return file;
  if (file.size < MIN_BYTES_TO_COMPRESS) return file;
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return file;
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    if (!blob || blob.size >= file.size) return file;

    const stem = file.name.includes(".")
      ? file.name.slice(0, file.name.lastIndexOf("."))
      : file.name;

    return new File([blob], `${stem}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
