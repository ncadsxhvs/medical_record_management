'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function CalendarDropdown({ value, onChange, onClose }: { value: string; onChange: (iso: string) => void; onClose: () => void }) {
  const today = getTodayString();
  const [y, m] = (value || today).split('-').map(Number);
  const [viewYear, setViewYear] = useState(y);
  const [viewMonth, setViewMonth] = useState(m);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth - 1, 0).getDate();

  const cells: { day: number; iso: string; current: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) {
    const d = prevMonthDays - firstDay + 1 + i;
    const pm = viewMonth === 1 ? 12 : viewMonth - 1;
    const py = viewMonth === 1 ? viewYear - 1 : viewYear;
    cells.push({ day: d, iso: `${py}-${String(pm).padStart(2, '0')}-${String(d).padStart(2, '0')}`, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`, current: true });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const nm = viewMonth === 12 ? 1 : viewMonth + 1;
      const ny = viewMonth === 12 ? viewYear + 1 : viewYear;
      cells.push({ day: d, iso: `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}`, current: false });
    }
  }

  const prev = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const next = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl border border-zinc-200 shadow-lg p-3 w-64">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-sm font-semibold text-[#1f1f1f]">{MONTHS[viewMonth - 1]} {viewYear}</span>
        <button type="button" onClick={next} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map(d => (
          <span key={d} className="text-[10px] font-medium text-zinc-400 text-center">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          const isSelected = cell.iso === value;
          const isToday = cell.iso === today;
          return (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(cell.iso); onClose(); }}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm cursor-pointer transition-colors
                ${isSelected ? 'bg-[#0070cc] text-white font-semibold' : ''}
                ${!isSelected && isToday ? 'border border-[#0070cc] text-[#0070cc] font-semibold' : ''}
                ${!isSelected && !isToday && cell.current ? 'text-[#1f1f1f] hover:bg-zinc-100' : ''}
                ${!cell.current ? 'text-zinc-300' : ''}
              `}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateInput({ value, onChange, id, className }: DateInputProps) {
  const [display, setDisplay] = useState(() => toDisplay(value));
  const [isFocused, setIsFocused] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
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

  const handleCloseCalendar = useCallback(() => setShowCalendar(false), []);

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
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className="text-zinc-400 hover:text-[#0070cc] transition-colors cursor-pointer"
          tabIndex={-1}
          aria-label="Open calendar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => { onChange(getTodayString()); setDisplay(toDisplay(getTodayString())); setShowCalendar(false); }}
          className="text-xs text-[#0070cc] hover:text-[#005fa3] font-medium cursor-pointer"
          tabIndex={-1}
        >
          Today
        </button>
      </div>
      {showCalendar && (
        <CalendarDropdown value={value} onChange={(iso) => { onChange(iso); setDisplay(toDisplay(iso)); }} onClose={handleCloseCalendar} />
      )}
    </div>
  );
}
