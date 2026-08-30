import { Elysia } from "elysia";
import db from "@/db";
import { tokenService } from "../services/token";
import { unauthorized } from "@/shared/errors";

export const authentificateMiddleware = new Elysia({ name: "authentificate" })
    .derive({ as: "scoped" }, async ({ headers }) => {
        const token = tokenService.parseBearerHeader(headers.authorization);

        const payload = tokenService.verify(token);

        const user = await db.user.findUnique({
            where: {
                id: payload.id
            }
        });

        if (!user) {
            throw unauthorized();
        }

        return {
            user
        };
    });
