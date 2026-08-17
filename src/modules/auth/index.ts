
import { Elysia } from "elysia";
import { registerBody, loginBody } from "./models/model";
import { authService } from "./services/auth";
import { authentificateMiddleware } from "./middlewares/authentificate";
import { UserDTO } from "./dto/user";

export const auth = new Elysia({ prefix: "/auth" })
.post(
    "/register",
    async ({ body }) => {
        try {
            const response = await authService.register(
                body.email,
                body.password,
            );
            
            const dtoResponse = await UserDTO.makeToResponse(
                response.user,
                "Login successful"
            );
            
            return {
                ...dtoResponse,
                    token: response.token
                };
            } catch (e: any) {
                return {
                    status: "error",
                    message: e.message
                };
            }
        },
        {
            body: registerBody,
            // response: UserDTO.type()
        }
    )
    .post(
        "/login",
        async ({ body }) => {
            try {
                const response = await authService.login(body.email, body.password);

                const dtoResponse = await UserDTO.makeToResponse(
                    response.user,
                    "Login successful"
                );
                
                return {
                    ...dtoResponse,
                    token: response.token
                };
            } catch (e: any) {
                return {
                    status: "error",
                    message: e.message
                };
            }
        },
        {
            body: loginBody
        }
    )