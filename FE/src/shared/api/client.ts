const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TOKEN_KEY = "reader.token";

export class ApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export const tokenStore = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY)
};

/** Куда сходить после 401 — вешается в AuthProvider, чтобы не тащить сюда роутер. */
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
    onUnauthorized = handler;
};

interface RequestOptions {
    method?: string;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    signal?: AbortSignal;
}

const buildUrl = (path: string, query?: RequestOptions["query"]) => {
    const url = new URL(BASE_URL + path);

    for (const [key, value] of Object.entries(query ?? {})) {
        if (value !== undefined && value !== "") {
            url.searchParams.set(key, String(value));
        }
    }

    return url.toString();
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, query, signal } = options;
    const token = tokenStore.get();
    const isFormData = body instanceof FormData;

    const response = await fetch(buildUrl(path, query), {
        method,
        signal,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(body && !isFormData ? { "Content-Type": "application/json" } : {})
        },
        body: isFormData ? body : body ? JSON.stringify(body) : undefined
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        if (response.status === 401) {
            tokenStore.clear();
            onUnauthorized?.();
        }

        throw new ApiError(payload?.message ?? "Что-то пошло не так", response.status);
    }

    return payload as T;
}
