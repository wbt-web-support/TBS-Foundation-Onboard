/** Shared rules for questionnaire image uploads (JPG, PNG, WEBP). */

export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";

const VALID_EXT = ["jpg", "jpeg", "png", "webp"];

export function imageExtension(fileNameValue: string): string {
  const match = fileNameValue.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export function validateImageFile(file: File, maxSizeMB: number): string | null {
  const ext = imageExtension(file.name);
  if (!VALID_EXT.includes(ext)) {
    return "Please upload a JPG, JPEG, PNG, or WEBP image.";
  }
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Image is too large. Maximum size is ${maxSizeMB}MB.`;
  }
  return null;
}

export function imageUploadHelperText(maxSizeMB: number): string {
  return `Drag & drop or click to upload (JPG, PNG, WEBP up to ${maxSizeMB}MB)`;
}
