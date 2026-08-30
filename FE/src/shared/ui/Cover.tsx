import { initialsOf } from "@/shared/lib/format";

interface Props {
    title: string;
    author?: string | null;
    url?: string | null;
    className?: string;
}

/**
 * Обложка книги. Если картинки нет — рисуем градиент из палитры с инициалами,
 * чтобы полка не разъезжалась из-за разной высоты карточек.
 */
export function Cover({ title, author, url, className = "" }: Props) {
    return (
        <div
            className={`cover-fallback relative isolate aspect-[2/3] w-full overflow-hidden rounded-2xl shadow-sm ring-1 ring-ink/5 ${className}`}
        >
            {url ? (
                <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
                    <span className="font-display text-2xl leading-none font-bold opacity-90">
                        {initialsOf(title)}
                    </span>
                    <span className="space-y-0.5">
                        <span className="line-clamp-3 block font-display text-sm leading-tight font-semibold">
                            {title}
                        </span>
                        {author && (
                            <span className="block truncate text-[11px] opacity-80">{author}</span>
                        )}
                    </span>
                </div>
            )}
        </div>
    );
}
