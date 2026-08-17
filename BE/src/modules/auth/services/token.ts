import jwt from "jsonwebtoken";
import env from "@/config/env";

type TokenPayload = {
    id: number;
};

class TokenService {
    generate(payload: TokenPayload) {
        return jwt.sign(
            {
                id: payload.id
            },
            env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );
    }

    verify(token: string) {
        return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    }

    parseBearerHeader(authorization?: string) {
        if (!authorization) {
            throw new Error("Authorization header missing");
        }

        if (!authorization.startsWith("Bearer ")) {
            throw new Error("Expected Bearer token");
        }

        const token = authorization.slice(7).trim();

        if (!token) {
            throw new Error("Bearer token is empty");
        }

        return token;
    }
}

export const tokenService = new TokenService();