export type Visibility = "PUBLIC" | "PRIVATE";
export type ReadingTheme = "LIGHT" | "DARK" | "SEPIA";

export interface User {
    id: number;
    email: string;
}

/** Книга как она видна в каталоге. */
export interface Book {
    id: number;
    title: string;
    author: string | null;
    language: string | null;
    coverUrl: string | null;
    genres: string[];
    isPublic: boolean;
    readersCount?: number;
}

/** Книга в библиотеке пользователя — с прогрессом и личными настройками. */
export interface UserBook extends Book {
    progress: number;
    currentLocation: string | null;
    favourite: boolean;
    visibility: Visibility;
    theme: ReadingTheme;
    fontSize: number;
    addedAt: string;
}

export interface Collection {
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    booksCount: number;
    books: UserBook[];
}

export interface CatalogSection {
    key: string;
    title: string;
    books: Book[];
}

export interface BookDetail {
    inLibrary: boolean;
    collectionIds: number[];
    book: UserBook | Book;
}

export interface ReadingSession {
    url: string;
    expiresIn: number;
    currentLocation: string | null;
    progress: number;
    theme: ReadingTheme;
    fontSize: number;
}

export type LibrarySort = "added" | "title";

export interface LibraryFilters {
    title?: string;
    author?: string;
    language?: string;
    genre?: string;
    favourite?: boolean;
    sort?: LibrarySort;
}
