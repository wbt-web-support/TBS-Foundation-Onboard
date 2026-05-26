import { NextRequest, NextResponse } from "next/server";
import { findPredefinedAnswer, predefinedQA } from "@/lib/chat/predefinedQA";
import { buildFormQuestionsContext } from "@/lib/chat/formQuestionsContext";

// Simple in-memory conversation store (per-process, resets on restart)
const sessions = new Map<string, { role: "user" | "assistant"; content: string }[]>();

function getHistory(sessionId: string) {
  return sessions.get(sessionId) ?? [];
}

function setHistory(
  sessionId: string,
  history: { role: "user" | "assistant"; content: string }[]
) {
  sessions.set(sessionId, history.slice(-10));
  if (sessions.size > 1000) {
    const firstKey = sessions.keys().next().value;
    if (firstKey) sessions.delete(firstKey);
  }
}

const knowledgeBase = Object.entries(predefinedQA)
  .map(([q, a]) => `Q: ${q}\nA: ${a}`)
  .join("\n\n");

const formQuestionsContext = buildFormQuestionsContext();

const SYSTEM_PROMPT = `You are a helpful onboarding assistant for We Build Trades (https://webuildtrades.com), a digital marketing agency specialising in the trades industry.

You help clients complete their onboarding questionnaire by answering questions about the process, explaining what information is needed, and providing guidance.

When a user asks about any question in the form (e.g. "what is tax identification number?", "why do you need my logo?", "what is company registration number?"), use the form questions reference below to explain clearly what the question is asking for and why it is needed.

Knowledge base:
${knowledgeBase}

${formQuestionsContext}

Formatting rules:
- Use HTML for formatting: <strong>, <ul>, <li>, <ol>, <p>, <a href="..." target="_blank">, <br/>
- Use <h4> for section headings
- Keep responses concise and friendly
- If you don't know something specific to the client's business, say so and suggest they contact the We Build Trades team`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId } = body as { message?: string; sessionId?: string };

    if (!message?.trim() || !sessionId?.trim()) {
      return NextResponse.json({ error: "message and sessionId are required" }, { status: 400 });
    }

    // Check predefined answers first
    const predefined = findPredefinedAnswer(message);
    if (predefined) {
      const history = getHistory(sessionId);
      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: predefined });
      setHistory(sessionId, history);
      return NextResponse.json({ reply: predefined, isHtml: true });
    }

    // Build conversation history
    const history = getHistory(sessionId);
    history.push({ role: "user", content: message });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://onboarding.webuildtrades.com",
        "X-Title": "WBT Onboarding Chat",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 600,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.slice(-8),
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenRouter error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await res.json();
    const reply: string = data.choices?.[0]?.message?.content ?? "";

    history.push({ role: "assistant", content: reply });
    setHistory(sessionId, history);

    return NextResponse.json({ reply, isHtml: true });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
