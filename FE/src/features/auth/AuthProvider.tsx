import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/shared/api/auth";
import { setUnauthorizedHandler, tokenStore } from "@/shared/api/client";
import type { User } from "@/shared/types";

interface AuthValue {
    user: User | null;
    ready: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);
    const queryClient = useQueryClient();

    // Токен живёт 7 дней, поэтому при старте проверяем его через /auth/me,
    // а не доверяем самому факту наличия строки в localStorage.
    useEffect(() => {
        if (!tokenStore.get()) {
            setReady(true);
            return;
        }

        authApi
            .me()
            .then(setUser)
            .catch(() => tokenStore.clear())
            .finally(() => setReady(true));
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            setUser(null);
            queryClient.clear();
        });
    }, [queryClient]);

    const authenticate = useCallback(
        async (action: Promise<{ user: User; token: string }>) => {
            const response = await action;

            tokenStore.set(response.token);
            setUser(response.user);
            queryClient.clear();
        },
        [queryClient]
    );

    const value = useMemo<AuthValue>(
        () => ({
            user,
            ready,
            login: (email, password) => authenticate(authApi.login(email, password)),
            register: (email, password) => authenticate(authApi.register(email, password)),
            logout: async () => {
                await authApi.logout().catch(() => undefined);
                tokenStore.clear();
                setUser(null);
                queryClient.clear();
            }
        }),
        [user, ready, authenticate, queryClient]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}
