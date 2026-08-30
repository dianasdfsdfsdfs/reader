import { Link } from "react-router-dom";
import { Heart, Globe, Lock, MoreHorizontal } from "lucide-react";
import { Cover } from "@/shared/ui/Cover";
import { Progress } from "@/shared/ui/Progress";
import type { Book, UserBook } from "@/shared/types";

const isUserBook = (book: Book | UserBook): book is UserBook => "progress" in book;

interface Props {
    book: Book | UserBook;
    onMenu?: (book: UserBook) => void;
    onFavourite?: (book: UserBook) => void;
    footer?: React.ReactNode;
}

export function BookCard({ book, onMenu, onFavourite, footer }: Props) {
    const owned = isUserBook(book);

    return (
        <article className="group relative">
            <Link to={`/book/${book.id}`} className="block">
                <Cover
                    title={book.title}
                    author={book.author}
                    url={book.coverUrl}
                    className="transition-transform duration-200 group-hover:-translate-y-1"
                />
            </Link>

            {owned && (
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-lg:opacity-100">
                    {onFavourite && (
                        <button
                            onClick={() => onFavourite(book)}
                            aria-label={
                                book.favourite ? "Убрать из избранного" : "В избранное"
                            }
                            aria-pressed={book.favourite}
                            className="grid size-8 place-items-center rounded-full bg-surface/90 text-ink-soft shadow-sm backdrop-blur transition-colors hover:text-red-500"
                        >
                            <Heart
                                className={`size-4 ${book.favourite ? "fill-red-500 text-red-500" : ""}`}
                            />
                        </button>
                    )}
                    {onMenu && (
                        <button
                            onClick={() => onMenu(book)}
                            aria-label={`Действия: ${book.title}`}
                            className="grid size-8 place-items-center rounded-full bg-surface/90 text-ink-soft shadow-sm backdrop-blur transition-colors hover:text-ink"
                        >
                            <MoreHorizontal className="size-4" />
                        </button>
                    )}
                </div>
            )}

            <div className="mt-2.5 space-y-1.5">
                <Link to={`/book/${book.id}`} className="block">
                    <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-ink">
                        {book.title}
                    </h3>
                    {book.author && (
                        <p className="truncate text-xs text-ink-faint">{book.author}</p>
                    )}
                </Link>

                {owned ? (
                    <>
                        <Progress value={book.progress} />
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-faint">
                            {book.isPublic ? (
                                <>
                                    <Globe className="size-3" /> Public
                                </>
                            ) : (
                                <>
                                    <Lock className="size-3" /> Privat
                                </>
                            )}
                        </span>
                    </>
                ) : (
                    footer
                )}
            </div>
        </article>
    );
}
