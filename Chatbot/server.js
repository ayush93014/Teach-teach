import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

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
      "Server is temporarily unavailable. Please retry in a moment and share error text/screenshot if it still fails.",
    escalate: true,
  };
}

function errorAwareFallbackResponse(error) {
  const status = error?.status;
  const message = String(error?.message || "");

  if (status === 429 || /quota|rate limit|too many requests/i.test(message)) {
    return {
      type: "technical_issue",
      reply:
        "Gemini API quota limit reached. Please wait a bit or check Google AI Studio billing/quota, then try again.",
      escalate: true,
    };
  }

  if (status === 401 || status === 403 || /api key|unauthorized|permission/i.test(message)) {
    return {
      type: "technical_issue",
      reply:
        "Gemini API key is invalid or lacks permission. Verify your .env GEMINI_API_KEY and project access, then restart the server.",
      escalate: true,
    };
  }

  if (/Missing GEMINI_API_KEY/i.test(message)) {
    return {
      type: "technical_issue",
      reply:
        "Gemini API key is missing in backend environment. Add GEMINI_API_KEY in .env and restart the server.",
      escalate: true,
    };
  }

  return fallbackResponse();
}

function parseModelResponse(rawText) {
  const parsed = JSON.parse(rawText);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model output must be an object");
  }

  const { type, reply, escalate } = parsed;
  if (!ALLOWED_TYPES.has(type)) throw new Error("Invalid response type");
  if (typeof reply !== "string" || !reply.trim()) throw new Error("Invalid reply field");
  if (typeof escalate !== "boolean") throw new Error("Invalid escalate field");

  return { type, reply: reply.trim(), escalate };
}

async function askGemini(message) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY in environment");

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(message);
  const text = result?.response?.text?.();
  if (!text) throw new Error("Empty Gemini response");

  return parseModelResponse(text);
}

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message;
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Invalid request body. Expected { message: string }" });
    }

    const response = await askGemini(message.trim());
    return res.status(200).json(response);
  } catch (error) {
    console.error("POST /api/chat failed:", error);
    return res.status(200).json(errorAwareFallbackResponse(error));
  }
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Chat backend running on http://localhost:${PORT}`);
});
