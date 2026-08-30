import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

interface Toast {
    id: number;
    message: string;
    tone: "success" | "error";
}

const ToastContext = createContext<{
    notify: (message: string, tone?: Toast["tone"]) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const notify = useCallback((message: string, tone: Toast["tone"] = "success") => {
        const id = Date.now() + Math.random();

        setToasts((current) => [...current, { id, message, tone }]);
        setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
    }, []);

    const value = useMemo(() => ({ notify }), [notify]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="status"
                        className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full py-2.5 pr-5 pl-4 text-sm font-medium shadow-lg ${
                            toast.tone === "error"
                                ? "bg-red-600 text-white"
                                : "bg-brand-900 text-white"
                        }`}
                    >
                        {toast.tone === "error" ? (
                            <CircleAlert className="size-4 shrink-0" />
                        ) : (
                            <CircleCheck className="size-4 shrink-0" />
                        )}
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used inside ToastProvider");
    }

    return context;
}
