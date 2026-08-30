import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const control =
    "w-full h-11 rounded-2xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";

interface FieldProps {
    label: string;
    hint?: string;
    error?: string;
    children: ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
    return (
        <label className="block space-y-1.5">
            <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                {label}
            </span>
            {children}
            {error ? (
                <span className="block text-xs text-red-600">{error}</span>
            ) : hint ? (
                <span className="block text-xs text-ink-faint">{hint}</span>
            ) : null}
        </label>
    );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...rest} className={`${control} ${className}`} />;
}

export function Select({ className = "", ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...rest} className={`${control} ${className}`} />;
}
