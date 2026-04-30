'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
}

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = 'info', action?: ToastAction) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, variant, action }]);
    const duration = action ? 5000 : Math.max(3000, message.length * 80);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const variantStyles: Record<ToastVariant, string> = {
    success: 'bg-emerald-900 text-emerald-50',
    error: 'bg-red-900 text-red-50',
    info: 'bg-zinc-900 text-zinc-50',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            aria-live="assertive"
            className={`${variantStyles[t.variant]} px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-[fadeIn_150ms_ease-out] flex items-center`}
          >
            {t.message}
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); setToasts(prev => prev.filter(x => x.id !== t.id)); }}
                className="ml-3 text-xs font-semibold underline hover:no-underline"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
