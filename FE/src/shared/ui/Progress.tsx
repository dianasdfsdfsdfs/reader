export function Progress({ value }: { value: number }) {
    const clamped = Math.min(Math.max(value, 0), 100);

    return (
        <div className="flex items-center gap-2">
            <div
                role="progressbar"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
            >
                <div
                    className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
                    style={{ width: `${clamped}%` }}
                />
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-ink-soft tabular-nums">
                {clamped}%
            </span>
        </div>
    );
}
