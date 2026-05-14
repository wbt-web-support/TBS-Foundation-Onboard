import nodemailer from "nodemailer";

/** True when SMTP is fully configured; outbound mail uses SMTP instead of Resend. */
export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASSWORD?.trim(),
  );
}

/** True when `sendOutbound`-style email can be attempted (SMTP or Resend). */
export function isOutboundEmailConfigured(): boolean {
  return isSmtpConfigured() || Boolean(process.env.RESEND_API_KEY?.trim());
}

function defaultFromAddress(): string {
  const explicit = process.env.SMTP_FROM?.trim();
  if (explicit) return explicit;
  return process.env.SMTP_USER!.trim();
}

/**
 * Sends one message over SMTP (STARTTLS on 587, or SSL on 465 when `SMTP_SECURE=true`).
 */
export async function sendMailViaSmtp(options: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  /** Overrides `SMTP_FROM` / user address. */
  from?: string;
  /** Shown to recipients when they hit reply (e.g. applicant business email). */
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
}): Promise<void> {
  const host = process.env.SMTP_HOST!.trim();
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASSWORD!;

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secureExplicit = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure =
    secureExplicit === "true" || secureExplicit === "1" || (!secureExplicit && port === 465);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...(process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "false"
      ? { tls: { rejectUnauthorized: false } }
      : {}),
  });

  const from = options.from?.trim() || defaultFromAddress();

  const info = await transporter.sendMail({
    from,
    to: options.to,
    replyTo: options.replyTo?.trim() || undefined,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType ?? "application/octet-stream",
    })),
  });

  const rejected = [...(info.rejected ?? [])];
  if (rejected.length) {
    throw new Error(`SMTP rejected recipient(s): ${rejected.join(", ")}`);
  }
}
