import jwt from "jsonwebtoken";
import env from "@/config/env";
import { unauthorized } from "@/shared/errors";

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
        try {
            return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
        } catch {
            throw unauthorized("Invalid or expired token");
        }
    }

    parseBearerHeader(authorization?: string) {
        if (!authorization) {
            throw unauthorized("Authorization header missing");
        }

        if (!authorization.startsWith("Bearer ")) {
            throw unauthorized("Expected Bearer token");
        }

        const token = authorization.slice(7).trim();

        if (!token) {
            throw unauthorized("Bearer token is empty");
        }

        return token;
    }
}

export const tokenService = new TokenService();
