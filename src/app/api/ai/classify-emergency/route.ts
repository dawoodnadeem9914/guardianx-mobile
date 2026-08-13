import { NextResponse } from "next/server";

/**
 * Real emergency classification via GPT-4.1 mini — server-only Route
 * Handler, OPENAI_API_KEY never reaches the browser. Every non-success
 * response uses HTTP 200 with { success: false } — the caller
 * (aiService.classifyEmergency) always falls back to a safe local
 * classifier for any reason this route doesn't produce a usable
 * result, so the app never crashes and never leaves a user without a
 * recommendation just because AI is unavailable.
 *
 * Now supports a real, optional image (as a data URL) alongside the
 * text description — sent as real multimodal content to the same
 * vision-capable GPT-4.1 mini model, the same proven approach used
 * elsewhere in the GuardianX project. There is no fallback for the
 * image itself if AI is unavailable — the text-only local fallback
 * still applies, but an image is only ever genuinely analyzed by the
 * real model or not analyzed at all; it is never pretended to have
 * been analyzed.
 *
 * GuardianX is presented as an emergency assistant, never as a
 * medical professional — the system prompt below is written to keep
 * that framing, and to prefer "none" (no apparent emergency) over
 * guessing at a category, or over ever recommending 999 for a
 * situation the model didn't actually identify as an emergency.
 */

type EmergencyCategory = "medical" | "police" | "fire" | "none";

interface ClassifyRequestBody {
  description: string;
  /** A data: URL of a real photo, e.g. "data:image/jpeg;base64,...". Optional. */
  imageDataUrl?: string;
}

interface AiClassification {
  category: EmergencyCategory;
  label: string;
  confidence: number;
  reason: string;
}

const VALID_CATEGORIES: EmergencyCategory[] = ["medical", "police", "fire", "none"];

const SYSTEM_PROMPT = `You are GuardianX's emergency assistant. You are NOT a medical professional and must never present yourself as one. A user (who may be elderly, a child, or under stress) has described what's happening in plain language, possibly transcribed from speech, and may have included a real photo. Classify what kind of help they need, using only what is actually described or actually visible in any provided photo — never invent details.

Respond ONLY with a JSON object matching this exact shape:
{
  "category": one of ["medical", "police", "fire", "none"],
  "label": a short, plain label like "Medical Emergency",
  "confidence": a number 0-100,
  "reason": one short, plain sentence a stressed or elderly user could understand
}

Use "none" whenever the description does not clearly indicate a real emergency — for example, vague statements, unrelated content, or something that sounds like it has already been resolved. Never use "none" as a placeholder for "I'm not confident which category" — if it genuinely sounds like SOME kind of emergency but you're unsure which, pick your best single real category (medical, police, or fire) at a lower confidence instead of "none". Be conservative — the goal is a safe recommendation to confirm, not a diagnosis.`;

function isLikelyImageDataUrl(value: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(value);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Real AI classification is unavailable." },
      { status: 200 }
    );
  }

  let body: ClassifyRequestBody;
  try {
    body = (await request.json()) as ClassifyRequestBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  const hasImage = Boolean(body.imageDataUrl && isLikelyImageDataUrl(body.imageDataUrl));

  if (!description && !hasImage) {
    return NextResponse.json(
      { success: false, error: "No description or image provided." },
      { status: 400 }
    );
  }

  // Real multimodal content when a real image is present — the
  // actual uploaded photo is sent to the model, never a filename or
  // any stand-in for it.
  const userContent = hasImage
    ? [
        {
          type: "text",
          text: description || "Please assess this photo for a possible emergency.",
        },
        { type: "image_url", image_url: { url: body.imageDataUrl, detail: "auto" } },
      ]
    : description;

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
          { role: "system", content: SYSTEM_PROMPT },
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

    let parsed: Partial<AiClassification>;
    try {
      parsed = JSON.parse(content) as Partial<AiClassification>;
    } catch {
      return NextResponse.json(
        { success: false, error: "AI response was not valid JSON." },
        { status: 200 }
      );
    }

    if (
      !parsed.category ||
      !VALID_CATEGORIES.includes(parsed.category) ||
      typeof parsed.confidence !== "number" ||
      typeof parsed.label !== "string" ||
      typeof parsed.reason !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "AI response did not match the expected shape." },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      result: {
        category: parsed.category,
        label: parsed.label,
        confidence: Math.max(0, Math.min(100, parsed.confidence)),
        reason: parsed.reason,
        source: "ai" as const,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 200 });
  }
}