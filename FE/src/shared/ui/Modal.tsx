import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface Props {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
}

/** На телефоне — шторка снизу, на десктопе — обычный центрированный диалог. */
export function Modal({ open, title, onClose, children, footer }: Props) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <button
                aria-label="Закрыть"
                onClick={onClose}
                className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-card bg-surface shadow-2xl sm:rounded-card"
            >
                <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
                    <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
                    <button
                        onClick={onClose}
                        aria-label="Закрыть"
                        className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
                    >
                        <X className="size-5" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

                {footer && (
                    <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">
                        {footer}
                    </footer>
                )}
            </div>
        </div>,
        document.body
    );
}
