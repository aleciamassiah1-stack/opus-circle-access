/**
 * Native image picker for avatars and logos.
 *
 * On native platforms (iOS/Android via Capacitor), opens a native bottom sheet
 * with "Take Photo" and "Choose from Library" options. Returns a File that
 * matches the shape used by web file inputs, so callers can reuse upload code.
 *
 * On web, returns null — caller should fall back to a plain <input type="file">.
 */
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { isNative } from "./platform";

export type PickedImage = { file: File; dataUrl: string } | null;

/**
 * Opens the native picker. Returns null if the user cancels OR if not on
 * a native platform (caller should fall back to web file input).
 */
export async function pickNativeImage(opts?: {
  /** Max width/height; image is downscaled to fit. Default 1600. */
  maxDimension?: number;
  /** JPEG quality 0-100. Default 85. */
  quality?: number;
}): Promise<PickedImage> {
  if (!isNative()) return null;
  try {
    const photo = await Camera.getPhoto({
      quality: opts?.quality ?? 85,
      width: opts?.maxDimension ?? 1600,
      height: opts?.maxDimension ?? 1600,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // Shows "Photo / Camera / Cancel" sheet
      promptLabelHeader: "Add Photo",
      promptLabelPhoto: "Choose from Library",
      promptLabelPicture: "Take Photo",
      promptLabelCancel: "Cancel",
    });
    if (!photo.dataUrl) return null;
    const file = dataUrlToFile(photo.dataUrl, `image.${photo.format ?? "jpg"}`);
    return { file, dataUrl: photo.dataUrl };
  } catch (err: any) {
    // User cancelled or denied permission — return null silently
    if (typeof err?.message === "string" && /cancel|denied/i.test(err.message)) {
      return null;
    }
    throw err;
  }
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}
