import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Compass, Plus, Users } from "lucide-react";
import { SearchInput } from "@/shared/ui/SearchInput";
import { Shelf, ShelfItem } from "@/shared/ui/Shelf";
import { Cover } from "@/shared/ui/Cover";
import { Button } from "@/shared/ui/Button";
import { PageLoader } from "@/shared/ui/Spinner";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useToast } from "@/shared/ui/Toast";
import { ApiError } from "@/shared/api/client";
import { useDebounced } from "@/shared/lib/useDebounced";
import { useAddToLibrary, useCatalogSearch, useCatalogSections } from "@/features/books/hooks";
import type { Book } from "@/shared/types";

/** Экран Library с вайрфрейма: «Most popular» и дальше по жанру на секцию. */
export function LibraryPage() {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounced(search);

    const sections = useCatalogSections();
    const results = useCatalogSearch(debouncedSearch);
    const [added, setAdded] = useState<Set<number>>(new Set());

    const addToLibrary = useAddToLibrary();
    const { notify } = useToast();

    const add = async (book: Book) => {
        try {
            await addToLibrary.mutateAsync(book.id);
            setAdded((current) => new Set(current).add(book.id));
            notify(`«${book.title}» теперь в вашей библиотеке`);
        } catch (error) {
            notify(error instanceof ApiError ? error.message : "Не получилось", "error");
        }
    };

    const searching = debouncedSearch.trim().length > 0;

    return (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
            <div className="mb-7">
                <h1 className="mb-4 font-display text-3xl font-bold text-ink">Library</h1>
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search a book in the library"
                />
            </div>

            {searching ? (
                results.isLoading ? (
                    <PageLoader />
                ) : results.data?.length ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                        {results.data.map((book) => (
                            <CatalogBook
                                key={book.id}
                                book={book}
                                added={added.has(book.id)}
                                onAdd={add}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<Compass className="size-6" />}
                        title="Ничего не нашлось"
                        description="В каталоге нет публичных книг с таким названием."
                    />
                )
            ) : sections.isLoading ? (
                <PageLoader />
            ) : sections.data?.length ? (
                <div className="space-y-10">
                    {sections.data.map((section) => (
                        <Shelf key={section.key} title={section.title}>
                            {section.books.map((book) => (
                                <ShelfItem key={book.id}>
                                    <CatalogBook
                                        book={book}
                                        added={added.has(book.id)}
                                        onAdd={add}
                                    />
                                </ShelfItem>
                            ))}
                        </Shelf>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<Compass className="size-6" />}
                    title="Каталог пуст"
                    description="Здесь появятся книги, которые читатели сделали публичными. Опубликуйте свою — она будет первой."
                    action={
                        <Link to="/upload">
                            <Button>Загрузить книгу</Button>
                        </Link>
                    }
                />
            )}
        </main>
    );
}

function CatalogBook({
    book,
    added,
    onAdd
}: {
    book: Book;
    added: boolean;
    onAdd: (book: Book) => void;
}) {
    return (
        <article className="group">
            <Link to={`/book/${book.id}`}>
                <Cover
                    title={book.title}
                    author={book.author}
                    url={book.coverUrl}
                    className="transition-transform duration-200 group-hover:-translate-y-1"
                />
            </Link>

            <div className="mt-2.5 space-y-2">
                <Link to={`/book/${book.id}`} className="block">
                    <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-ink">
                        {book.title}
                    </h3>
                    {book.author && (
                        <p className="truncate text-xs text-ink-faint">{book.author}</p>
                    )}
                </Link>

                {book.readersCount !== undefined && (
                    <p className="flex items-center gap-1 text-[11px] text-ink-faint">
                        <Users className="size-3" />
                        {book.readersCount}
                    </p>
                )}

                <Button
                    size="sm"
                    fullWidth
                    variant={added ? "secondary" : "primary"}
                    disabled={added}
                    onClick={() => onAdd(book)}
                    icon={added ? <Check className="size-4" /> : <Plus className="size-4" />}
                >
                    {added ? "В библиотеке" : "Добавить"}
                </Button>
            </div>
        </article>
    );
}
