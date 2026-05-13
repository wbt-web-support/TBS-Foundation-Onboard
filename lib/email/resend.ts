import { Resend } from "resend";

let cached: Resend | null = null;

function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  cached = new Resend(key);
  return cached;
}

export async function sendResumeEmail(to: string, link: string): Promise<void> {
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  const resend = getResend();
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Continue your Foundation onboarding",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
        <h2 style="margin:0 0 12px">Pick up where you left off</h2>
        <p style="margin:0 0 16px;color:#475569;line-height:1.5">
          Thanks for getting started on your onboarding questionnaire. Your answers are saved.
          Use the button below any time to continue, no need to start over.
        </p>
        <p style="margin:0 0 24px">
          <a href="${link}"
             style="display:inline-block;background:#d94e15;color:#fff;text-decoration:none;
                    padding:12px 22px;border-radius:8px;font-weight:600">
            Continue onboarding
          </a>
        </p>
        <p style="margin:0;color:#94a3b8;font-size:13px;word-break:break-all">${link}</p>
      </div>
    `,
  });
  if (error) throw new Error(typeof error === "string" ? error : error.message ?? "Email send failed");
}
