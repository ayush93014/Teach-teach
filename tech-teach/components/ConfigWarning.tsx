"use client";

import { useEffect, useState } from "react";

type ConfigStatus = {
  ok: boolean;
  missing: string[];
};

export function ConfigWarning() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/config-status");
        if (!res.ok) return;
        const json = (await res.json()) as ConfigStatus;
        setStatus(json);
      } catch {
        // ignore and keep UI simple
      }
    };
    void load();
  }, []);

  if (!status || status.ok) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
      <p className="font-semibold">Setup needed before login/sign up</p>
      <p className="mt-1 text-amber-900/90">
        Add these keys in <span className="font-mono">.env.local</span>, then restart{" "}
        <span className="font-mono">npm run dev</span>:
      </p>
      <ul className="mt-1 list-disc pl-5">
        {status.missing.map((key) => (
          <li key={key}>{key}</li>
        ))}
      </ul>
    </div>
  );
}
