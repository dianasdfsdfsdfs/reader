import { request } from "./client";
import type {
    Book,
    BookDetail,
    CatalogSection,
    LibraryFilters,
    ReadingSession,
    ReadingTheme,
    UserBook,
    Visibility
} from "@/shared/types";

export interface UploadPayload {
    file: File;
    cover?: File | null;
    title: string;
    author?: string;
    language?: string;
    genres?: string[];
    visibility?: Visibility;
}

const toFormData = (payload: Record<string, unknown>) => {
    const form = new FormData();

    for (const [key, value] of Object.entries(payload)) {
        if (value === undefined || value === null || value === "") {
            continue;
        }

        if (Array.isArray(value)) {
            // Elysia собирает повторяющиеся поля обратно в массив.
            value.forEach((item) => form.append(key, String(item)));
        } else if (value instanceof File) {
            form.append(key, value);
        } else {
            form.append(key, String(value));
        }
    }

    return form;
};

export const booksApi = {
    myBooks: (filters: LibraryFilters = {}) =>
        request<UserBook[]>("/book/private", { query: { ...filters, take: 50 } }),

    catalog: (query: { title?: string; genre?: string } = {}) =>
        request<Book[]>("/book/catalog", { query: { ...query, take: 50 } }),

    catalogSections: () =>
        request<CatalogSection[]>("/book/catalog/sections", {
            query: { sections: 8, perSection: 12 }
        }),

    genres: (scope: "library" | "catalog") => request<string[]>("/book/genres", { query: { scope } }),

    detail: (id: number) => request<BookDetail>(`/book/${id}`),

    upload: (payload: UploadPayload) =>
        request<Book>("/book/upload", { method: "POST", body: toFormData({ ...payload }) }),

    addToLibrary: (bookId: number) =>
        request<unknown>("/book/add", { method: "POST", body: { bookId } }),

    edit: (id: number, changes: { title?: string; cover?: File | null; visibility?: Visibility }) =>
        request<UserBook>(`/book/${id}`, { method: "PATCH", body: toFormData({ ...changes }) }),

    setFavourite: (id: number, favourite: boolean) =>
        request<UserBook>(`/book/${id}/favourite`, { method: "PATCH", body: { favourite } }),

    saveProgress: (
        id: number,
        settings: {
            currentLocation?: string | null;
            progress?: number;
            theme?: ReadingTheme;
            fontSize?: number;
        }
    ) => request<UserBook>(`/book/${id}/settings`, { method: "PATCH", body: settings }),

    remove: (id: number) => request<{ deleted: boolean }>(`/book/${id}`, { method: "DELETE" }),

    readingSession: (id: number) => request<ReadingSession>(`/book/${id}/read`)
};
