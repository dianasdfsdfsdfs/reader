import { Search, X } from "lucide-react";

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

export function SearchInput({ value, onChange, placeholder }: Props) {
    return (
        <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-faint" />
            <input
                type="search"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 w-full rounded-full border border-line bg-surface pr-11 pl-11 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 focus:outline-none"
            />
            {value && (
                <button
                    onClick={() => onChange("")}
                    aria-label="Очистить"
                    className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}
