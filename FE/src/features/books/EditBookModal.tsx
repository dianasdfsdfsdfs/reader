import { useEffect, useState } from "react";
import { ImageUp } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Field, Input } from "@/shared/ui/Field";
import { Cover } from "@/shared/ui/Cover";
import { Spinner } from "@/shared/ui/Spinner";
import { useEditBook } from "./hooks";
import { useToast } from "@/shared/ui/Toast";
import { ApiError } from "@/shared/api/client";
import type { UserBook } from "@/shared/types";

interface Props {
    book: UserBook | null;
    focus: "title" | "cover";
    onClose: () => void;
}

export function EditBookModal({ book, focus, onClose }: Props) {
    const [title, setTitle] = useState("");
    const [cover, setCover] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const editBook = useEditBook();
    const { notify } = useToast();

    useEffect(() => {
        setTitle(book?.title ?? "");
        setCover(null);
        setPreview(null);
    }, [book]);

    useEffect(() => {
        if (!cover) {
            return;
        }

        const url = URL.createObjectURL(cover);

        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [cover]);

    if (!book) {
        return null;
    }

    const save = async () => {
        try {
            await editBook.mutateAsync({
                id: book.id,
                title: title.trim() !== book.title ? title.trim() : undefined,
                cover
            });
            notify("Книга обновлена");
            onClose();
        } catch (error) {
            notify(error instanceof ApiError ? error.message : "Не удалось сохранить", "error");
        }
    };

    return (
        <Modal
            open
            title="Изменить книгу"
            onClose={onClose}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button onClick={save} disabled={editBook.isPending}>
                        {editBook.isPending && (
                            <Spinner className="size-4 border-white/40 border-t-white" />
                        )}
                        Сохранить
                    </Button>
                </>
            }
        >
            <div className="flex gap-5">
                <div className="w-28 shrink-0">
                    <Cover title={title || book.title} url={preview ?? book.coverUrl} />
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                    <Field label="Название">
                        <Input
                            autoFocus={focus === "title"}
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                        />
                    </Field>

                    <div className="space-y-1.5">
                        <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                            Обложка
                        </span>
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-ink-soft transition-colors hover:border-brand-500 hover:text-ink">
                            <ImageUp className="size-4 shrink-0" />
                            <span className="truncate">{cover?.name ?? "Выбрать картинку"}</span>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(event) => setCover(event.target.files?.[0] ?? null)}
                            />
                        </label>
                        <span className="block text-xs text-ink-faint">
                            JPEG, PNG или WebP, до 5 МБ
                        </span>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
