import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { auth } from "./modules/auth";
import { book } from "./modules/book";
import { collection } from "./modules/collection";
import { files } from "./modules/files";
import { AppError } from "./shared/errors";

const port = Number(process.env.PORT ?? 3000);

const app = new Elysia()
    .use(
        cors({
            origin: process.env.CORS_ORIGIN?.split(",") ?? true,
            credentials: true
        })
    )
    .use(
        swagger({
            path: "/swagger",
            documentation: {
                info: { title: "Reader API", version: "1.0.0" }
            }
        })
    )
    /**
     * Единая обработка ошибок. Сервисы бросают AppError с нужным статусом,
     * всё остальное — 500. Раньше каждый роут возвращал `{ status: "error" }`
     * с кодом 200, из-за чего фронт не мог отличить успех от ошибки.
     */
    .onError(({ code, error, status }) => {
        if (error instanceof AppError) {
            return status(error.status, { status: "error", message: error.message });
        }

        if (code === "VALIDATION") {
            // error.message — это большой JSON-дамп схемы; фронту нужна одна строка.
            const first = error.all?.[0];
            const message =
                first && "summary" in first && first.summary
                    ? first.summary
                    : "Request validation failed";

            return status(422, { status: "error", message });
        }

        if (code === "NOT_FOUND") {
            return status(404, { status: "error", message: "Route not found" });
        }

        console.error(error);

        return status(500, { status: "error", message: "Internal server error" });
    })
    .get("/health", () => ({ status: "ok" }))
    .use(auth)
    .use(book)
    .use(collection)
    .use(files)
    .listen(port);

console.log(`🦊 Reader API running at ${app.server?.hostname}:${app.server?.port}`);
