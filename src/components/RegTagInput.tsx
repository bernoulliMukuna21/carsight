"use client";

import { useState } from "react";

interface RegTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export function RegTagInput({ value, onChange, maxTags = 10 }: RegTagInputProps) {
  const [draft, setDraft] = useState("");
  const atMax = value.length >= maxTags;

  function addTags(raw: string) {
    const tokens = raw
      .split(/[\n,]+/)
      .map((t) => t.replace(/\s+/g, "").toUpperCase())
      .filter(Boolean);

    const existingSet = new Set(value.map((r) => r.toUpperCase()));
    const toAdd = tokens.filter((t) => !existingSet.has(t));
    const available = maxTags - value.length;
    onChange([...value, ...toAdd.slice(0, available)]);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (draft.trim()) addTags(draft);
    }
    if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (/[\n,]/.test(text)) {
      e.preventDefault();
      addTags(text);
    }
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="reg-input"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Registration number(s)
      </label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((reg, i) => (
            <span
              key={reg}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 px-3 py-1 text-sm font-mono font-medium text-blue-800 dark:text-blue-300"
            >
              {reg}
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="text-blue-500 hover:text-red-500 transition-colors ml-1 leading-none"
                aria-label={`Remove ${reg}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          id="reg-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={atMax}
          placeholder={atMax ? "Maximum reached" : "e.g. AB12CDE"}
          className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={() => { if (draft.trim()) addTags(draft); }}
          disabled={atMax || !draft.trim()}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {atMax
          ? `Maximum ${maxTags} registrations reached.`
          : `Type a reg and press Enter or click Add. Maximum ${maxTags}.`}
      </p>
    </div>
  );
}
