import { Elysia, t } from "elysia";
import env from "@/config/env";
import { readLocalFile, verifySignature } from "@/config/storage";
import { forbidden, notFound } from "@/shared/errors";

/**
 * Раздача файлов для STORAGE_DRIVER=local (при supabase файлы отдаёт сам Supabase).
 *
 * Обложки под `covers/` открыты — их адреса и так вшиты в разметку.
 * Книги под `books/` доступны только по подписанной ссылке из GET /book/:id/read.
 */
export const files = new Elysia({ prefix: "/files" }).get(
    "/*",
    async ({ params, query, set }) => {
        if (env.STORAGE_DRIVER !== "local") {
            throw notFound("Not found");
        }

        const key = params["*"];

        if (!key.startsWith("covers/")) {
            const expires = Number(query.expires);

            if (!query.signature || !verifySignature(key, expires, query.signature)) {
                throw forbidden("Link is invalid or has expired");
            }
        }

        const file = readLocalFile(key);

        if (!(await file.exists())) {
            throw notFound("File not found");
        }

        set.headers["cache-control"] = "private, max-age=3600";

        return file;
    },
    {
        query: t.Object({
            expires: t.Optional(t.String()),
            signature: t.Optional(t.String())
        })
    }
);
