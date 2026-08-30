import { useState } from "react";
import { BookMenu } from "./BookMenu";
import { EditBookModal } from "./EditBookModal";
import { AddToCollectionModal } from "./AddToCollectionModal";
import { useDeleteBook, useEditBook, useToggleFavourite } from "./hooks";
import { useToast } from "@/shared/ui/Toast";
import { ApiError } from "@/shared/api/client";
import type { UserBook } from "@/shared/types";

/**
 * Меню «…» и его диалоги нужны на главной, внутри коллекции и в карточке книги.
 * Хук держит состояние и отдаёт готовую разметку, чтобы не дублировать её трижды.
 */
export function useBookActions() {
    const [menuBook, setMenuBook] = useState<UserBook | null>(null);
    const [editBook, setEditBook] = useState<UserBook | null>(null);
    const [editFocus, setEditFocus] = useState<"title" | "cover">("title");
    const [collectionBook, setCollectionBook] = useState<UserBook | null>(null);

    const toggleFavourite = useToggleFavourite();
    const editBookMutation = useEditBook();
    const deleteBook = useDeleteBook();
    const { notify } = useToast();

    const fail = (error: unknown) =>
        notify(error instanceof ApiError ? error.message : "Что-то пошло не так", "error");

    const onFavourite = (book: UserBook) =>
        toggleFavourite
            .mutateAsync({ id: book.id, favourite: !book.favourite })
            .catch(fail);

    const onToggleVisibility = async (book: UserBook) => {
        setMenuBook(null);

        try {
            await editBookMutation.mutateAsync({ id: book.id, visibility: "PUBLIC" });
            notify("Книга опубликована в каталоге");
        } catch (error) {
            fail(error);
        }
    };

    const onDelete = async (book: UserBook) => {
        setMenuBook(null);

        if (!confirm(`Убрать «${book.title}» из библиотеки?`)) {
            return;
        }

        try {
            await deleteBook.mutateAsync(book.id);
            notify("Книга убрана из библиотеки");
        } catch (error) {
            fail(error);
        }
    };

    const dialogs = (
        <>
            <BookMenu
                book={menuBook}
                onClose={() => setMenuBook(null)}
                onEdit={(book, focus) => {
                    setMenuBook(null);
                    setEditFocus(focus);
                    setEditBook(book);
                }}
                onAddToCollection={(book) => {
                    setMenuBook(null);
                    setCollectionBook(book);
                }}
                onToggleVisibility={onToggleVisibility}
                onDelete={onDelete}
            />

            <EditBookModal book={editBook} focus={editFocus} onClose={() => setEditBook(null)} />

            <AddToCollectionModal
                book={collectionBook}
                onClose={() => setCollectionBook(null)}
            />
        </>
    );

    return { openMenu: setMenuBook, onFavourite, dialogs };
}
