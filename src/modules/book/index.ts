import { Elysia } from "elysia";
import { authentificateMiddleware } from "../auth/middlewares/authentificate";
import { bookService } from "./services/book";
import { addBookBody, bookParams, catalogBooksQuery, editBookBody, uploadBookBody, userBooksQuery } from "./models/model";
import { toBookDTO, toBooksDTO, toUserBookDTO, toUserBooksDTO } from "./dto/book";

export const book = new Elysia({ prefix: "/book" })
.use(authentificateMiddleware)

.post("/upload", async({user, body}) => {
    try {
        const uploaded = await bookService.upload({
            userId: user.id,
            ...body
        })

        return toBookDTO(uploaded)
    } catch (e: any) {
        return {
            status: "error",
            message: e.message
        }
    }
}, {
    body: uploadBookBody
})

.post("/add", async({user, body}) => {
    try {
        await bookService.addBook(user.id, body.bookId)

        return {
            status: "successful",
            message: "The book has been added to your library."
        }
    } catch (e: any) {
        return {
            status: "error",
            message: e.message
        }
    }
}, {
    body: addBookBody
})

.get("/private", async({user, query}) => {
    try {
        const { take, skip, sort, ...filter } = query

        const books = await bookService.getUserBooks(
            user.id,
            filter,
            { take, skip, sort }
        )

        return toUserBooksDTO(books)
    } catch (e: any) {
        return {
            status: "error",
            message: e.message
        }
    }
}, {
    query: userBooksQuery
})

.get("/:id/read", async({user, params}) => {
    try {
        return await bookService.getReadingUrl(user.id, params.id)
    } catch (e: any) {
        return {
            status: "error",
            message: e.message
        }
    }
}, {
    params: bookParams 
})

.get("/catalog", async({user, query}) => {
    try {
        const { take, skip, ...filter } = query

        const books = await bookService.getCatalogBooks(
            user.id,
            filter,
            { take, skip }
        )

        return toBooksDTO(books)
    } catch (e: any) {
        return {
            status: "error",
            message: e.message
        }
    }
}, {
    query: catalogBooksQuery
})

.patch("/:id", async({user, params, body}) => {
    try {
        const book = await bookService.editBook(user.id, params.id, body)

        return toUserBookDTO(book)
    } catch (e: any) {
        return {
            status: "error",
            message: e.message
        }
    }
}, {
    params: bookParams,
    body: editBookBody
})

.patch("/:id/settings", async({user, params, body}) => {

})

.patch("/:id/favourite", async({user, params, body}) => {

})

.delete("/:id", async({user, params}) => {

})