import { Elysia } from "elysia";
import db from "@/db";
import { tokenService } from "../services/token";

export const authentificateMiddleware = new Elysia()
    .derive({ as: "scoped" }, async ({ headers }) => {
        const token = tokenService.parseBearerHeader(headers.authorization);

        const payload = tokenService.verify(token);

        const user = await db.user.findUnique({
            where: {
                id: payload.id
            }
        });

        if (!user) {
            throw new Error("Unauthorized");
        }

        return {
            user
        };
    });