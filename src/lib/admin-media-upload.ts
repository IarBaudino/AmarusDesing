"use client";

import { getAuthHeaders } from "@/lib/auth-headers";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { compressVideoForWeb } from "@/lib/storage/compress-video-client";
import { compressImageInBrowser } from "@/lib/storage/compress-image-client";

export type AdminUploadResult = {
  success: boolean;
  publicId: string;
  url: string;
  width?: number;
  height?: number;
  resourceType: "image" | "video";
  message?: string;
  optimized?: boolean;
};

export type AdminUploadProgress = {
  phase: "compressing" | "uploading";
  progress?: number;
  message: string;
};

const IMAGE_SERVER_MAX = 5 * 1024 * 1024;
const VIDEO_SIGNED_MAX = 30 * 1024 * 1024;

/**
 * Sube imagen o vídeo al admin: imágenes vía API (servidor); vídeos comprimidos en el navegador y luego subida firmada.
 */
export async function uploadAdminMedia(
  file: File,
  folder: string,
  onProgress?: (p: AdminUploadProgress) => void
): Promise<AdminUploadResult> {
  const isVideo =
    file.type.startsWith("video/") ||
    /\.(mp4|mov|m4v|hevc|webm|avi|wmv|3gp|3g2|mts|m2ts)$/i.test(file.name);

  if (isVideo) {
    if (file.size > VIDEO_SIGNED_MAX) {
      throw new Error("El video no puede ser mayor a 30MB");
    }

    let uploadFile = file;
    let optimized = false;

    try {
      onProgress?.({
        phase: "compressing",
        message: "Comprimiendo vídeo para la web…",
      });
      uploadFile = await compressVideoForWeb(file, (p) => {
        onProgress?.({
          phase: "compressing",
          progress: p.progress,
          message: p.message,
        });
      });
      optimized = uploadFile !== file;
    } catch (err) {
      console.warn("Compresión de vídeo omitida:", err);
      uploadFile = file;
    }

    if (uploadFile.size > VIDEO_SIGNED_MAX) {
      throw new Error(
        "El vídeo comprimido sigue siendo mayor a 30MB. Usa un clip más corto."
      );
    }

    onProgress?.({
      phase: "uploading",
      message: "Subiendo vídeo…",
    });

    const headers = {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    };
    const signRes = await fetch("/api/storage/signed-upload", {
      method: "POST",
      headers,
      body: JSON.stringify({
        folder,
        fileName: uploadFile.name,
        contentType: uploadFile.type || "video/mp4",
        isVideo: true,
        fileSize: uploadFile.size,
      }),
    });
    const signText = await signRes.text();
    let signData: {
      path?: string;
      token?: string;
      publicId?: string;
      url?: string;
      message?: string;
    } | null = null;
    try {
      signData = signText ? JSON.parse(signText) : null;
    } catch {
      signData = null;
    }
    if (!signRes.ok || !signData?.path || !signData?.token) {
      if (signRes.status === 413) {
        throw new Error(
          "El vídeo es demasiado grande para prepararlo. Usa un clip más corto o más ligero."
        );
      }
      throw new Error(
        signData?.message ||
          `No se pudo preparar la subida del video (error ${signRes.status}).`
      );
    }
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.storage
      .from(
        process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || "images"
      )
      .uploadToSignedUrl(signData.path, signData.token, uploadFile, {
        contentType: uploadFile.type || "video/mp4",
        upsert: false,
      });
    if (error) {
      throw new Error(error.message || "Error al subir video a Supabase");
    }
    return {
      success: true,
      publicId: signData.publicId || signData.path,
      url: signData.url || "",
      resourceType: "video",
      optimized,
    };
  }

  if (file.size > IMAGE_SERVER_MAX) {
    throw new Error("La imagen no puede ser mayor a 5MB");
  }

  onProgress?.({
    phase: "compressing",
    message: "Optimizando imagen…",
  });

  let uploadFile = file;
  try {
    uploadFile = await compressImageInBrowser(file);
  } catch {
    uploadFile = file;
  }

  onProgress?.({
    phase: "uploading",
    message: "Subiendo imagen…",
  });
  const formData = new FormData();
  formData.append("file", uploadFile);
  formData.append("folder", folder);
  const res = await fetch("/api/upload-image", {
    method: "POST",
    headers: await getAuthHeaders(),
    body: formData,
  });

  const text = await res.text();
  let data: (AdminUploadResult & { message?: string }) | null = null;
  try {
    data = text ? (JSON.parse(text) as AdminUploadResult & { message?: string }) : null;
  } catch {
    data = null;
  }

  if (!res.ok || !data || !data.success) {
    if (res.status === 413) {
      throw new Error(
        "La imagen es demasiado grande para subirla. Prueba con una foto más ligera o reduce su tamaño."
      );
    }
    throw new Error(
      data?.message || `No se pudo subir la imagen (error ${res.status}).`
    );
  }
  return data;
}
