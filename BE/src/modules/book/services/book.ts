import { bookRepository } from "../repositories/book";
import { storage } from "@/config/storage";
import { Visibility } from "@/generated/prisma/enums";
import { Themes } from "@/generated/prisma/enums";
import { badRequest, conflict, forbidden, notFound } from "@/shared/errors";

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
            const fileKey = await this.uploadToStorage("books", data.userId, data.file);
            uploadedKeys.push(fileKey);

            let coverKey: string | null = null;

            if (data.cover) {
                coverKey = await this.uploadToStorage("covers", data.userId, data.cover);
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

    /**
     * Обложки лежат под `covers/` и отдаются постоянной ссылкой, сами книги —
     * под `books/` и только по временной подписанной ссылке.
     */
    private async uploadToStorage(kind: "books" | "covers", userId: number, file: File) {
        const extension = EXTENSIONS[file.type] ?? "bin";
        const key = `${kind}/${userId}/${crypto.randomUUID()}.${extension}`;

        try {
            await storage.upload(key, file);
        } catch (error: any) {
            throw badRequest(`Failed to upload file: ${error.message}`);
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
            throw notFound("This book does not exist or is not public.");
        }

        const alreadyInLibrary = await bookRepository.findUserBookById(userId, bookId);

        if (alreadyInLibrary) {
            throw conflict("This book is already in your library.");
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
            title?: string;
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
                title: filter.title?.trim() || undefined,
                genre: filter.genre?.trim() || undefined
            },
            { take, skip }
        );
    }

    /**
     * Экран Library: «Most popular» плюс строка на каждый жанр.
     * Собрано одним методом, чтобы фронт не дёргал /catalog по разу на жанр.
     */
    async getCatalogSections(
        userId: number,
        options: { sections?: number; perSection?: number } = {}
    ) {
        const sections = Math.min(Math.max(options.sections ?? 6, 1), 12);
        const perSection = Math.min(Math.max(options.perSection ?? 10, 1), 20);

        const genres = await bookRepository.findGenresWithPublicBooks(sections);

        const [popular, ...byGenre] = await Promise.all([
            bookRepository.findMostPopularBooks(userId, perSection),
            ...genres.map((genre) =>
                bookRepository.findCatalogBooks(
                    userId,
                    { genre: genre.genre },
                    { take: perSection, skip: 0 }
                )
            )
        ]);

        return [
            { key: "popular", title: "Most popular", books: popular! },
            ...genres.map((genre, index) => ({
                key: `genre:${genre.genre}`,
                title: genre.genre,
                books: byGenre[index] ?? []
            }))
        ].filter((section) => section.books.length > 0);
    }

    async getGenres(userId: number, scope: "library" | "catalog") {
        const genres =
            scope === "library"
                ? await bookRepository.findGenresInUserLibrary(userId)
                : await bookRepository.findGenresWithPublicBooks();

        return genres.map((genre) => genre.genre);
    }

    /** Карточка одной книги: сначала ищем в библиотеке пользователя, потом в публичном каталоге. */
    async getBook(userId: number, bookId: number) {
        const userBook = await bookRepository.findUserBookById(userId, bookId);

        if (userBook) {
            return { inLibrary: true as const, userBook };
        }

        const publicBook = await bookRepository.findPublicBookByIdRaw(bookId);

        if (!publicBook) {
            throw notFound("This book does not exist or is not public.");
        }

        return { inLibrary: false as const, book: publicBook };
    }

    async deleteBook(userId: number, bookId: number) {
        const userBook = await bookRepository.findUserBookById(userId, bookId);

        if (!userBook) {
            throw notFound("You don't have this book.");
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
            throw notFound("You don't have this book.");
        }

        if (data.visibility === Visibility.PRIVATE && userBook.bookRelation.isPublic) {
            throw forbidden("This book is published and cannot be made private.");
        }

        const oldCoverKey = userBook.customCoverKey;
        let customCoverKey: string | undefined;

        if (data.cover) {
            customCoverKey = await this.uploadToStorage("covers", userId, data.cover);
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
            throw notFound("You don't have this book.");
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
            throw notFound("You don't have this book.");
        }

        return await bookRepository.updateBookSettings(userId, bookId, settings);
    }

    async getReadingUrl(userId: number, bookId: number) {
        const userBook = await bookRepository.findUserBookById(userId, bookId);

        if (!userBook) {
            throw notFound("You don't have this book.");
        }

        let url: string;

        try {
            url = await storage.signedUrl(userBook.bookRelation.fileKey, READING_URL_TTL);
        } catch {
            throw badRequest("Failed to create a reading link.");
        }

        return {
            url,
            expiresIn: READING_URL_TTL,
            currentLocation: userBook.currentLocation,
            progress: userBook.progress,
            theme: userBook.theme,
            fontSize: userBook.fontSize
        };
    }

}

export const bookService = new BookService();
