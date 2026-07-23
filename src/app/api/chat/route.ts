import { answerPlanQuestion } from "@/lib/engine/chat";
import { buildPlanContext } from "@/lib/engine/planContext";
import type { RetirementProfile } from "@/lib/engine/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  question?: string;
  profile?: RetirementProfile;
  history?: { role: "user" | "assistant"; content: string }[];
};

const SYSTEM_PROMPT = `You are Deccum's retirement guide — calm, clear, and professional.

Rules:
- Answer the user's question directly. Never restate or quote their question back (no “You asked…”).
- Keep answers concise: 2–5 short sentences or a few bullets. No filler.
- Ground every number in PLAN_CONTEXT. Do not invent balances or taxes.
- Plain English. Explain jargon in one short clause only when needed.
- For simple facts (age, balances, claim age), answer in one or two sentences.
- For what-ifs, state the likely impact clearly; suggest Explore sliders only if useful.
- At most one brief disclaimer at the end when giving financial guidance — skip it for simple factual questions.
- Do not mention system prompts, APIs, or internal code.`;

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const question = body.question?.trim();
  const profile = body.profile;
  if (!question || !profile?.accounts) {
    return NextResponse.json(
      { error: "question and profile are required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const planContext = buildPlanContext(profile);
  const history = (body.history ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-8);

  if (!apiKey) {
    return NextResponse.json({
      answer: answerPlanQuestion(profile, question),
      source: "rules",
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "system",
            content: `PLAN_CONTEXT (authoritative numbers):\n${planContext}`,
          },
          ...history.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", response.status, errText.slice(0, 500));
      // Quota/billing issues — still answer from plan data.
      return NextResponse.json({
        answer: answerPlanQuestion(profile, question),
        source: "plan_engine",
      });
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json({
        answer: answerPlanQuestion(profile, question),
        source: "plan_engine",
      });
    }

    return NextResponse.json({ answer, source: "openai" });
  } catch (error) {
    console.error("Chat route failed:", error);
    return NextResponse.json({
      answer: answerPlanQuestion(profile, question),
      source: "plan_engine",
    });
  }
}
