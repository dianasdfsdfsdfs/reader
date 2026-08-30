import { collectionRepository } from "../repositories/collection";
import { bookRepository } from "@/modules/book/repositories/book";
import { conflict, notFound } from "@/shared/errors";

class CollectionService {
    async getCollections(userId: number, previewCovers = 4) {
        return await collectionRepository.findUserCollections(userId, previewCovers);
    }

    async getCollection(userId: number, collectionId: number) {
        const collection = await collectionRepository.findCollectionById(userId, collectionId);

        if (!collection) {
            throw notFound("Collection not found.");
        }

        return collection;
    }

    async createCollection(userId: number, data: { name: string; description?: string }) {
        const name = data.name.trim();
        const duplicate = await collectionRepository.findByName(userId, name);

        if (duplicate) {
            throw conflict("You already have a collection with this name.");
        }

        return await collectionRepository.createCollection({
            userId,
            name,
            description: data.description?.trim() || null
        });
    }

    async editCollection(
        userId: number,
        collectionId: number,
        data: { name?: string; description?: string | null }
    ) {
        await this.getCollection(userId, collectionId);

        const name = data.name?.trim();

        if (name) {
            const duplicate = await collectionRepository.findByName(userId, name);

            if (duplicate && duplicate.id !== collectionId) {
                throw conflict("You already have a collection with this name.");
            }
        }

        return await collectionRepository.updateCollection(collectionId, {
            name,
            description:
                data.description === undefined ? undefined : data.description?.trim() || null
        });
    }

    async deleteCollection(userId: number, collectionId: number) {
        await this.getCollection(userId, collectionId);

        await collectionRepository.deleteCollection(collectionId);

        return { deleted: true };
    }

    async addBook(userId: number, collectionId: number, bookId: number) {
        await this.getCollection(userId, collectionId);

        // Связь идёт на UsersBooks, поэтому книга обязана быть в библиотеке пользователя.
        const userBook = await bookRepository.findUserBookById(userId, bookId);

        if (!userBook) {
            throw notFound("This book is not in your library.");
        }

        const alreadyThere = await collectionRepository.findCollectionBook(
            collectionId,
            userId,
            bookId
        );

        if (alreadyThere) {
            throw conflict("This book is already in the collection.");
        }

        await collectionRepository.addBook(collectionId, userId, bookId);

        return await this.getCollection(userId, collectionId);
    }

    async removeBook(userId: number, collectionId: number, bookId: number) {
        await this.getCollection(userId, collectionId);

        const link = await collectionRepository.findCollectionBook(collectionId, userId, bookId);

        if (!link) {
            throw notFound("This book is not in the collection.");
        }

        await collectionRepository.removeBook(collectionId, userId, bookId);

        return await this.getCollection(userId, collectionId);
    }

    async getCollectionIdsForBook(userId: number, bookId: number) {
        return await collectionRepository.findCollectionIdsForBook(userId, bookId);
    }
}

export const collectionService = new CollectionService();
