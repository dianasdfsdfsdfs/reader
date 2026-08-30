import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ePub, { type Book, type Rendition } from "epubjs";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    List,
    Minus,
    Plus,
    Settings2,
    X
} from "lucide-react";
import { booksApi } from "@/shared/api/books";
import { Button } from "@/shared/ui/Button";
import { Spinner } from "@/shared/ui/Spinner";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useToast } from "@/shared/ui/Toast";
import { ApiError } from "@/shared/api/client";
import type { ReadingTheme } from "@/shared/types";

interface TocItem {
    label: string;
    href: string;
}

const THEMES: Record<ReadingTheme, { background: string; color: string; label: string }> = {
    LIGHT: { background: "#fbfaf4", color: "#1c2418", label: "Светлая" },
    SEPIA: { background: "#f3e9d2", color: "#43371f", label: "Сепия" },
    DARK: { background: "#14180f", color: "#e6eadd", label: "Тёмная" }
};

export function ReaderPage() {
    const { id } = useParams();
    const bookId = Number(id);
    const { notify } = useToast();

    const viewer = useRef<HTMLDivElement>(null);
    const bookRef = useRef<Book | null>(null);
    const renditionRef = useRef<Rendition | null>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Держим последнюю позицию в ref, чтобы успеть сохранить её при уходе со страницы.
    const pending = useRef<{ currentLocation: string; progress: number } | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [toc, setToc] = useState<TocItem[]>([]);
    const [progress, setProgress] = useState(0);
    const [theme, setTheme] = useState<ReadingTheme>("LIGHT");
    const [fontSize, setFontSize] = useState(16);
    const [panel, setPanel] = useState<"toc" | "settings" | null>(null);

    const flush = useCallback(() => {
        if (!pending.current) {
            return;
        }

        void booksApi.saveProgress(bookId, pending.current).catch(() => undefined);
        pending.current = null;
    }, [bookId]);

    /* ------------------------------------------------ загрузка и рендер */

    useEffect(() => {
        if (!Number.isFinite(bookId)) {
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const session = await booksApi.readingSession(bookId);

                // Скачиваем файл целиком: подписанная ссылка живёт час, а epub.js
                // иначе дёргал бы её по кускам и упирался бы в истёкшую подпись.
                const buffer = await fetch(session.url).then((response) => {
                    if (!response.ok) {
                        throw new Error("Не удалось скачать файл книги");
                    }

                    return response.arrayBuffer();
                });

                if (cancelled || !viewer.current) {
                    return;
                }

                const book = ePub(buffer);

                bookRef.current = book;

                const rendition = book.renderTo(viewer.current, {
                    width: "100%",
                    height: "100%",
                    flow: "paginated",
                    spread: "auto",
                    allowScriptedContent: false
                });

                renditionRef.current = rendition;

                for (const [key, value] of Object.entries(THEMES)) {
                    rendition.themes.register(key, {
                        body: {
                            background: value.background,
                            color: value.color,
                            "line-height": "1.6",
                            padding: "0 8px"
                        },
                        a: { color: "#4e9a55" }
                    });
                }

                setTheme(session.theme);
                setFontSize(session.fontSize);
                rendition.themes.select(session.theme);
                rendition.themes.fontSize(`${session.fontSize}px`);

                await rendition.display(session.currentLocation ?? undefined);

                const metadata = await book.loaded.metadata;

                if (cancelled) {
                    return;
                }

                setTitle(metadata.title ?? "");
                setProgress(session.progress);

                const navigation = await book.loaded.navigation;

                setToc(
                    (navigation.toc ?? []).map((item) => ({
                        label: item.label.trim(),
                        href: item.href
                    }))
                );

                setLoading(false);

                // Карта позиций нужна для процента прочитанного; на больших книгах
                // считается заметное время, поэтому не блокируем ей первый экран.
                await book.locations.generate(1600);

                if (cancelled) {
                    return;
                }

                rendition.on("relocated", (location: any) => {
                    const cfi = location?.start?.cfi;

                    if (!cfi) {
                        return;
                    }

                    const percentage = Math.round(
                        (book.locations.percentageFromCfi(cfi) ?? 0) * 100
                    );

                    setProgress(percentage);
                    pending.current = { currentLocation: cfi, progress: percentage };

                    if (saveTimer.current) {
                        clearTimeout(saveTimer.current);
                    }

                    saveTimer.current = setTimeout(flush, 1500);
                });
            } catch (caught) {
                if (!cancelled) {
                    setError(
                        caught instanceof ApiError
                            ? caught.message
                            : "Не удалось открыть книгу"
                    );
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;

            if (saveTimer.current) {
                clearTimeout(saveTimer.current);
            }

            flush();
            renditionRef.current?.destroy();
            bookRef.current?.destroy();
            renditionRef.current = null;
            bookRef.current = null;
        };
    }, [bookId, flush]);

    /* ------------------------------------------------------- управление */

    const turn = useCallback((direction: "next" | "prev") => {
        void renditionRef.current?.[direction]();
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") {
                turn("next");
            }

            if (event.key === "ArrowLeft") {
                turn("prev");
            }

            if (event.key === "Escape") {
                setPanel(null);
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, [turn]);

    // Уход со вкладки или закрытие браузера — тоже повод дописать позицию.
    useEffect(() => {
        window.addEventListener("pagehide", flush);

        return () => window.removeEventListener("pagehide", flush);
    }, [flush]);

    const applyTheme = (next: ReadingTheme) => {
        setTheme(next);
        renditionRef.current?.themes.select(next);
        booksApi.saveProgress(bookId, { theme: next }).catch(() => undefined);
    };

    const applyFontSize = (next: number) => {
        const clamped = Math.min(Math.max(next, 10), 32);

        setFontSize(clamped);
        renditionRef.current?.themes.fontSize(`${clamped}px`);
        booksApi.saveProgress(bookId, { fontSize: clamped }).catch(() => undefined);
    };

    const goTo = (href: string) => {
        setPanel(null);
        void renditionRef.current?.display(href).catch(() => notify("Раздел не открылся", "error"));
    };

    if (error) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-10">
                <EmptyState
                    icon={<X className="size-6" />}
                    title="Не получилось открыть"
                    description={error}
                    action={
                        <Link to={`/book/${bookId}`}>
                            <Button variant="secondary">К карточке книги</Button>
                        </Link>
                    }
                />
            </main>
        );
    }

    const palette = THEMES[theme];

    return (
        <div
            className="flex h-dvh flex-col"
            style={{ background: palette.background, color: palette.color }}
        >
            <header className="flex shrink-0 items-center gap-2 px-3 py-2.5 sm:px-4">
                <Link
                    to={`/book/${bookId}`}
                    aria-label="Назад к книге"
                    className="grid size-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-black/5"
                >
                    <ArrowLeft className="size-5" />
                </Link>

                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p>

                <button
                    onClick={() => setPanel(panel === "toc" ? null : "toc")}
                    aria-label="Оглавление"
                    className="grid size-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-black/5"
                >
                    <List className="size-5" />
                </button>

                <button
                    onClick={() => setPanel(panel === "settings" ? null : "settings")}
                    aria-label="Настройки чтения"
                    className="grid size-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-black/5"
                >
                    <Settings2 className="size-5" />
                </button>
            </header>

            <div className="relative min-h-0 flex-1">
                {loading && (
                    <div className="absolute inset-0 z-10 grid place-items-center">
                        <Spinner className="size-8" />
                    </div>
                )}

                <div ref={viewer} className="h-full" />

                {/* Клик по краям листает — привычнее, чем целиться в кнопки. */}
                <button
                    onClick={() => turn("prev")}
                    aria-label="Предыдущая страница"
                    className="group absolute inset-y-0 left-0 grid w-14 place-items-center sm:w-20"
                >
                    <ChevronLeft className="size-6 opacity-0 transition-opacity group-hover:opacity-40" />
                </button>
                <button
                    onClick={() => turn("next")}
                    aria-label="Следующая страница"
                    className="group absolute inset-y-0 right-0 grid w-14 place-items-center sm:w-20"
                >
                    <ChevronRight className="size-6 opacity-0 transition-opacity group-hover:opacity-40" />
                </button>

                {panel && (
                    <>
                        <button
                            aria-label="Закрыть панель"
                            onClick={() => setPanel(null)}
                            className="absolute inset-0 z-20 bg-black/20"
                        />
                        <aside
                            className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col shadow-2xl"
                            style={{ background: palette.background }}
                        >
                            <header className="flex items-center justify-between border-b border-current/10 px-5 py-4">
                                <h2 className="font-display text-lg font-semibold">
                                    {panel === "toc" ? "Оглавление" : "Настройки"}
                                </h2>
                                <button
                                    onClick={() => setPanel(null)}
                                    aria-label="Закрыть"
                                    className="grid size-9 place-items-center rounded-full transition-colors hover:bg-black/5"
                                >
                                    <X className="size-5" />
                                </button>
                            </header>

                            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                                {panel === "toc" ? (
                                    toc.length ? (
                                        <ul className="space-y-1">
                                            {toc.map((item, index) => (
                                                <li key={`${item.href}-${index}`}>
                                                    <button
                                                        onClick={() => goTo(item.href)}
                                                        className="w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-black/5"
                                                    >
                                                        {item.label}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm opacity-60">
                                            В этой книге нет оглавления.
                                        </p>
                                    )
                                ) : (
                                    <div className="space-y-7">
                                        <div className="space-y-2.5">
                                            <p className="text-xs font-semibold tracking-wide uppercase opacity-60">
                                                Тема
                                            </p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(
                                                    Object.keys(THEMES) as ReadingTheme[]
                                                ).map((key) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => applyTheme(key)}
                                                        className={`rounded-2xl border-2 px-2 py-3 text-xs font-semibold transition-colors ${
                                                            theme === key
                                                                ? "border-brand-600"
                                                                : "border-transparent"
                                                        }`}
                                                        style={{
                                                            background: THEMES[key].background,
                                                            color: THEMES[key].color
                                                        }}
                                                    >
                                                        {THEMES[key].label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <p className="text-xs font-semibold tracking-wide uppercase opacity-60">
                                                Размер шрифта
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => applyFontSize(fontSize - 2)}
                                                    aria-label="Меньше"
                                                    className="grid size-10 place-items-center rounded-full border border-current/20 transition-colors hover:bg-black/5"
                                                >
                                                    <Minus className="size-4" />
                                                </button>
                                                <span className="flex-1 text-center text-lg font-semibold tabular-nums">
                                                    {fontSize}px
                                                </span>
                                                <button
                                                    onClick={() => applyFontSize(fontSize + 2)}
                                                    aria-label="Больше"
                                                    className="grid size-10 place-items-center rounded-full border border-current/20 transition-colors hover:bg-black/5"
                                                >
                                                    <Plus className="size-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </>
                )}
            </div>

            <footer className="flex shrink-0 items-center gap-3 px-4 py-2.5">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-current/10">
                    <div
                        className="h-full rounded-full bg-current/50 transition-[width] duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums opacity-60">
                    {progress}%
                </span>
            </footer>
        </div>
    );
}
