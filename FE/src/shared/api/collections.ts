import { request } from "./client";
import type { Collection } from "@/shared/types";

export const collectionsApi = {
    list: () => request<Collection[]>("/collection", { query: { previewCovers: 6 } }),

    detail: (id: number) => request<Collection>(`/collection/${id}`),

    create: (data: { name: string; description?: string }) =>
        request<Collection>("/collection", { method: "POST", body: data }),

    edit: (id: number, data: { name?: string; description?: string | null }) =>
        request<Collection>(`/collection/${id}`, { method: "PATCH", body: data }),

    remove: (id: number) =>
        request<{ deleted: boolean }>(`/collection/${id}`, { method: "DELETE" }),

    addBook: (id: number, bookId: number) =>
        request<Collection>(`/collection/${id}/books`, { method: "POST", body: { bookId } }),

    removeBook: (id: number, bookId: number) =>
        request<Collection>(`/collection/${id}/books/${bookId}`, { method: "DELETE" })
};
