import { useEffect, useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Check, FileUp, Globe, ImageUp, Lock, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/Button";
import { Field, Input } from "@/shared/ui/Field";
import { Cover } from "@/shared/ui/Cover";
import { Spinner } from "@/shared/ui/Spinner";
import { useToast } from "@/shared/ui/Toast";
import { ApiError } from "@/shared/api/client";
import { booksApi } from "@/shared/api/books";
import { readEpubMetadata } from "@/shared/lib/epub";
import type { Visibility } from "@/shared/types";

const MAX_BOOK_SIZE = 50 * 1024 * 1024;

/** Небольшие книги в мегабайтах округляются до «0.0 МБ», поэтому до мегабайта показываем КБ. */
const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
        ? `${Math.max(Math.round(bytes / 1024), 1)} КБ`
        : `${(bytes / 1024 / 1024).toFixed(1)} МБ`;

/**
 * Загрузка в два шага, как на вайрфрейме: сначала «Upload a book in .epub»,
 * потом форма метаданных с ⊗ и ✓. Название, автора, язык и обложку читаем
 * из самого файла — бэкенд .epub не разбирает.
 */
export function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [parsing, setParsing] = useState(false);
    const [dragging, setDragging] = useState(false);

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [language, setLanguage] = useState("");
    const [genres, setGenres] = useState("");
    const [visibility, setVisibility] = useState<Visibility>("PRIVATE");
    const [cover, setCover] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    const fileInput = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { notify } = useToast();

    useEffect(() => {
        if (!cover) {
            setCoverPreview(null);
            return;
        }

        const url = URL.createObjectURL(cover);

        setCoverPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [cover]);

    const upload = useMutation({
        mutationFn: () =>
            booksApi.upload({
                file: file!,
                cover,
                title: title.trim(),
                author: author.trim() || undefined,
                language: language.trim() || undefined,
                genres: genres
                    .split(",")
                    .map((genre) => genre.trim())
                    .filter(Boolean)
                    .slice(0, 10),
                visibility
            }),
        onSuccess: (book) => {
            queryClient.invalidateQueries({ queryKey: ["books"] });
            notify(`«${book.title}» добавлена в библиотеку`);
            navigate(`/book/${book.id}`);
        },
        onError: (error) =>
            notify(error instanceof ApiError ? error.message : "Не удалось загрузить", "error")
    });

    const accept = async (picked: File | undefined | null) => {
        if (!picked) {
            return;
        }

        if (!picked.name.toLowerCase().endsWith(".epub")) {
            notify("Нужен файл в формате .epub", "error");
            return;
        }

        if (picked.size > MAX_BOOK_SIZE) {
            notify("Файл больше 50 МБ", "error");
            return;
        }

        setFile(picked);
        setParsing(true);

        const metadata = await readEpubMetadata(picked);

        setTitle(metadata.title);
        setAuthor(metadata.author);
        setLanguage(metadata.language);
        setCover(metadata.cover);
        setParsing(false);
    };

    const reset = () => {
        setFile(null);
        setTitle("");
        setAuthor("");
        setLanguage("");
        setGenres("");
        setCover(null);
        setVisibility("PRIVATE");
    };

    const onDrop = (event: DragEvent) => {
        event.preventDefault();
        setDragging(false);
        void accept(event.dataTransfer.files?.[0]);
    };

    /* ---------------------------------------------------------- шаг 1 */

    if (!file) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
                <h1 className="mb-6 font-display text-3xl font-bold text-ink">Upload</h1>

                <div
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={`flex min-h-[26rem] flex-col items-center justify-center rounded-card border-2 border-dashed px-6 text-center transition-colors ${
                        dragging ? "border-brand-600 bg-brand-100/20" : "border-line bg-surface"
                    }`}
                >
                    <div className="mb-5 grid size-16 place-items-center rounded-full bg-brand-100/60 text-brand-800">
                        <FileUp className="size-7" />
                    </div>

                    <p className="font-display text-2xl font-bold text-ink">Upload a book</p>
                    <p className="mt-1 text-sm text-ink-soft">
                        in <span className="font-semibold">.epub</span> — до 50 МБ
                    </p>

                    <Button
                        size="lg"
                        className="mt-7"
                        onClick={() => fileInput.current?.click()}
                        icon={<FileUp className="size-4" />}
                    >
                        Выбрать файл
                    </Button>

                    <p className="mt-3 text-xs text-ink-faint">или перетащите его сюда</p>

                    <input
                        ref={fileInput}
                        type="file"
                        accept=".epub,application/epub+zip"
                        className="hidden"
                        onChange={(event) => void accept(event.target.files?.[0])}
                    />
                </div>
            </main>
        );
    }

    /* ---------------------------------------------------------- шаг 2 */

    return (
        <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
            <header className="mb-6 flex items-center justify-between gap-4">
                <button
                    onClick={reset}
                    aria-label="Отменить"
                    className="grid size-10 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-red-300 hover:text-red-600"
                >
                    <X className="size-5" />
                </button>

                <h1 className="font-display text-xl font-bold text-ink">Детали книги</h1>

                <button
                    onClick={() => upload.mutate()}
                    disabled={!title.trim() || upload.isPending || parsing}
                    aria-label="Загрузить"
                    className="grid size-10 place-items-center rounded-full bg-brand-800 text-white transition-colors hover:bg-brand-900 disabled:bg-brand-800/40"
                >
                    {upload.isPending ? (
                        <Spinner className="size-4 border-white/40 border-t-white" />
                    ) : (
                        <Check className="size-5" />
                    )}
                </button>
            </header>

            <div className="rounded-card border border-line bg-surface p-5 sm:p-6">
                {parsing ? (
                    <div className="flex items-center gap-3 py-10 text-sm text-ink-soft">
                        <Spinner />
                        Читаем метаданные из файла…
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 sm:flex-row">
                        <div className="w-36 shrink-0 space-y-3 self-center sm:self-start">
                            <Cover
                                title={title || file.name}
                                author={author}
                                url={coverPreview}
                            />

                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-brand-500 hover:text-brand-800">
                                <ImageUp className="size-3.5" />
                                Change cover
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(event) =>
                                        setCover(event.target.files?.[0] ?? null)
                                    }
                                />
                            </label>
                        </div>

                        <div className="min-w-0 flex-1 space-y-4">
                            <p className="truncate rounded-2xl bg-surface-muted px-4 py-2.5 text-xs text-ink-soft">
                                {file.name} · {formatSize(file.size)}
                            </p>

                            <Field label="Name">
                                <Input
                                    value={title}
                                    maxLength={255}
                                    onChange={(event) => setTitle(event.target.value)}
                                />
                            </Field>

                            <Field label="Author">
                                <Input
                                    value={author}
                                    maxLength={255}
                                    placeholder="Не указан"
                                    onChange={(event) => setAuthor(event.target.value)}
                                />
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Language">
                                    <Input
                                        value={language}
                                        maxLength={35}
                                        placeholder="en"
                                        onChange={(event) => setLanguage(event.target.value)}
                                    />
                                </Field>

                                <Field label="Genre" hint="Через запятую">
                                    <Input
                                        value={genres}
                                        placeholder="Detectives, Thrillers"
                                        onChange={(event) => setGenres(event.target.value)}
                                    />
                                </Field>
                            </div>

                            <VisibilityToggle value={visibility} onChange={setVisibility} />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function VisibilityToggle({
    value,
    onChange
}: {
    value: Visibility;
    onChange: (next: Visibility) => void;
}) {
    return (
        <div className="space-y-1.5">
            <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                Доступ
            </span>

            <div className="flex rounded-full border border-line bg-surface-muted p-1">
                {(
                    [
                        ["PRIVATE", "Privat", Lock],
                        ["PUBLIC", "Public", Globe]
                    ] as const
                ).map(([key, label, Icon]) => (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-colors ${
                            value === key
                                ? "bg-brand-800 text-white shadow-sm"
                                : "text-ink-soft hover:text-ink"
                        }`}
                    >
                        <Icon className="size-4" />
                        {label}
                    </button>
                ))}
            </div>

            <span className="block text-xs text-ink-faint">
                {value === "PUBLIC"
                    ? "Книга попадёт в общий каталог — вернуть её в приватные будет нельзя."
                    : "Книгу увидите только вы."}
            </span>
        </div>
    );
}
