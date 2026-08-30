import type { ReactNode } from "react";

interface Props {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
    return (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line px-6 py-14 text-center">
            <div className="mb-4 grid size-14 place-items-center rounded-full bg-surface-muted text-brand-700">
                {icon}
            </div>
            <p className="font-display text-lg font-semibold text-ink">{title}</p>
            {description && <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
