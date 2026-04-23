import { GoogleGenerativeAI } from "@google/generative-ai";

const ALLOWED_TYPES = new Set([
  "technical_issue",
  "attendance_issue",
  "assignment_issue",
  "concept_question",
  "other",
]);

const SYSTEM_PROMPT = `You are an intelligent student support assistant for a college platform.

Classify the query into:
- technical_issue
- attendance_issue
- assignment_issue
- concept_question
- other

Rules:
- Keep responses short (max 5 lines)
- Provide step-by-step solutions for issues
- Simplify explanations for concepts
- If user says "still not working" or similar -> set escalate = true

Return ONLY valid JSON in this format:
{
  "type": "technical_issue | attendance_issue | assignment_issue | concept_question | other",
  "reply": "string",
  "escalate": true
}`;

function fallbackResponse() {
  return {
    type: "technical_issue",
    reply:
      "Please try again in a moment. If your issue continues, share a screenshot and exact error text so support can help quickly.",
    escalate: true,
  };
}

function validateMessage(message) {
  return typeof message === "string" && message.trim().length > 0;
}

/**
 * Safely parses model output and normalizes shape.
 * Throws if JSON is invalid or fields are missing/incorrect.
 */
function parseAndValidateModelJson(rawText) {
  const parsed = JSON.parse(rawText);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model output is not an object");
  }

  const { type, reply, escalate } = parsed;

  if (!ALLOWED_TYPES.has(type)) {
    throw new Error("Invalid type in model output");
  }
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Invalid reply in model output");
  }
  if (typeof escalate !== "boolean") {
    throw new Error("Invalid escalate in model output");
  }

  return { type, reply: reply.trim(), escalate };
}

async function getChatResponseFromGemini(userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(userMessage);
  const rawText = result?.response?.text?.();

  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty response from Gemini");
  }

  return parseAndValidateModelJson(rawText);
}

/**
 * POST /api/chat
 * Body: { message: string }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const message = body?.message;

    if (!validateMessage(message)) {
      return Response.json(
        { error: "Invalid request. Expected JSON body: { message: string }" },
        { status: 400 }
      );
    }

    const aiResponse = await getChatResponseFromGemini(message.trim());
    return Response.json(aiResponse, { status: 200 });
  } catch (error) {
    // Log internal error for observability without exposing details to clients.
    console.error("POST /api/chat failed:", error);
    return Response.json(fallbackResponse(), { status: 200 });
  }
}
