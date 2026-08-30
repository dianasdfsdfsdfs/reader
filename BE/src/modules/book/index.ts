import { Elysia, t } from "elysia";
import { authentificateMiddleware } from "../auth/middlewares/authentificate";
import { bookService } from "./services/book";
import {
    addBookBody,
    bookParams,
    catalogBooksQuery,
    catalogSectionsQuery,
    editBookBody,
    favouriteBody,
    updateSettingsBody,
    uploadBookBody,
    userBooksQuery
} from "./models/model";
import { toBookDTO, toBooksDTO, toUserBookDTO, toUserBooksDTO } from "./dto/book";
import { collectionService } from "@/modules/collection/services/collection";

const tags = ["book"];

export const book = new Elysia({ prefix: "/book" })
    .use(authentificateMiddleware)

    .post(
        "/upload",
        async ({ user, body, status }) => {
            const uploaded = await bookService.upload({ userId: user.id, ...body });

            return status(201, toBookDTO(uploaded));
        },
        {
            body: uploadBookBody,
            detail: { summary: "Загрузить .epub", tags }
        }
    )

    .post(
        "/add",
        async ({ user, body, status }) => {
            await bookService.addBook(user.id, body.bookId);

            return status(201, {
                status: "success",
                message: "The book has been added to your library."
            });
        },
        {
            body: addBookBody,
            detail: { summary: "Добавить книгу из каталога к себе", tags }
        }
    )

    /** Экран Home — мои книги. */
    .get(
        "/private",
        async ({ user, query }) => {
            const { take, skip, sort, ...filter } = query;

            return toUserBooksDTO(
                await bookService.getUserBooks(user.id, filter, { take, skip, sort })
            );
        },
        {
            query: userBooksQuery,
            detail: { summary: "Мои книги", tags }
        }
    )

    /** Экран Library — публичные книги, которых у меня ещё нет. */
    .get(
        "/catalog",
        async ({ user, query }) => {
            const { take, skip, ...filter } = query;

            return toBooksDTO(await bookService.getCatalogBooks(user.id, filter, { take, skip }));
        },
        {
            query: catalogBooksQuery,
            detail: { summary: "Каталог публичных книг", tags }
        }
    )

    /** Экран Library целиком: «Most popular» + строка на каждый жанр. */
    .get(
        "/catalog/sections",
        async ({ user, query }) => {
            const sections = await bookService.getCatalogSections(user.id, query);

            return sections.map((section) => ({
                key: section.key,
                title: section.title,
                books: toBooksDTO(section.books)
            }));
        },
        {
            query: catalogSectionsQuery,
            detail: { summary: "Каталог, разбитый на секции", tags }
        }
    )

    .get(
        "/genres",
        async ({ user, query }) => bookService.getGenres(user.id, query.scope ?? "catalog"),
        {
            query: t.Object({
                scope: t.Optional(t.UnionEnum(["library", "catalog"]))
            }),
            detail: { summary: "Список жанров для фильтров", tags }
        }
    )

    .get(
        "/:id",
        async ({ user, params }) => {
            const result = await bookService.getBook(user.id, params.id);

            if (!result.inLibrary) {
                return { inLibrary: false, collectionIds: [], book: toBookDTO(result.book) };
            }

            // Меню «…» показывает галочки напротив коллекций, в которых книга уже лежит.
            return {
                inLibrary: true,
                collectionIds: await collectionService.getCollectionIdsForBook(user.id, params.id),
                book: toUserBookDTO(result.userBook)
            };
        },
        {
            params: bookParams,
            detail: { summary: "Карточка книги", tags }
        }
    )

    /** Ссылка на сам файл .epub — подписанная, живёт час. */
    .get(
        "/:id/read",
        async ({ user, params }) => bookService.getReadingUrl(user.id, params.id),
        {
            params: bookParams,
            detail: { summary: "Ссылка на файл книги и позиция чтения", tags }
        }
    )

    .patch(
        "/:id",
        async ({ user, params, body }) =>
            toUserBookDTO(await bookService.editBook(user.id, params.id, body)),
        {
            params: bookParams,
            body: editBookBody,
            detail: { summary: "Переименовать, сменить обложку, public/private", tags }
        }
    )

    /** Автосохранение из читалки: позиция, прогресс, тема, размер шрифта. */
    .patch(
        "/:id/settings",
        async ({ user, params, body }) =>
            toUserBookDTO(await bookService.updateBookSettings(user.id, params.id, body)),
        {
            params: bookParams,
            body: updateSettingsBody,
            detail: { summary: "Сохранить настройки и позицию чтения", tags }
        }
    )

    .patch(
        "/:id/favourite",
        async ({ user, params, body }) =>
            toUserBookDTO(await bookService.addToFavourite(user.id, params.id, body.favourite)),
        {
            params: bookParams,
            body: favouriteBody,
            detail: { summary: "В избранное / из избранного", tags }
        }
    )

    .delete(
        "/:id",
        async ({ user, params }) => bookService.deleteBook(user.id, params.id),
        {
            params: bookParams,
            detail: { summary: "Убрать книгу из библиотеки", tags }
        }
    );
