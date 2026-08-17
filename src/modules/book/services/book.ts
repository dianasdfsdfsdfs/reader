import { bookRepository } from "../repositories/book";
import { storage } from "@/config/supabase";
import { Visibility } from "@/generated/prisma/enums";
import { Themes } from "@/generated/prisma/enums";

const READING_URL_TTL = 60 * 60;

const EXTENSIONS: Record<string, string> = {
    "application/epub+zip": "epub",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
};

class BookService {
    async upload(data: {
        userId: number;
        title: string;
        file: File;
        cover?: File | null;
        author?: string | null;
        language?: string | null;
        genres?: string[];
        visibility?: Visibility;
    }) {
        const uploadedKeys: string[] = [];

        try {
            const fileKey = await this.uploadToStorage(data.userId, data.file);
            uploadedKeys.push(fileKey);

            let coverKey: string | null = null;

            if (data.cover) {
                coverKey = await this.uploadToStorage(data.userId, data.cover);
                uploadedKeys.push(coverKey);
            }

            return await bookRepository.uploadBook({
                userId: data.userId,
                title: data.title.trim(),
                author: data.author?.trim() || null,
                language: data.language?.trim().toLowerCase() || null,
                genres: data.genres
                    ?.map((genre) => genre.trim())
                    .filter((genre) => genre.length > 0),
                visibility: data.visibility,
                fileKey,
                coverKey
            });
        } catch (error) {
            await this.removeFromStorage(uploadedKeys);
            throw error;
        }
    }

    private async uploadToStorage(userId: number, file: File) {
        const extension = EXTENSIONS[file.type] ?? "bin";
        const key = `books/${userId}/${crypto.randomUUID()}.${extension}`;

        const { error } = await storage.upload(key, file, {
            contentType: file.type,
            upsert: false
        });

        if (error) {
            throw new Error(`Failed to upload file: ${error.message}`);
        }

        return key;
    }

    private async removeFromStorage(keys: string[]) {
        if (keys.length === 0) {
            return;
        }

        await storage.remove(keys);
    }


    async addBook(userId: number, bookId: number) {
        const book = await bookRepository.findPublicBookById(bookId);

        if (!book) {
            throw new Error("This book does not exist or is not public.");
        }

        const alreadyInLibrary = await bookRepository.findUserBookById(userId, bookId);

        if (alreadyInLibrary) {
            throw new Error("This book is already in your library.");
        }

        return await bookRepository.addBookToLibrary(userId, bookId);
    }

    async getUserBooks(
        userId: number,
        filter: {
            title?: string;
            author?: string;
            language?: string;
            genre?: string;
            favourite?: boolean;
        } = {},
        options: {
            take?: number;
            skip?: number;
            sort?: "added" | "title";
        } = {}
    ) {
        const take = Math.min(Math.max(options.take ?? 20, 1), 50);
        const skip = Math.max(options.skip ?? 0, 0);

        return await bookRepository.findUserBooks(
            userId,
            {
                title: filter.title?.trim() || undefined,
                author: filter.author?.trim() || undefined,
                language: filter.language?.trim().toLowerCase() || undefined,
                genre: filter.genre?.trim() || undefined,
                favourite: filter.favourite
            },
            { take, skip, sort: options.sort }
        );
    }

    async getCatalogBooks(
        userId: number,
        filter: {
            genre?: string;
        } = {},
        options: {
            take?: number;
            skip?: number;
        } = {}
    ) {
        const take = Math.min(Math.max(options.take ?? 20, 1), 50);
        const skip = Math.max(options.skip ?? 0, 0);

        return await bookRepository.findCatalogBooks(
            userId,
            {
                genre: filter.genre?.trim() || undefined
            },
            { take, skip }
        );
    }

    async deleteBook(userId: number, bookId: number) {
        const userBook = await bookRepository.findUserBookById(userId, bookId);

        if (!userBook) {
            throw new Error("You don't have this book");
        }

        await bookRepository.deletePrivateBook(userId, bookId);

        if (userBook.customCoverKey) {
            await this.removeFromStorage([userBook.customCoverKey]);
        }

        const ownersLeft = await bookRepository.countBookOwners(bookId)
        const book = userBook.bookRelation

        if (ownersLeft === 0 && !book.isPublic) {
            await bookRepository.deletePublicBookById(bookId)
            await this.removeFromStorage(
                [book.fileKey, book.coverKey].filter((key): key is string => !!key)
            )
        }

        return { deleted: true}
    }

    async editBook(userId: number, bookId: number, data: {
        title?: string;
        cover?: File | null;
        visibility?: Visibility;
    }) {
        const userBook = await bookRepository.findUserBookById(userId, bookId);

        if (!userBook) {
            throw new Error("You don't have this book.");
        }

        if (data.visibility === Visibility.PRIVATE && userBook.bookRelation.isPublic) {
            throw new Error("This book is published and cannot be made private.");
        }

        const oldCoverKey = userBook.customCoverKey;
        let customCoverKey: string | undefined;

        if (data.cover) {
            customCoverKey = await this.uploadToStorage(userId, data.cover);
        }

        try {
            const updated = await bookRepository.editBook(userId, bookId, {
                customTitle: data.title?.trim(),
                customCoverKey,
                visibility: data.visibility,
                isPublic: data.visibility === Visibility.PUBLIC ? true : undefined
            });

            if (customCoverKey && oldCoverKey) {
                await this.removeFromStorage([oldCoverKey]);
            }

            return updated;
        } catch (error) {
            if (customCoverKey) {
                await this.removeFromStorage([customCoverKey]);
            }

            throw error;
        }
    }

    async addToFavourite(userId: number, bookId: number, favourite: boolean) {
        const book = await bookRepository.findUserBookById(userId, bookId);

        if (!book) {
            throw new Error("You don't have this book.");
        }

        return await bookRepository.addToFavourite(userId, bookId, favourite);
    }

    async updateBookSettings(userId: number, bookId: number, settings: {
        currentLocation?: string | null;
        progress?: number;
        theme?: Themes;
        fontSize?: number;
    }) {
        const book = await bookRepository.findUserBookById(userId, bookId);

        if (!book) {
            throw new Error("You don't have this book.");
        }

        return await bookRepository.updateBookSettings(userId, bookId, settings);
    }

    async getReadingUrl(userId: number, bookId: number) {
        const userBook = await bookRepository.findUserBookById(userId, bookId);

        if (!userBook) {
            throw new Error("You don't have this book.");
        }

        const { data, error } = await storage.createSignedUrl(
            userBook.bookRelation.fileKey,
            READING_URL_TTL
        );

        if (error || !data) {
            throw new Error("Failed to create a reading link.");
        }

        return {
            url: data.signedUrl,
            expiresIn: READING_URL_TTL,
            currentLocation: userBook.currentLocation,
            progress: userBook.progress,
            theme: userBook.theme,
            fontSize: userBook.fontSize
        };
    }

}

export const bookService = new BookService();
