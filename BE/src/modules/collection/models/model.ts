import { t } from "elysia";

export const createCollectionBody = t.Object({
    name: t.String({ minLength: 1, maxLength: 100 }),
    description: t.Optional(t.String({ maxLength: 500 }))
});

export const editCollectionBody = t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
    description: t.Optional(t.Nullable(t.String({ maxLength: 500 })))
});

export const addBookToCollectionBody = t.Object({
    bookId: t.Integer({ minimum: 1 })
});

export const collectionParams = t.Object({
    id: t.Numeric({ minimum: 1 })
});

export const collectionBookParams = t.Object({
    id: t.Numeric({ minimum: 1 }),
    bookId: t.Numeric({ minimum: 1 })
});

/** Сколько обложек тянуть в превью карточки коллекции на экране Home. */
export const collectionsQuery = t.Object({
    previewCovers: t.Optional(t.Numeric({ minimum: 0, maximum: 10 }))
});
