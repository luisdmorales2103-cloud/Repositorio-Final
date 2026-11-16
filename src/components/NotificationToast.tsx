import React from 'react';
import { CheckCircle2, ShoppingBag, X } from 'lucide-react';

interface ToastProps {
  message: string;
  submessage?: string;
  variant?: 'default' | 'success';
  onViewQuote?: () => void;
  onClose: () => void;
}

export const NotificationToast: React.FC<ToastProps> = ({
  message,
  submessage,
  variant = 'default',
  onViewQuote,
  onClose,
}) => {
  const isGreen = variant === 'success';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-5 duration-200 ${
        isGreen
          ? 'bg-emerald-600 text-white border-emerald-500'
          : 'bg-slate-900 text-white border-slate-700'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            isGreen
              ? 'bg-white/20 text-white'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-white">{message}</h4>
          {submessage && (
            <p
              className={`text-[11px] mt-0.5 ${
                isGreen ? 'text-emerald-50' : 'text-slate-300'
              }`}
            >
              {submessage}
            </p>
          )}

          {onViewQuote && (
            <button
              type="button"
              onClick={onViewQuote}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ver Cotización</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`p-1 ${
            isGreen
              ? 'text-emerald-100 hover:text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
