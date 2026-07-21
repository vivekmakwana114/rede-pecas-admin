'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  /** Defaults to `id` — set when a submit handler needs to read the field's
   *  live DOM value via FormData (browser autofill can silently set an
   *  input's value without firing React's onChange, leaving controlled
   *  state stale; reading FormData at submit time sidesteps that). */
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name ?? id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-input px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
