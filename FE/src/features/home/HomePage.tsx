import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookMarked, Heart, Library, Upload } from "lucide-react";
import { SearchInput } from "@/shared/ui/SearchInput";
import { Chip } from "@/shared/ui/Chip";
import { Button } from "@/shared/ui/Button";
import { PageLoader } from "@/shared/ui/Spinner";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useDebounced } from "@/shared/lib/useDebounced";
import { useGenres, useMyBooks } from "@/features/books/hooks";
import { BookCard } from "@/features/books/BookCard";
import { useBookActions } from "@/features/books/useBookActions";
import { CollectionsTab } from "@/features/collections/CollectionsTab";
import type { LibrarySort } from "@/shared/types";

type Tab = "books" | "collections";

export function HomePage() {
    const [params, setParams] = useSearchParams();
    const tab: Tab = params.get("tab") === "collections" ? "collections" : "books";

    const [search, setSearch] = useState("");
    const [genre, setGenre] = useState<string | null>(null);
    const [favourite, setFavourite] = useState(false);
    const [sort, setSort] = useState<LibrarySort>("added");

    const debouncedSearch = useDebounced(search);
    const genres = useGenres("library");
    const books = useMyBooks({
        title: debouncedSearch || undefined,
        genre: genre ?? undefined,
        favourite: favourite || undefined,
        sort
    });

    const { openMenu, onFavourite, dialogs } = useBookActions();

    const setTab = (next: Tab) => {
        params.set("tab", next);
        setParams(params, { replace: true });
    };

    return (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
            <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={
                    tab === "books"
                        ? "Search a book from your uploads"
                        : "Поиск по названию коллекции"
                }
            />

            {/* Табы «All books | Collections» — ровно как на вайрфрейме. */}
            <div className="mt-6 flex items-center gap-6 border-b border-line">
                {(
                    [
                        ["books", "All books"],
                        ["collections", "Collections"]
                    ] as const
                ).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`-mb-px border-b-2 pb-3 font-display text-lg font-semibold whitespace-nowrap transition-colors ${
                            tab === key
                                ? "border-brand-700 text-ink"
                                : "border-transparent text-ink-faint hover:text-ink-soft"
                        }`}
                    >
                        {label}
                    </button>
                ))}

                {/* На телефоне загрузка и так есть в нижнем таб-баре, а тут она ломает табы. */}
                <Link to="/upload" className="ml-auto hidden pb-2 sm:block">
                    <Button size="sm" icon={<Upload className="size-4" />}>
                        Загрузить
                    </Button>
                </Link>
            </div>

            {tab === "collections" ? (
                <CollectionsTab search={debouncedSearch} />
            ) : (
                <>
                    <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
                        <Chip active={favourite} onClick={() => setFavourite(!favourite)}>
                            <span className="flex items-center gap-1.5">
                                <Heart className={`size-3.5 ${favourite ? "fill-current" : ""}`} />
                                Избранное
                            </span>
                        </Chip>

                        <span className="w-px shrink-0 self-stretch bg-line" />

                        <Chip active={!genre} onClick={() => setGenre(null)}>
                            Все жанры
                        </Chip>
                        {genres.data?.map((item) => (
                            <Chip
                                key={item}
                                active={genre === item}
                                onClick={() => setGenre(genre === item ? null : item)}
                            >
                                {item}
                            </Chip>
                        ))}

                        <span className="w-px shrink-0 self-stretch bg-line" />

                        <Chip
                            active={sort === "title"}
                            onClick={() => setSort(sort === "title" ? "added" : "title")}
                        >
                            По алфавиту
                        </Chip>
                    </div>

                    <div className="mt-6">
                        {books.isLoading ? (
                            <PageLoader />
                        ) : books.data?.length ? (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                                {books.data.map((book) => (
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        onMenu={openMenu}
                                        onFavourite={onFavourite}
                                    />
                                ))}
                            </div>
                        ) : debouncedSearch || genre || favourite ? (
                            <EmptyState
                                icon={<BookMarked className="size-6" />}
                                title="Ничего не нашлось"
                                description="Попробуйте изменить запрос или снять фильтры."
                            />
                        ) : (
                            <EmptyState
                                icon={<Library className="size-6" />}
                                title="Библиотека пока пуста"
                                description="Загрузите свой первый .epub или добавьте книгу из каталога."
                                action={
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <Link to="/upload">
                                            <Button icon={<Upload className="size-4" />}>
                                                Загрузить книгу
                                            </Button>
                                        </Link>
                                        <Link to="/library">
                                            <Button variant="secondary">Открыть каталог</Button>
                                        </Link>
                                    </div>
                                }
                            />
                        )}
                    </div>
                </>
            )}

            {dialogs}
        </main>
    );
}
