import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toast: (type: ToastType, message: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-sky-500" />,
};

const bgClasses: Record<ToastType, string> = {
    success: 'border-emerald-200 bg-emerald-50',
    error: 'border-rose-200 bg-rose-50',
    warning: 'border-amber-200 bg-amber-50',
    info: 'border-sky-200 bg-sky-50',
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (type: ToastType, message: string) => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            setToasts((prev) => [...prev, { id, type, message }]);
            setTimeout(() => removeToast(id), 4000);
        },
        [removeToast]
    );

    const contextValue: ToastContextValue = {
        toast: addToast,
        success: (msg) => addToast('success', msg),
        error: (msg) => addToast('error', msg),
        warning: (msg) => addToast('warning', msg),
        info: (msg) => addToast('info', msg),
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-fade-in ${bgClasses[t.type]}`}
                    >
                        {icons[t.type]}
                        <p className="text-sm font-medium text-slate-800 flex-1">{t.message}</p>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used inside ToastProvider');
    }
    return context;
}
