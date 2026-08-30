import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
}

/**
 * Полка с горизонтальной прокруткой — так на вайрфрейме устроены и секции каталога,
 * и книги внутри коллекции: «горизонтально стрелки внутри коллекций,
 * вертикально стрелки коллекций».
 */
export function Shelf({ title, subtitle, action, children }: Props) {
    const track = useRef<HTMLDivElement>(null);

    const scrollBy = (direction: 1 | -1) =>
        track.current?.scrollBy({
            left: direction * Math.max(track.current.clientWidth * 0.8, 240),
            behavior: "smooth"
        });

    return (
        <section className="space-y-3">
            <header className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
                    {subtitle && <p className="text-xs text-ink-faint">{subtitle}</p>}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {action}
                    <div className="hidden gap-1 sm:flex">
                        {([-1, 1] as const).map((direction) => (
                            <button
                                key={direction}
                                onClick={() => scrollBy(direction)}
                                aria-label={direction === -1 ? "Назад" : "Вперёд"}
                                className="grid size-8 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-brand-500 hover:text-brand-800"
                            >
                                {direction === -1 ? (
                                    <ChevronLeft className="size-4" />
                                ) : (
                                    <ChevronRight className="size-4" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div
                ref={track}
                className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-1"
            >
                {children}
            </div>
        </section>
    );
}

/** Ширина карточки на полке — фиксированная, иначе flex их сожмёт. */
export function ShelfItem({ children }: { children: ReactNode }) {
    return <div className="w-32 shrink-0 snap-start sm:w-36">{children}</div>;
}
