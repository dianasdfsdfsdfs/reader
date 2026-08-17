import { t } from "elysia";
import type { UserModel } from "@/generated/prisma/models";

const userSchema = t.Object({
    id: t.Number(),
    email: t.String({ format: "email" })
});

const responseSchema = t.Object({
    status: t.String(),
    message: t.String(),
    user: userSchema
});

export const UserDTO = {
    type() {
        return responseSchema;
    },

    makeToResponse(user: UserModel, message: string) {
        return {
            status: "success",
            message,
            user: {
                id: user.id,
                email: user.email
            }
        };
    }
};
