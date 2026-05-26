import { NextRequest, NextResponse } from "next/server";
import type { BuilderStep } from "@/lib/builder/types";

const SYSTEM_PROMPT = `You are a friendly website design assistant for We Build Trades.
Your job is to help trades business owners customise their website template step by step.
Keep messages short, enthusiastic, and professional.
Always acknowledge the user's selection positively before describing what changed.
Use simple English — no jargon.`;

const STEP_PROMPTS: Record<BuilderStep, string> = {
  welcome: "",
  color: `The user just selected a color scheme for their website. Confirm their choice in 1-2 sentences and tell them the preview has been updated. Then encourage them to click Next Step.`,
  button: `The user just chose a button style. Confirm in 1-2 sentences, mention how it gives the site a specific feel, and tell them the preview updated.`,
  font: `The user picked a font pairing. Confirm in 1-2 sentences, describe the mood/feel it creates, and encourage them to continue.`,
  header: `The user chose a header layout. Confirm in 1-2 sentences and tell them the preview is updated.`,
  footer: `The user chose a footer style. Confirm in 1-2 sentences and tell them their design is almost complete.`,
  done: `The user has finished customising their template. Congratulate them warmly in 2-3 sentences. Tell them their choices have been saved and the We Build Trades team will use these preferences to build their website.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, selectionLabel, templateName } = body as {
      step: BuilderStep;
      selectionLabel?: string;
      templateName?: string;
    };

    const userContext = selectionLabel
      ? `The user selected: "${selectionLabel}"${templateName ? ` for the "${templateName}" template` : ""}.`
      : `The user is on step: ${step}${templateName ? ` for the "${templateName}" template` : ""}.`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${userContext}\n\n${STEP_PROMPTS[step] || "Greet the user and help them start customising."}` },
    ];

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://onboarding.webuildtrades.com",
        "X-Title": "WBT Template Builder",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 200,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenRouter error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await res.json();
    const reply: string = data.choices?.[0]?.message?.content ?? "Great choice! The preview has been updated.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Builder chat error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
