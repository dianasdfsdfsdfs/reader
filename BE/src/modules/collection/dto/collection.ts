import { toUserBookDTO, type UserBookDTO } from "@/modules/book/dto/book";

type CollectionRow = {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
    _count: { books: number };
    books: { userBookRelation: Parameters<typeof toUserBookDTO>[0] }[];
};

export type CollectionDTO = {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
    booksCount: number;
    books: UserBookDTO[];
};

export const toCollectionDTO = (collection: CollectionRow): CollectionDTO => ({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    createdAt: collection.createdAt,
    booksCount: collection._count.books,
    books: collection.books.map((row) => toUserBookDTO(row.userBookRelation))
});

export const toCollectionsDTO = (collections: CollectionRow[]) =>
    collections.map(toCollectionDTO);
