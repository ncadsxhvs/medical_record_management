'use client';

import { useState, useEffect, useRef } from 'react';
import { getTodayString } from '@/lib/dateUtils';

interface DateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

function toDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${m}/${d}/${y}`;
}

function toIso(display: string): string | null {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, m, d, y] = match;
  const month = parseInt(m, 10);
  const day = parseInt(d, 10);
  const year = parseInt(y, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2099) return null;
  return `${y}-${m}-${d}`;
}

export default function DateInput({ value, onChange, id, className }: DateInputProps) {
  const [display, setDisplay] = useState(() => toDisplay(value));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setDisplay(toDisplay(value));
    }
  }, [value, isFocused]);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += '/';
      formatted += digits[i];
    }
    setDisplay(formatted);

    const iso = toIso(formatted);
    if (iso) {
      onChange(iso);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const iso = toIso(display);
    if (iso) {
      onChange(iso);
      setDisplay(toDisplay(iso));
    } else {
      setDisplay(toDisplay(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        id={id}
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="MM/DD/YYYY"
        className={className}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => { onChange(getTodayString()); setDisplay(toDisplay(getTodayString())); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#0070cc] hover:text-[#005fa3] font-medium cursor-pointer"
        tabIndex={-1}
      >
        Today
      </button>
    </div>
  );
}
