import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FolderOpen, PencilLine, Trash2, X } from "lucide-react";
import { BookCard } from "@/features/books/BookCard";
import { useBookActions } from "@/features/books/useBookActions";
import {
    useCollection,
    useDeleteCollection,
    useRenameCollection,
    useToggleBookInCollection
} from "@/features/books/hooks";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Field, Input } from "@/shared/ui/Field";
import { PageLoader } from "@/shared/ui/Spinner";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useToast } from "@/shared/ui/Toast";
import { ApiError } from "@/shared/api/client";
import { pluralizeBooks } from "@/shared/lib/format";

export function CollectionPage() {
    const { id } = useParams();
    const collectionId = Number(id);
    const navigate = useNavigate();
    const [renaming, setRenaming] = useState(false);

    const { data, isLoading, isError } = useCollection(collectionId);
    const removeFromCollection = useToggleBookInCollection();
    const deleteCollection = useDeleteCollection();
    const { openMenu, onFavourite, dialogs } = useBookActions();
    const { notify } = useToast();

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError || !data) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-10">
                <EmptyState
                    icon={<FolderOpen className="size-6" />}
                    title="Коллекция не найдена"
                    action={
                        <Link to="/?tab=collections">
                            <Button variant="secondary">К коллекциям</Button>
                        </Link>
                    }
                />
            </main>
        );
    }

    const remove = async () => {
        if (!confirm(`Удалить коллекцию «${data.name}»? Книги останутся в библиотеке.`)) {
            return;
        }

        try {
            await deleteCollection.mutateAsync(collectionId);
            notify("Коллекция удалена");
            navigate("/?tab=collections");
        } catch (error) {
            notify(error instanceof ApiError ? error.message : "Не получилось", "error");
        }
    };

    return (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
            <Link
                to="/?tab=collections"
                className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
            >
                <ArrowLeft className="size-4" />
                Коллекции
            </Link>

            <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="font-display text-3xl font-bold text-ink">{data.name}</h1>
                    <p className="mt-1 text-sm text-ink-soft">
                        {pluralizeBooks(data.booksCount)}
                        {data.description ? ` · ${data.description}` : ""}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRenaming(true)}
                        icon={<PencilLine className="size-4" />}
                    >
                        Переименовать
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={remove}
                        icon={<Trash2 className="size-4" />}
                    >
                        Удалить
                    </Button>
                </div>
            </header>

            {data.books.length ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {data.books.map((book) => (
                        <div key={book.id} className="group/remove relative">
                            <BookCard book={book} onMenu={openMenu} onFavourite={onFavourite} />
                            <button
                                onClick={() =>
                                    removeFromCollection.mutate({
                                        collectionId,
                                        bookId: book.id,
                                        member: true
                                    })
                                }
                                aria-label={`Убрать «${book.title}» из коллекции`}
                                className="absolute top-2 left-2 grid size-8 place-items-center rounded-full bg-surface/90 text-ink-soft opacity-0 shadow-sm backdrop-blur transition-all group-hover/remove:opacity-100 focus:opacity-100 hover:text-red-600 max-lg:opacity-100"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<FolderOpen className="size-6" />}
                    title="В коллекции пока пусто"
                    description="Откройте книгу на главной, нажмите «…» и выберите Add to collection."
                    action={
                        <Link to="/">
                            <Button variant="secondary">К моим книгам</Button>
                        </Link>
                    }
                />
            )}

            <RenameModal
                open={renaming}
                onClose={() => setRenaming(false)}
                collectionId={collectionId}
                initialName={data.name}
                initialDescription={data.description ?? ""}
            />

            {dialogs}
        </main>
    );
}

function RenameModal({
    open,
    onClose,
    collectionId,
    initialName,
    initialDescription
}: {
    open: boolean;
    onClose: () => void;
    collectionId: number;
    initialName: string;
    initialDescription: string;
}) {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const rename = useRenameCollection();
    const { notify } = useToast();

    const save = async () => {
        try {
            await rename.mutateAsync({
                id: collectionId,
                name: name.trim(),
                description: description.trim() || null
            });
            notify("Коллекция обновлена");
            onClose();
        } catch (error) {
            notify(error instanceof ApiError ? error.message : "Не получилось", "error");
        }
    };

    return (
        <Modal
            open={open}
            title="Переименовать коллекцию"
            onClose={onClose}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button onClick={save} disabled={!name.trim() || rename.isPending}>
                        Сохранить
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Field label="Название">
                    <Input
                        autoFocus
                        maxLength={100}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </Field>
                <Field label="Описание" hint="Необязательно">
                    <Input
                        maxLength={500}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                </Field>
            </div>
        </Modal>
    );
}
