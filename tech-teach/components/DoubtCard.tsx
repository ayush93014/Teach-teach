"use client";

import { useState } from "react";
import { AIBadge } from "@/components/AIBadge";
import { FilePreview } from "@/components/FilePreview";
import type { DoubtWithRelations } from "@/types";

type DoubtCardProps = {
  doubt: DoubtWithRelations;
  canAnswer?: boolean;
  onAnswered?: () => void;
};

export function DoubtCard({ doubt, canAnswer, onAnswered }: DoubtCardProps) {
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstAnswer = doubt.answers?.[0];

  const submitAnswer = async () => {
    if (!answerText.trim()) {
      setError("Answer is required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doubtId: doubt.id, answerText }),
      });
      if (!res.ok) {
        throw new Error("Failed to submit answer.");
      }
      setAnswerText("");
      onAnswered?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">
          {doubt.profiles?.name ?? "Student"}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            doubt.status === "answered"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {doubt.status}
        </span>
      </div>

      <p className="text-sm text-slate-800">{doubt.question_text}</p>
      <FilePreview fileUrl={doubt.file_url} fileType={doubt.file_type} />
      <AIBadge suggestion={doubt.ai_suggestion} />

      {firstAnswer ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-semibold">Teacher Answer</p>
          <p className="mt-1">{firstAnswer.answer_text}</p>
        </div>
      ) : null}

      {canAnswer && !firstAnswer ? (
        <div className="space-y-2">
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Write your final answer..."
            className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none ring-blue-500 focus:ring"
            rows={4}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            onClick={submitAnswer}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </button>
        </div>
      ) : null}
    </article>
  );
}
