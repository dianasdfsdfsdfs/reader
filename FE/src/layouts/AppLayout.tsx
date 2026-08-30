import { NavLink, Outlet } from "react-router-dom";
import { BookOpen, Compass, House, Upload, User } from "lucide-react";

const items = [
    { to: "/", label: "Главная", icon: House, end: true },
    { to: "/library", label: "Каталог", icon: Compass, end: false },
    { to: "/upload", label: "Загрузить", icon: Upload, end: false },
    { to: "/profile", label: "Профиль", icon: User, end: false }
];

/**
 * На вайрфреймах навигация нарисована нижним таб-баром — так и оставляем
 * на телефоне; с lg он разворачивается в боковую панель.
 */
export function AppLayout() {
    return (
        <div className="min-h-dvh lg:flex">
            <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 border-r border-line bg-surface px-5 py-7 lg:flex">
                <span className="flex items-center gap-2.5 px-2 text-brand-800">
                    <BookOpen className="size-6" />
                    <span className="font-display text-xl font-bold">Reader</span>
                </span>

                <nav className="flex flex-col gap-1">
                    {items.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                                    isActive
                                        ? "bg-brand-800 text-white"
                                        : "text-ink-soft hover:bg-surface-muted hover:text-ink"
                                }`
                            }
                        >
                            <Icon className="size-5" />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="min-w-0 flex-1 pb-24 lg:pb-0">
                <Outlet />
            </div>

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
                <div className="mx-auto flex max-w-md">
                    {items.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                                    isActive ? "text-brand-800" : "text-ink-faint"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${
                                            isActive ? "bg-brand-100" : ""
                                        }`}
                                    >
                                        <Icon className="size-5" />
                                    </span>
                                    {label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}

export function PageHeader({
    title,
    description,
    action
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
            <div>
                <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
                {description && <p className="mt-1.5 text-sm text-ink-soft">{description}</p>}
            </div>
            {action}
        </header>
    );
}
