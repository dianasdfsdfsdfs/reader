import { t } from "elysia";

const email = t.String({ format: "email", maxLength: 255 });
const password = t.String({ minLength: 8, maxLength: 128 });

export const registerBody = t.Object({ email, password });
export const loginBody = t.Object({ email, password });
