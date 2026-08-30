import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Button } from "@/shared/ui/Button";
import { Field, Input } from "@/shared/ui/Field";
import { Spinner } from "@/shared/ui/Spinner";
import { ApiError } from "@/shared/api/client";

type Mode = "login" | "register";

export function AuthPage() {
    const { user, ready, login, register } = useAuth();
    const location = useLocation();
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    if (ready && user) {
        return <Navigate to={location.state?.from ?? "/"} replace />;
    }

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setPending(true);

        try {
            await (mode === "login" ? login(email, password) : register(email, password));
        } catch (caught) {
            setError(
                caught instanceof ApiError ? caught.message : "Не удалось связаться с сервером"
            );
        } finally {
            setPending(false);
        }
    };

    return (
        <main className="grid min-h-dvh lg:grid-cols-2">
            {/* Обложечная половина — она же напоминание, что это читалка, а не почта. */}
            <section className="relative hidden overflow-hidden bg-brand-900 p-12 lg:flex lg:flex-col lg:justify-between">
                <div
                    aria-hidden
                    className="absolute -top-24 -right-24 size-96 rounded-full bg-brand-600/40 blur-3xl"
                />
                <div
                    aria-hidden
                    className="absolute -bottom-32 -left-16 size-96 rounded-full bg-brand-300/25 blur-3xl"
                />

                <span className="relative flex items-center gap-2.5 text-white">
                    <BookOpen className="size-6" />
                    <span className="font-display text-xl font-bold">Reader</span>
                </span>

                <div className="relative max-w-md">
                    <h1 className="font-display text-4xl leading-tight font-bold text-white">
                        Твоя библиотека — в одном месте
                    </h1>
                    <p className="mt-4 text-brand-100/90">
                        Загружай .epub, раскладывай по коллекциям, читай с любого устройства.
                        Прогресс сохраняется сам.
                    </p>
                </div>

                <div aria-hidden className="relative flex gap-1.5">
                    {[
                        "bg-brand-800",
                        "bg-brand-700",
                        "bg-brand-600",
                        "bg-brand-500",
                        "bg-brand-400",
                        "bg-brand-300",
                        "bg-brand-200",
                        "bg-brand-100",
                        "bg-brand-50"
                    ].map((tone) => (
                        <span key={tone} className={`h-1.5 w-8 rounded-full ${tone}`} />
                    ))}
                </div>
            </section>

            <section className="flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    <span className="mb-8 flex items-center gap-2.5 text-brand-800 lg:hidden">
                        <BookOpen className="size-6" />
                        <span className="font-display text-xl font-bold">Reader</span>
                    </span>

                    <h2 className="font-display text-3xl font-bold text-ink">
                        {mode === "login" ? "С возвращением" : "Заводим аккаунт"}
                    </h2>
                    <p className="mt-2 text-sm text-ink-soft">
                        {mode === "login"
                            ? "Войдите, чтобы продолжить чтение."
                            : "Пара секунд — и можно загружать книги."}
                    </p>

                    <form onSubmit={submit} className="mt-8 space-y-4">
                        <Field label="Почта">
                            <Input
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                        </Field>

                        <Field
                            label="Пароль"
                            hint={mode === "register" ? "Минимум 8 символов" : undefined}
                        >
                            <Input
                                type="password"
                                required
                                minLength={8}
                                autoComplete={
                                    mode === "login" ? "current-password" : "new-password"
                                }
                                placeholder="••••••••"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                        </Field>

                        {error && (
                            <p
                                role="alert"
                                className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
                            >
                                {error}
                            </p>
                        )}

                        <Button type="submit" size="lg" fullWidth disabled={pending}>
                            {pending && <Spinner className="size-4 border-white/40 border-t-white" />}
                            {mode === "login" ? "Войти" : "Зарегистрироваться"}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-ink-soft">
                        {mode === "login" ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}{" "}
                        <button
                            type="button"
                            onClick={() => {
                                setMode(mode === "login" ? "register" : "login");
                                setError(null);
                            }}
                            className="font-semibold text-brand-800 underline-offset-4 hover:underline"
                        >
                            {mode === "login" ? "Создать" : "Войти"}
                        </button>
                    </p>
                </div>
            </section>
        </main>
    );
}
