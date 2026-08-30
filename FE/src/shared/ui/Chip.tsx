import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean;
}

export function Chip({ active, className = "", children, ...rest }: Props) {
    return (
        <button
            {...rest}
            aria-pressed={active}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                active
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-line bg-surface text-ink-soft hover:border-brand-400 hover:text-ink"
            } ${className}`}
        >
            {children}
        </button>
    );
}
