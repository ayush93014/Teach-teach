"use client";

import { useRef, useState } from "react";

type DoubtFormProps = {
  lectureId: string;
  subject: string;
  onSubmitted?: () => void;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export function DoubtForm({ lectureId, subject, onSubmitted }: DoubtFormProps) {
  const [questionText, setQuestionText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const validateFile = (candidate: File | null) => {
    if (!candidate) return null;
    if (!ALLOWED_TYPES.includes(candidate.type)) {
      return "Only JPG, PNG, or PDF files are allowed.";
    }
    if (candidate.size > MAX_FILE_SIZE) {
      return "Max file size is 5MB.";
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!questionText.trim()) {
      setError("Please type your question.");
      return;
    }
    const fileValidation = validateFile(file);
    if (fileValidation) {
      setError(fileValidation);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const createDoubtRes = await fetch("/api/doubts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId, questionText }),
      });
      if (!createDoubtRes.ok) {
        throw new Error("Could not save your question.");
      }
      const { doubtId } = (await createDoubtRes.json()) as { doubtId: string };

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("lectureId", lectureId);
        formData.append("doubtId", doubtId);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          throw new Error("Could not upload your file.");
        }
      }

      const aiRes = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doubtId, questionText, subject }),
      });
      if (!aiRes.ok) {
        throw new Error("Question saved, but AI answer could not be created.");
      }

      setQuestionText("");
      setFile(null);
      formRef.current?.reset();
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card space-y-3">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Ask a Doubt</h3>
        <p className="text-sm text-slate-600">Include as much detail as possible (and a file if needed).</p>
      </div>
      <textarea
        rows={5}
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        placeholder="Type your question here..."
        className="textarea"
        required
      />
      <input
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        disabled={loading}
        type="submit"
        className="btn-accent"
      >
        {loading ? "Submitting..." : "Submit Doubt"}
      </button>
    </form>
  );
}
