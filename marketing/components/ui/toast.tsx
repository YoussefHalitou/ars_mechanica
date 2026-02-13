'use client';

import React, { useState, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
    toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const icons = {
        success: <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />,
        error: <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />,
        info: <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />,
    };

    const colors = {
        success: 'border-green-200 bg-green-50',
        error: 'border-red-200 bg-red-50',
        info: 'border-blue-200 bg-blue-50',
    };

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {toasts.length > 0 && (
                <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
                    {toasts.map(t => (
                        <div key={t.id}
                            className={cn(
                                'flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg text-sm text-slate-700 animate-in slide-in-from-right fade-in duration-300',
                                colors[t.type]
                            )}>
                            {icons[t.type]}
                            <span className="flex-1">{t.message}</span>
                            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}
