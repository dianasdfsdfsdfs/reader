import { useEffect, useState } from "react";
import { LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyBooks, useCollections } from "@/features/books/hooks";
import { Button } from "@/shared/ui/Button";
import { pluralizeBooks } from "@/shared/lib/format";

const THEME_KEY = "reader.theme";

export function ProfilePage() {
    const { user, logout } = useAuth();
    const books = useMyBooks({});
    const collections = useCollections();
    const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === "dark");

    useEffect(() => {
        document.documentElement.dataset.theme = dark ? "dark" : "light";
        localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    }, [dark]);

    const finished = books.data?.filter((book) => book.progress >= 100).length ?? 0;

    return (
        <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-10">
            <h1 className="mb-7 font-display text-3xl font-bold text-ink">Профиль</h1>

            <div className="rounded-card border border-line bg-surface p-6">
                <div className="flex items-center gap-4">
                    <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-800 font-display text-xl font-bold text-white">
                        {user?.email[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{user?.email}</p>
                        <p className="text-sm text-ink-soft">
                            {pluralizeBooks(books.data?.length ?? 0)} ·{" "}
                            {collections.data?.length ?? 0} колл. · прочитано {finished}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-card border border-line bg-surface p-2">
                <button
                    onClick={() => setDark(!dark)}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
                >
                    {dark ? (
                        <Moon className="size-5 text-brand-700" />
                    ) : (
                        <Sun className="size-5 text-brand-700" />
                    )}
                    <span className="flex-1">Тёмная тема интерфейса</span>
                    <span
                        aria-hidden
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                            dark ? "bg-brand-700" : "bg-line"
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 size-5 rounded-full bg-white transition-[left] ${
                                dark ? "left-[1.375rem]" : "left-0.5"
                            }`}
                        />
                    </span>
                </button>
            </div>

            <Button
                variant="secondary"
                className="mt-4"
                fullWidth
                onClick={() => void logout()}
                icon={<LogOut className="size-4" />}
            >
                Выйти
            </Button>
        </main>
    );
}
