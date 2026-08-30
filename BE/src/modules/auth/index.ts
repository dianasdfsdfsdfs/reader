import { Elysia } from "elysia";
import { registerBody, loginBody } from "./models/model";
import { authService } from "./services/auth";
import { authentificateMiddleware } from "./middlewares/authentificate";
import { UserDTO } from "./dto/user";

export const auth = new Elysia({ prefix: "/auth" })
    .post(
        "/register",
        async ({ body, status }) => {
            const { user, token } = await authService.register(body.email, body.password);

            return status(201, {
                ...UserDTO.makeToResponse(user, "Registration successful"),
                token
            });
        },
        {
            body: registerBody,
            detail: { summary: "Создать аккаунт", tags: ["auth"] }
        }
    )
    .post(
        "/login",
        async ({ body }) => {
            const { user, token } = await authService.login(body.email, body.password);

            return {
                ...UserDTO.makeToResponse(user, "Login successful"),
                token
            };
        },
        {
            body: loginBody,
            detail: { summary: "Войти", tags: ["auth"] }
        }
    )
    .use(authentificateMiddleware)
    .get(
        "/me",
        ({ user }) => UserDTO.makeToResponse(user, "Current user"),
        { detail: { summary: "Текущий пользователь", tags: ["auth"] } }
    )
    .post(
        "/logout",
        () => ({
            status: "success",
            message: "Logout successful"
        }),
        { detail: { summary: "Выйти", tags: ["auth"] } }
    );
