import { t } from "elysia";

export const registerBody = t.Object({
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 3, maxLength: 10 })
});

export const loginBody = t.Object({
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 3, maxLength: 8})
});
