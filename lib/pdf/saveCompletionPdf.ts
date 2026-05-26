import { isBunnyStorageConfigured, uploadToBunnyStorage } from "@/lib/bunny/storage";
import type { Answers } from "@/lib/types";
import { buildOnboardingAnswersPdfBuffer, completionPdfFilename } from "./onboardingAnswersPdf";

/** Build completion PDF and upload to Bunny when configured. */
export async function buildAndUploadCompletionPdf(
  answers: Answers,
  submissionId: string,
): Promise<{ buffer: Buffer; filename: string; publicUrl: string | null }> {
  const buffer = await buildOnboardingAnswersPdfBuffer(answers);
  const filename = completionPdfFilename(answers);

  if (!isBunnyStorageConfigured()) {
    return { buffer, filename, publicUrl: null };
  }

  const relativePath = `onboarding-pdfs/${submissionId}/${filename}`;
  const { publicUrl } = await uploadToBunnyStorage({
    relativePath,
    buffer,
    contentType: "application/pdf",
  });

  return { buffer, filename, publicUrl };
}
