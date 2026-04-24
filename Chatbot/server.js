import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

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

async function askGroq(message) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY in environment");

  const client = new Groq({ apiKey });
  const preferredModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const fallbackModel = "llama-3.3-70b-versatile";

  async function run(model) {
    return await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
  }

  let response;
  try {
    response = await run(preferredModel);
  } catch (error) {
    const message = String(error?.message || "");
    // If an env-pinned model was deprecated/decommissioned, retry once with a known-good model.
    if (
      preferredModel !== fallbackModel &&
      /model_decommissioned|decommissioned|no longer supported/i.test(message)
    ) {
      response = await run(fallbackModel);
    } else {
      throw error;
    }
  }

  const text = response?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty Groq response");

  return parseModelResponse(text);
}

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message;
    const lectureId = req.body?.lectureId;
    const doubtId = req.body?.doubtId;
    const userId = req.body?.userId;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Invalid request body. Expected { message: string }" });
    }

    let response;
    // Prefer Groq when configured; only fall back to Gemini if it's configured too.
    if (process.env.GROQ_API_KEY) {
      try {
        response = await askGroq(message.trim());
      } catch (groqError) {
        const hasGemini = Boolean(process.env.GEMINI_API_KEY);
        console.warn(
          `Groq API failed${hasGemini ? ", falling back to Gemini" : ""}:`,
          groqError?.message || String(groqError)
        );
        if (hasGemini) {
          response = await askGemini(message.trim());
        } else {
          throw groqError;
        }
      }
    } else {
      response = await askGemini(message.trim());
    }

    // Save chat message to Supabase if configured
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data, error } = await supabase.from("chat_messages").insert({
          user_id: userId || null,
          lecture_id: lectureId || null,
          doubt_id: doubtId || null,
          message: message.trim(),
          ai_response: response.reply,
          message_type: response.type,
          escalate: response.escalate,
        });

        if (error) {
          console.warn("Could not save chat to Supabase:", error.message);
        }

        // If this is for a doubt, update it with AI suggestion
        if (doubtId && response.type !== "technical_issue") {
          const { error: updateError } = await supabase
            .from("doubts")
            .update({ ai_suggestion: response.reply })
            .eq("id", doubtId);

          if (updateError) {
            console.warn("Could not update doubt AI suggestion:", updateError.message);
          }
        }
      }
    } catch (dbError) {
      console.warn("Database error:", dbError.message || String(dbError));
      // Continue anyway - don't fail the chat response if DB is down
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("POST /api/chat failed:", error);
    return res.status(200).json(errorAwareFallbackResponse(error));
  }
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "Tech-Teach Chatbot API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      chat: {
        method: "POST",
        path: "/api/chat",
        description: "Send a message to the chatbot",
        body: {
          message: "string (required) - User message",
          lectureId: "string (optional) - UUID of the lecture",
          doubtId: "string (optional) - UUID of the doubt",
          userId: "string (optional) - UUID of the user",
        },
        response: {
          type: "technical_issue|attendance_issue|assignment_issue|concept_question|other",
          reply: "string - AI response",
          escalate: "boolean - Whether to escalate to human support",
        },
      },
      health: {
        method: "GET",
        path: "/health",
        description: "Health check endpoint",
      },
    },
    example:
      'curl -X POST http://localhost:3001/api/chat -H "Content-Type: application/json" -d \'{"message":"How do I reset my password?"}\'',
  });
});

app.listen(PORT, () => {
  console.log(`Chat backend running on http://localhost:${PORT}`);
});
