import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FolderPlus, Plus } from "lucide-react";
import { Shelf, ShelfItem } from "@/shared/ui/Shelf";
import { Cover } from "@/shared/ui/Cover";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Field, Input } from "@/shared/ui/Field";
import { PageLoader } from "@/shared/ui/Spinner";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useToast } from "@/shared/ui/Toast";
import { ApiError } from "@/shared/api/client";
import { pluralizeBooks } from "@/shared/lib/format";
import { useCollections, useCreateCollection } from "@/features/books/hooks";

/**
 * Таб Collections на главной. По вайрфрейму коллекции идут сверху вниз,
 * а книги внутри каждой листаются вбок.
 */
export function CollectionsTab({ search }: { search: string }) {
    const [creating, setCreating] = useState(false);
    const collections = useCollections();

    const visible = collections.data?.filter((collection) =>
        collection.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    return (
        <div className="mt-6 space-y-8">
            <div className="flex justify-end">
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="size-4" />}
                    onClick={() => setCreating(true)}
                >
                    Новая коллекция
                </Button>
            </div>

            {collections.isLoading ? (
                <PageLoader />
            ) : visible?.length ? (
                visible.map((collection) => (
                    <Shelf
                        key={collection.id}
                        title={collection.name}
                        subtitle={pluralizeBooks(collection.booksCount)}
                        action={
                            <Link
                                to={`/collection/${collection.id}`}
                                className="flex items-center gap-1 text-xs font-semibold text-brand-800 hover:underline"
                            >
                                Открыть
                                <ArrowRight className="size-3.5" />
                            </Link>
                        }
                    >
                        {collection.books.length ? (
                            collection.books.map((book) => (
                                <ShelfItem key={book.id}>
                                    <Link to={`/book/${book.id}`}>
                                        <Cover
                                            title={book.title}
                                            author={book.author}
                                            url={book.coverUrl}
                                        />
                                        <p className="mt-2 line-clamp-2 text-xs font-semibold text-ink">
                                            {book.title}
                                        </p>
                                    </Link>
                                </ShelfItem>
                            ))
                        ) : (
                            <Link
                                to={`/collection/${collection.id}`}
                                className="flex h-40 w-full items-center justify-center rounded-2xl border border-dashed border-line text-sm text-ink-faint transition-colors hover:border-brand-400 hover:text-ink-soft"
                            >
                                Пока пусто — добавьте книги
                            </Link>
                        )}
                    </Shelf>
                ))
            ) : search ? (
                <EmptyState
                    icon={<FolderPlus className="size-6" />}
                    title="Коллекция не найдена"
                    description="Попробуйте другое название."
                />
            ) : (
                <EmptyState
                    icon={<FolderPlus className="size-6" />}
                    title="Коллекций пока нет"
                    description="Соберите книги по языку, жанру или настроению — как удобно."
                    action={
                        <Button onClick={() => setCreating(true)} icon={<Plus className="size-4" />}>
                            Создать коллекцию
                        </Button>
                    }
                />
            )}

            <CreateCollectionModal open={creating} onClose={() => setCreating(false)} />
        </div>
    );
}

function CreateCollectionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const createCollection = useCreateCollection();
    const { notify } = useToast();

    const submit = async (event: FormEvent) => {
        event.preventDefault();

        try {
            const collection = await createCollection.mutateAsync({
                name: name.trim(),
                description: description.trim() || undefined
            });

            notify(`Коллекция «${collection.name}» создана`);
            setName("");
            setDescription("");
            onClose();
        } catch (error) {
            notify(error instanceof ApiError ? error.message : "Не получилось", "error");
        }
    };

    return (
        <Modal open={open} title="Новая коллекция" onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <Field label="Название">
                    <Input
                        autoFocus
                        required
                        maxLength={100}
                        placeholder="English"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </Field>

                <Field label="Описание" hint="Необязательно">
                    <Input
                        maxLength={500}
                        placeholder="Книги на английском"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                </Field>

                <Button
                    type="submit"
                    fullWidth
                    disabled={!name.trim() || createCollection.isPending}
                >
                    Создать
                </Button>
            </form>
        </Modal>
    );
}
