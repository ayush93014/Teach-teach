import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

export async function getClaudeSuggestion({
  question,
  subject,
}: {
  question: string;
  subject: string;
}) {
  if (!apiKey) {
    return "AI suggestion unavailable because ANTHROPIC_API_KEY is not configured.";
  }

  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = `You are a helpful university professor assistant at NIT Sikkim.
A student has asked the following doubt in a ${subject} lecture.
Give a clear, concise, step-by-step explanation suitable for an engineering student.
Keep it under 200 words.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 350,
    system: systemPrompt,
    messages: [{ role: "user", content: question }],
  });

  const firstTextBlock = response.content.find((item) => item.type === "text");
  return firstTextBlock?.type === "text"
    ? firstTextBlock.text
    : "AI suggestion unavailable at this moment.";
}
