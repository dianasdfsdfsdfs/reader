import database from "@/db";

const bookWithGenres = {
    genres: {
        include: {
            genreRelation: true
        }
    }
} as const;

const userBookWithBook = {
    bookRelation: {
        include: bookWithGenres
    }
} as const;

class CollectionRepository {
    /**
     * Экран Home, таб Collections: список коллекций, у каждой — счётчик книг и
     * несколько первых книг для превью обложек.
     */
    async findUserCollections(userId: number, previewCovers: number) {
        return await database.collection.findMany({
            where: { userId },
            include: {
                _count: { select: { books: true } },
                books: {
                    orderBy: { addedAt: "desc" },
                    take: previewCovers,
                    include: {
                        userBookRelation: { include: userBookWithBook }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    async findCollectionById(userId: number, collectionId: number) {
        return await database.collection.findFirst({
            where: { id: collectionId, userId },
            include: {
                _count: { select: { books: true } },
                books: {
                    orderBy: { addedAt: "desc" },
                    include: {
                        userBookRelation: { include: userBookWithBook }
                    }
                }
            }
        });
    }

    async findByName(userId: number, name: string) {
        return await database.collection.findFirst({
            where: { userId, name }
        });
    }

    async createCollection(data: { userId: number; name: string; description?: string | null }) {
        return await database.collection.create({
            data: {
                userId: data.userId,
                name: data.name,
                description: data.description ?? null
            },
            include: {
                _count: { select: { books: true } },
                books: {
                    include: {
                        userBookRelation: { include: userBookWithBook }
                    }
                }
            }
        });
    }

    async updateCollection(
        collectionId: number,
        data: { name?: string; description?: string | null }
    ) {
        return await database.collection.update({
            where: { id: collectionId },
            data,
            include: {
                _count: { select: { books: true } },
                books: {
                    orderBy: { addedAt: "desc" },
                    include: {
                        userBookRelation: { include: userBookWithBook }
                    }
                }
            }
        });
    }

    async deleteCollection(collectionId: number) {
        return await database.collection.delete({ where: { id: collectionId } });
    }

    async addBook(collectionId: number, userId: number, bookId: number) {
        return await database.collectionsBooks.create({
            data: { collectionId, userId, bookId }
        });
    }

    async findCollectionBook(collectionId: number, userId: number, bookId: number) {
        return await database.collectionsBooks.findUnique({
            where: {
                collectionId_userId_bookId: { collectionId, userId, bookId }
            }
        });
    }

    async removeBook(collectionId: number, userId: number, bookId: number) {
        return await database.collectionsBooks.delete({
            where: {
                collectionId_userId_bookId: { collectionId, userId, bookId }
            }
        });
    }

    /** Для меню «Add to collection»: в каких коллекциях книга уже лежит. */
    async findCollectionIdsForBook(userId: number, bookId: number) {
        const rows = await database.collectionsBooks.findMany({
            where: { userId, bookId },
            select: { collectionId: true }
        });

        return rows.map((row) => row.collectionId);
    }
}

export const collectionRepository = new CollectionRepository();
