import { useState, type FormEvent } from "react";
import { Check, FolderPlus, Plus } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Field";
import { Spinner } from "@/shared/ui/Spinner";
import { useToast } from "@/shared/ui/Toast";
import { ApiError } from "@/shared/api/client";
import { pluralizeBooks } from "@/shared/lib/format";
import { useBook, useCollections, useCreateCollection, useToggleBookInCollection } from "./hooks";
import type { UserBook } from "@/shared/types";

interface Props {
    book: UserBook | null;
    onClose: () => void;
}

export function AddToCollectionModal({ book, onClose }: Props) {
    const [name, setName] = useState("");
    const collections = useCollections();
    // Отметки берём из карточки книги: она знает, в каких коллекциях книга лежит.
    const detail = useBook(book?.id ?? 0, Boolean(book));
    const toggle = useToggleBookInCollection();
    const createCollection = useCreateCollection();
    const { notify } = useToast();

    if (!book) {
        return null;
    }

    const memberIds = new Set(detail.data?.collectionIds ?? []);

    const onToggle = async (collectionId: number) => {
        const member = memberIds.has(collectionId);

        try {
            await toggle.mutateAsync({ collectionId, bookId: book.id, member });
        } catch (error) {
            notify(error instanceof ApiError ? error.message : "Не получилось", "error");
        }
    };

    const create = async (event: FormEvent) => {
        event.preventDefault();

        const trimmed = name.trim();

        if (!trimmed) {
            return;
        }

        try {
            const collection = await createCollection.mutateAsync({ name: trimmed });

            setName("");
            await toggle.mutateAsync({
                collectionId: collection.id,
                bookId: book.id,
                member: false
            });
            notify(`Коллекция «${collection.name}» создана`);
        } catch (error) {
            notify(error instanceof ApiError ? error.message : "Не получилось", "error");
        }
    };

    return (
        <Modal open title="В коллекцию" onClose={onClose}>
            <form onSubmit={create} className="mb-4 flex gap-2">
                <Input
                    value={name}
                    placeholder="Новая коллекция"
                    maxLength={100}
                    onChange={(event) => setName(event.target.value)}
                />
                <Button
                    type="submit"
                    size="md"
                    disabled={!name.trim() || createCollection.isPending}
                    icon={<Plus className="size-4" />}
                >
                    Создать
                </Button>
            </form>

            {collections.isLoading || detail.isLoading ? (
                <div className="flex justify-center py-8">
                    <Spinner />
                </div>
            ) : collections.data?.length ? (
                <ul className="space-y-1">
                    {collections.data.map((collection) => {
                        const member = memberIds.has(collection.id);

                        return (
                            <li key={collection.id}>
                                <button
                                    onClick={() => onToggle(collection.id)}
                                    disabled={toggle.isPending}
                                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-surface-muted disabled:opacity-60"
                                >
                                    <span
                                        className={`grid size-6 shrink-0 place-items-center rounded-lg border transition-colors ${
                                            member
                                                ? "border-brand-700 bg-brand-700 text-white"
                                                : "border-line"
                                        }`}
                                    >
                                        {member && <Check className="size-4" />}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-ink">
                                            {collection.name}
                                        </span>
                                        <span className="block text-xs text-ink-faint">
                                            {pluralizeBooks(collection.booksCount)}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="flex items-center gap-2.5 rounded-2xl bg-surface-muted px-4 py-5 text-sm text-ink-soft">
                    <FolderPlus className="size-5 shrink-0 text-brand-700" />
                    Коллекций пока нет — создайте первую сверху.
                </p>
            )}
        </Modal>
    );
}
