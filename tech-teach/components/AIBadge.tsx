type AIBadgeProps = {
  suggestion: string | null;
};

export function AIBadge({ suggestion }: AIBadgeProps) {
  if (!suggestion) {
    return null;
  }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
        AI Draft Answer
      </p>
      <p className="mt-1 text-sm text-violet-900">{suggestion}</p>
    </div>
  );
}
