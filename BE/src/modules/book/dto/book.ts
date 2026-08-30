import { t, type Static } from "elysia";
import { Themes, Visibility } from "@/generated/prisma/enums";
import { storage } from "@/config/storage";

/* ---------- схемы ответа ---------- */

export const bookDTO = t.Object({
    id: t.Number(),
    title: t.String(),
    author: t.Nullable(t.String()),
    language: t.Nullable(t.String()),
    coverUrl: t.Nullable(t.String()),
    genres: t.Array(t.String()),
    isPublic: t.Boolean(),
    readersCount: t.Optional(t.Number())
});

export const userBookDTO = t.Object({
    id: t.Number(),
    title: t.String(),
    author: t.Nullable(t.String()),
    language: t.Nullable(t.String()),
    coverUrl: t.Nullable(t.String()),
    genres: t.Array(t.String()),
    isPublic: t.Boolean(),

    progress: t.Number(),
    currentLocation: t.Nullable(t.String()),
    favourite: t.Boolean(),
    visibility: t.Enum(Visibility),
    theme: t.Enum(Themes),
    fontSize: t.Number(),
    addedAt: t.Date()
});

export const booksDTO = t.Array(bookDTO);
export const userBooksDTO = t.Array(userBookDTO);

export type BookDTO = Static<typeof bookDTO>;
export type UserBookDTO = Static<typeof userBookDTO>;

/* ---------- то, что приходит из репозитория ---------- */

type BookRow = {
    id: number;
    title: string;
    author: string | null;
    language: string | null;
    coverKey: string | null;
    isPublic: boolean;
    genres: { genreRelation: { genre: string } }[];
    _count?: { users: number };
};

type UserBookRow = {
    progress: number;
    currentLocation: string | null;
    favourite: boolean;
    visibility: Visibility;
    theme: Themes;
    fontSize: number;
    addedAt: Date;
    customTitle: string | null;
    customCoverKey: string | null;
    bookRelation: BookRow;
};

/* ---------- мапперы ---------- */

const toCoverUrl = (coverKey: string | null) =>
    coverKey ? storage.publicUrl(coverKey) : null;

const toGenres = (genres: BookRow["genres"]) =>
    genres.map((genre) => genre.genreRelation.genre);

export const toBookDTO = (book: BookRow): BookDTO => ({
    id: book.id,
    title: book.title,
    author: book.author,
    language: book.language,
    coverUrl: toCoverUrl(book.coverKey),
    genres: toGenres(book.genres),
    isPublic: book.isPublic,
    readersCount: book._count?.users
});

export const toUserBookDTO = (row: UserBookRow): UserBookDTO => {
    const { readersCount, ...book } = toBookDTO(row.bookRelation);

    return {
        ...book,
        title: row.customTitle ?? book.title,
        coverUrl: row.customCoverKey
            ? toCoverUrl(row.customCoverKey)
            : book.coverUrl,

        progress: row.progress,
        currentLocation: row.currentLocation,
        favourite: row.favourite,
        visibility: row.visibility,
        theme: row.theme,
        fontSize: row.fontSize,
        addedAt: row.addedAt
    };
};

export const toBooksDTO = (books: BookRow[]) => books.map(toBookDTO);
export const toUserBooksDTO = (rows: UserBookRow[]) => rows.map(toUserBookDTO);
