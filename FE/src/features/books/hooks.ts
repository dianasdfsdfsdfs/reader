import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { booksApi } from "@/shared/api/books";
import { collectionsApi } from "@/shared/api/collections";
import type { LibraryFilters, Visibility } from "@/shared/types";

export const queryKeys = {
    myBooks: (filters: LibraryFilters) => ["books", "mine", filters] as const,
    book: (id: number) => ["books", "detail", id] as const,
    catalogSections: ["books", "catalog", "sections"] as const,
    catalogSearch: (title: string) => ["books", "catalog", "search", title] as const,
    genres: (scope: "library" | "catalog") => ["books", "genres", scope] as const,
    collections: ["collections"] as const,
    collection: (id: number) => ["collections", id] as const
};

export const useMyBooks = (filters: LibraryFilters) =>
    useQuery({
        queryKey: queryKeys.myBooks(filters),
        queryFn: () => booksApi.myBooks(filters)
    });

export const useBook = (id: number, enabled = true) =>
    useQuery({
        queryKey: queryKeys.book(id),
        queryFn: () => booksApi.detail(id),
        enabled
    });

export const useGenres = (scope: "library" | "catalog") =>
    useQuery({
        queryKey: queryKeys.genres(scope),
        queryFn: () => booksApi.genres(scope)
    });

export const useCatalogSections = () =>
    useQuery({
        queryKey: queryKeys.catalogSections,
        queryFn: booksApi.catalogSections
    });

export const useCatalogSearch = (title: string) =>
    useQuery({
        queryKey: queryKeys.catalogSearch(title),
        queryFn: () => booksApi.catalog({ title }),
        enabled: title.trim().length > 0
    });

export const useCollections = () =>
    useQuery({
        queryKey: queryKeys.collections,
        queryFn: collectionsApi.list
    });

export const useCollection = (id: number) =>
    useQuery({
        queryKey: queryKeys.collection(id),
        queryFn: () => collectionsApi.detail(id)
    });

/**
 * Почти любое изменение книги видно сразу на нескольких экранах — на главной,
 * в карточке, внутри коллекций, — поэтому после мутаций сбрасываем всё разом.
 */
const useBookInvalidator = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: ["books"] });
        queryClient.invalidateQueries({ queryKey: ["collections"] });
    };
};

export const useToggleFavourite = () => {
    const invalidate = useBookInvalidator();

    return useMutation({
        mutationFn: ({ id, favourite }: { id: number; favourite: boolean }) =>
            booksApi.setFavourite(id, favourite),
        onSuccess: invalidate
    });
};

export const useEditBook = () => {
    const invalidate = useBookInvalidator();

    return useMutation({
        mutationFn: ({
            id,
            ...changes
        }: {
            id: number;
            title?: string;
            cover?: File | null;
            visibility?: Visibility;
        }) => booksApi.edit(id, changes),
        onSuccess: invalidate
    });
};

export const useDeleteBook = () => {
    const invalidate = useBookInvalidator();

    return useMutation({
        mutationFn: (id: number) => booksApi.remove(id),
        onSuccess: invalidate
    });
};

export const useAddToLibrary = () => {
    const invalidate = useBookInvalidator();

    return useMutation({
        mutationFn: (bookId: number) => booksApi.addToLibrary(bookId),
        onSuccess: invalidate
    });
};

export const useCreateCollection = () => {
    const invalidate = useBookInvalidator();

    return useMutation({
        mutationFn: (data: { name: string; description?: string }) => collectionsApi.create(data),
        onSuccess: invalidate
    });
};

export const useDeleteCollection = () => {
    const invalidate = useBookInvalidator();

    return useMutation({
        mutationFn: (id: number) => collectionsApi.remove(id),
        onSuccess: invalidate
    });
};

export const useRenameCollection = () => {
    const invalidate = useBookInvalidator();

    return useMutation({
        mutationFn: ({ id, ...data }: { id: number; name?: string; description?: string | null }) =>
            collectionsApi.edit(id, data),
        onSuccess: invalidate
    });
};

export const useToggleBookInCollection = () => {
    const invalidate = useBookInvalidator();

    return useMutation({
        mutationFn: ({
            collectionId,
            bookId,
            member
        }: {
            collectionId: number;
            bookId: number;
            member: boolean;
        }) =>
            member
                ? collectionsApi.removeBook(collectionId, bookId)
                : collectionsApi.addBook(collectionId, bookId),
        onSuccess: invalidate
    });
};
