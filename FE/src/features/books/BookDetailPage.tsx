import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Check, Globe, Heart, Lock, MoreHorizontal, Plus } from "lucide-react";
import { Cover } from "@/shared/ui/Cover";
import { Button } from "@/shared/ui/Button";
import { Progress } from "@/shared/ui/Progress";
import { PageLoader } from "@/shared/ui/Spinner";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useToast } from "@/shared/ui/Toast";
import { ApiError } from "@/shared/api/client";
import { useAddToLibrary, useBook } from "./hooks";
import { useBookActions } from "./useBookActions";
import type { UserBook } from "@/shared/types";

export function BookDetailPage() {
    const { id } = useParams();
    const bookId = Number(id);
    const navigate = useNavigate();
    const { data, isLoading, isError } = useBook(bookId, Number.isFinite(bookId));
    const { openMenu, onFavourite, dialogs } = useBookActions();
    const addToLibrary = useAddToLibrary();
    const { notify } = useToast();

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError || !data) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-10">
                <EmptyState
                    icon={<BookOpen className="size-6" />}
                    title="Книга не найдена"
                    description="Возможно, её удалили или она больше не публичная."
                    action={
                        <Link to="/">
                            <Button variant="secondary">На главную</Button>
                        </Link>
                    }
                />
            </main>
        );
    }

    const { book, inLibrary } = data;
    const owned = inLibrary ? (book as UserBook) : null;

    const add = async () => {
        try {
            await addToLibrary.mutateAsync(book.id);
            notify("Книга добавлена в библиотеку");
        } catch (error) {
            notify(error instanceof ApiError ? error.message : "Не получилось", "error");
        }
    };

    return (
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
            >
                <ArrowLeft className="size-4" />
                Назад
            </button>

            <div className="flex flex-col gap-7 sm:flex-row sm:gap-9">
                <div className="w-44 shrink-0 self-center sm:self-start">
                    <Cover title={book.title} author={book.author} url={book.coverUrl} />
                </div>

                <div className="min-w-0 flex-1">
                    <h1 className="font-display text-3xl leading-tight font-bold text-ink">
                        {book.title}
                    </h1>
                    {book.author && <p className="mt-1.5 text-ink-soft">{book.author}</p>}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-ink-soft">
                            {book.isPublic ? (
                                <>
                                    <Globe className="size-3.5" /> Public
                                </>
                            ) : (
                                <>
                                    <Lock className="size-3.5" /> Privat
                                </>
                            )}
                        </span>

                        {book.language && (
                            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-ink-soft uppercase">
                                {book.language}
                            </span>
                        )}

                        {book.genres.map((genre) => (
                            <span
                                key={genre}
                                className="rounded-full bg-brand-100/60 px-3 py-1 text-xs font-semibold text-brand-900"
                            >
                                {genre}
                            </span>
                        ))}
                    </div>

                    {owned && (
                        <div className="mt-6 max-w-xs">
                            <Progress value={owned.progress} />
                        </div>
                    )}

                    <div className="mt-7 flex flex-wrap gap-2">
                        {owned ? (
                            <>
                                <Link to={`/read/${book.id}`}>
                                    <Button size="lg" icon={<BookOpen className="size-4" />}>
                                        {owned.progress > 0 ? "Продолжить" : "Читать"}
                                    </Button>
                                </Link>

                                <Button
                                    size="lg"
                                    variant="secondary"
                                    onClick={() => onFavourite(owned)}
                                    icon={
                                        <Heart
                                            className={`size-4 ${owned.favourite ? "fill-red-500 text-red-500" : ""}`}
                                        />
                                    }
                                >
                                    {owned.favourite ? "В избранном" : "В избранное"}
                                </Button>

                                <Button
                                    size="lg"
                                    variant="secondary"
                                    onClick={() => openMenu(owned)}
                                    icon={<MoreHorizontal className="size-4" />}
                                >
                                    Ещё
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="lg"
                                onClick={add}
                                disabled={addToLibrary.isPending}
                                icon={
                                    addToLibrary.isSuccess ? (
                                        <Check className="size-4" />
                                    ) : (
                                        <Plus className="size-4" />
                                    )
                                }
                            >
                                {addToLibrary.isSuccess
                                    ? "Добавлена"
                                    : "Добавить в библиотеку"}
                            </Button>
                        )}
                    </div>

                    {book.readersCount !== undefined && (
                        <p className="mt-5 text-sm text-ink-faint">
                            Читателей: {book.readersCount}
                        </p>
                    )}
                </div>
            </div>

            {dialogs}
        </main>
    );
}
