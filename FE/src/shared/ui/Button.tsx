import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
    primary:
        "bg-brand-800 text-white hover:bg-brand-900 active:bg-brand-900 disabled:bg-brand-800/50",
    secondary:
        "bg-surface text-ink border border-line hover:border-brand-500 hover:text-brand-800 disabled:opacity-50",
    ghost: "text-ink-soft hover:bg-surface-muted hover:text-ink disabled:opacity-50",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50"
};

const sizes: Record<Size, string> = {
    sm: "h-9 px-3.5 text-sm gap-1.5",
    md: "h-11 px-5 text-sm gap-2",
    lg: "h-13 px-6 text-base gap-2"
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    icon?: ReactNode;
    fullWidth?: boolean;
}

export function Button({
    variant = "primary",
    size = "md",
    icon,
    fullWidth,
    className = "",
    children,
    ...rest
}: Props) {
    return (
        <button
            {...rest}
            className={`inline-flex items-center justify-center rounded-full font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        >
            {icon}
            {children}
        </button>
    );
}
