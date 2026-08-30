import { Elysia } from "elysia";
import { authentificateMiddleware } from "../auth/middlewares/authentificate";
import { collectionService } from "./services/collection";
import { toCollectionDTO, toCollectionsDTO } from "./dto/collection";
import {
    addBookToCollectionBody,
    collectionBookParams,
    collectionParams,
    collectionsQuery,
    createCollectionBody,
    editCollectionBody
} from "./models/model";

const tags = ["collection"];

export const collection = new Elysia({ prefix: "/collection" })
    .use(authentificateMiddleware)

    /** Экран Home, таб Collections. */
    .get(
        "/",
        async ({ user, query }) =>
            toCollectionsDTO(await collectionService.getCollections(user.id, query.previewCovers)),
        {
            query: collectionsQuery,
            detail: { summary: "Мои коллекции", tags }
        }
    )

    .post(
        "/",
        async ({ user, body, status }) =>
            status(201, toCollectionDTO(await collectionService.createCollection(user.id, body))),
        {
            body: createCollectionBody,
            detail: { summary: "Создать коллекцию", tags }
        }
    )

    .get(
        "/:id",
        async ({ user, params }) =>
            toCollectionDTO(await collectionService.getCollection(user.id, params.id)),
        {
            params: collectionParams,
            detail: { summary: "Коллекция и её книги", tags }
        }
    )

    .patch(
        "/:id",
        async ({ user, params, body }) =>
            toCollectionDTO(await collectionService.editCollection(user.id, params.id, body)),
        {
            params: collectionParams,
            body: editCollectionBody,
            detail: { summary: "Переименовать коллекцию", tags }
        }
    )

    .delete(
        "/:id",
        async ({ user, params }) => collectionService.deleteCollection(user.id, params.id),
        {
            params: collectionParams,
            detail: { summary: "Удалить коллекцию", tags }
        }
    )

    .post(
        "/:id/books",
        async ({ user, params, body, status }) =>
            status(
                201,
                toCollectionDTO(
                    await collectionService.addBook(user.id, params.id, body.bookId)
                )
            ),
        {
            params: collectionParams,
            body: addBookToCollectionBody,
            detail: { summary: "Добавить книгу в коллекцию", tags }
        }
    )

    .delete(
        "/:id/books/:bookId",
        async ({ user, params }) =>
            toCollectionDTO(
                await collectionService.removeBook(user.id, params.id, params.bookId)
            ),
        {
            params: collectionBookParams,
            detail: { summary: "Убрать книгу из коллекции", tags }
        }
    );
