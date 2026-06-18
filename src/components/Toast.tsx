import React, { createContext, useCallback, useContext, useState } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem { id: string; text: string; type: ToastType; }

interface ToastCtx {
  show: (text: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export const useToast = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast must be inside ToastProvider');
  return c;
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <Check size={16} className="text-emerald-500" />,
  error: <X size={16} className="text-rose-500" />,
  warning: <AlertCircle size={16} className="text-amber-500" />,
  info: <Info size={16} className="text-brand-500" />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [list, setList] = useState<ToastItem[]>([]);

  const show = useCallback((text: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setList(l => [...l, { id, text, type }]);
    setTimeout(() => setList(l => l.filter(x => x.id !== id)), 2600);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {list.map((t, i) => (
          <div
            key={t.id}
            className={twMerge(
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-white shadow-soft border border-salon-line',
              'animate-bounce-in',
            )}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            {ICONS[t.type]}
            <span className="text-sm font-medium text-salon-ink min-w-[120px]">{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
};
