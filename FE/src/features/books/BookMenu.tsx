import { FolderPlus, Globe, ImageUp, Lock, PencilLine, Trash2 } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import type { UserBook } from "@/shared/types";

interface Props {
    book: UserBook | null;
    onClose: () => void;
    onEdit: (book: UserBook, focus: "title" | "cover") => void;
    onAddToCollection: (book: UserBook) => void;
    onToggleVisibility: (book: UserBook) => void;
    onDelete: (book: UserBook) => void;
}

const row =
    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:cursor-default disabled:hover:bg-transparent";

/** Меню «…» с вайрфрейма: сменить обложку, переименовать, в коллекцию, public/private. */
export function BookMenu({
    book,
    onClose,
    onEdit,
    onAddToCollection,
    onToggleVisibility,
    onDelete
}: Props) {
    if (!book) {
        return null;
    }

    return (
        <Modal open title={book.title} onClose={onClose}>
            <div className="space-y-1">
                <button className={row} onClick={() => onEdit(book, "cover")}>
                    <ImageUp className="size-5 text-brand-700" />
                    Change cover
                </button>

                <button className={row} onClick={() => onEdit(book, "title")}>
                    <PencilLine className="size-5 text-brand-700" />
                    Change name
                </button>

                <button className={row} onClick={() => onAddToCollection(book)}>
                    <FolderPlus className="size-5 text-brand-700" />
                    Add to collection
                </button>

                <button
                    className={row}
                    onClick={() => onToggleVisibility(book)}
                    // Опубликованную книгу бэкенд обратно в приватные не возвращает:
                    // её могли добавить к себе другие читатели.
                    disabled={book.isPublic}
                >
                    {book.isPublic ? (
                        <>
                            <Globe className="size-5 text-brand-700" />
                            <span className="flex flex-col">
                                Опубликована
                                <span className="text-xs font-normal text-ink-faint">
                                    Вернуть в приватные уже нельзя
                                </span>
                            </span>
                        </>
                    ) : (
                        <>
                            <Lock className="size-5 text-brand-700" />
                            Make public
                        </>
                    )}
                </button>

                <button
                    className={`${row} text-red-600 hover:bg-red-50`}
                    onClick={() => onDelete(book)}
                >
                    <Trash2 className="size-5" />
                    Убрать из библиотеки
                </button>
            </div>
        </Modal>
    );
}
