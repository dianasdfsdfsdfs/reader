import { t } from "elysia";
import { Themes, Visibility } from "@/generated/prisma/enums";

export const BOOK_MIME_TYPES = ["application/epub+zip"];
export const COVER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const uploadBookBody = t.Object({
    title: t.String({ minLength: 1, maxLength: 255 }),
    author: t.Optional(t.String({ maxLength: 255 })),
    language: t.Optional(t.String({ maxLength: 35 })),
    genres: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 10 })),
    visibility: t.Optional(t.Enum(Visibility)),

    cover: t.Optional(
        t.File({
            maxSize: "5m",
            type: COVER_MIME_TYPES
        })
    ),
    file: t.File({
        maxSize: "50m",
        type: BOOK_MIME_TYPES
    })
});

export const editBookBody = t.Object({
    title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
    visibility: t.Optional(t.Enum(Visibility)),

    cover: t.Optional(
        t.File({
            maxSize: "5m",
            type: COVER_MIME_TYPES
        })
    )
});

export const updateSettingsBody = t.Object({
    currentLocation: t.Optional(t.Nullable(t.String({ maxLength: 255 }))),
    progress: t.Optional(t.Integer({ minimum: 0, maximum: 100 })),
    theme: t.Optional(t.Enum(Themes)),
    fontSize: t.Optional(t.Integer({ minimum: 10, maximum: 32 }))
});

export const favouriteBody = t.Object({
    favourite: t.Boolean()
});

export const addBookBody = t.Object({
    bookId: t.Integer({ minimum: 1 })
});

/* ---------- то, что приходит в URL ---------- */

export const bookParams = t.Object({
    id: t.Numeric({ minimum: 1 })
});

export const userBooksQuery = t.Object({
    title: t.Optional(t.String({ maxLength: 255 })),
    author: t.Optional(t.String({ maxLength: 255 })),
    language: t.Optional(t.String({ maxLength: 35 })),
    genre: t.Optional(t.String({ maxLength: 50 })),
    favourite: t.Optional(t.BooleanString()),

    take: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
    skip: t.Optional(t.Numeric({ minimum: 0 })),
    sort: t.Optional(t.UnionEnum(["added", "title"]))
});

export const catalogBooksQuery = t.Object({
    genre: t.Optional(t.String({ maxLength: 50 })),

    take: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
    skip: t.Optional(t.Numeric({ minimum: 0 }))
});
