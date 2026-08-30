export function Spinner({ className = "size-5" }: { className?: string }) {
    return (
        <span
            role="status"
            aria-label="Загрузка"
            className={`inline-block animate-spin rounded-full border-2 border-brand-300 border-t-brand-800 ${className}`}
        />
    );
}

export function PageLoader() {
    return (
        <div className="flex min-h-60 items-center justify-center">
            <Spinner className="size-8" />
        </div>
    );
}
