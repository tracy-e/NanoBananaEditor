import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useAppStore();

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm max-w-md ${
        isError
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
      }`}>
        {isError
          ? <AlertCircle className="h-4 w-4 flex-shrink-0" />
          : <CheckCircle className="h-4 w-4 flex-shrink-0" />
        }
        <span className="line-clamp-2">{toast.message}</span>
        <button onClick={clearToast} className="flex-shrink-0 opacity-50 hover:opacity-100 ml-1">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
