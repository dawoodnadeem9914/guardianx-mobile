import { NextResponse } from "next/server";

/**
 * Real, context-aware emergency guidance via GPT-4.1 mini —
 * server-only, OPENAI_API_KEY never reaches the browser. This
 * replaces what were two static hardcoded lists (alone vs.
 * accompanied) with guidance that genuinely considers the real
 * emergency category, the user's real description, whether they're
 * alone, and a real photo when one was provided.
 *
 * Every non-success response is { success: false } with HTTP 200 —
 * the caller falls back to a small set of genuinely safe, generic,
 * clearly-labeled non-AI steps (never silently presented as AI
 * guidance) so a user in an active emergency is never left with
 * nothing on screen just because AI is unavailable.
 */

type EmergencyCategory = "medical" | "police" | "fire" | "unclear";

interface GuidanceRequestBody {
  category: EmergencyCategory;
  description: string;
  alone: boolean;
  imageDataUrl?: string;
}

interface AiGuidance {
  steps: string[];
}

const VALID_CATEGORIES: EmergencyCategory[] = ["medical", "police", "fire", "unclear"];

function isLikelyImageDataUrl(value: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(value);
}

function buildSystemPrompt(category: EmergencyCategory, alone: boolean): string {
  return `You are GuardianX's emergency guidance assistant. You are NOT a medical, police, or fire professional and must never claim to be one. GuardianX has already recommended calling Malaysia's emergency number (999) — your job is ONLY to give short, safe, practical steps for what to do while help is on the way, not to replace or delay contacting real emergency services.

The situation is: a "${category}" emergency. The user is currently ${alone ? "ALONE" : "with someone else who can help"}. Tailor the steps to that — steps for someone alone must be things they alone can realistically do; steps for someone with a helper can include things to check/do together.

If a real photo was provided, use only what is genuinely visible in it — never invent details.

Rules:
- 4 to 6 short steps, each a single plain sentence a stressed or elderly person can follow.
- Never give a step that requires specialized training you cannot verify the user has (e.g. do not instruct chest compressions in detail — instead say to follow the 999 operator's instructions for CPR).
- Always include one step that says to follow the real emergency operator's instructions.
- Never claim certainty about a medical condition.
- Be calm and reassuring in tone, but not falsely reassuring about the situation itself.

Respond ONLY with a JSON object matching this exact shape:
{ "steps": ["...", "...", "..."] }`;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Real AI guidance is unavailable." },
      { status: 200 }
    );
  }

  let body: GuidanceRequestBody;
  try {
    body = (await request.json()) as GuidanceRequestBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
    return NextResponse.json({ success: false, error: "Invalid category." }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  const hasImage = Boolean(body.imageDataUrl && isLikelyImageDataUrl(body.imageDataUrl));

  const textPrompt =
    description || "No further description was given beyond the emergency category.";

  const userContent = hasImage
    ? [
        { type: "text", text: textPrompt },
        { type: "image_url", image_url: { url: body.imageDataUrl, detail: "auto" } },
      ]
    : textPrompt;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: buildSystemPrompt(body.category, Boolean(body.alone)) },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(hasImage ? 20000 : 12000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `OpenAI request failed (${response.status}).` },
        { status: 200 }
      );
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { success: false, error: "OpenAI returned an empty response." },
        { status: 200 }
      );
    }

    let parsed: Partial<AiGuidance>;
    try {
      parsed = JSON.parse(content) as Partial<AiGuidance>;
    } catch {
      return NextResponse.json(
        { success: false, error: "AI response was not valid JSON." },
        { status: 200 }
      );
    }

    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return NextResponse.json(
        { success: false, error: "AI response did not match the expected shape." },
        { status: 200 }
      );
    }

    const steps = parsed.steps.filter((s): s is string => typeof s === "string").slice(0, 6);

    return NextResponse.json({ success: true, steps, source: "ai" as const });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 200 });
  }
}
