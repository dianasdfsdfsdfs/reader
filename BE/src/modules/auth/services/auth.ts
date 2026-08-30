import bcrypt from "bcrypt";
import { authRepository } from "../repositories/auth";
import { tokenService } from "./token";
import { conflict, unauthorized } from "@/shared/errors";

class AuthService {
    async register(email: string, password: string) {
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await authRepository.findByEmail(normalizedEmail);

        if (existingUser) {
            throw conflict("User already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await authRepository.createUser({
            email: normalizedEmail,
            passwordHash: hashedPassword,
        });

        const token = tokenService.generate({
            id: user.id
        });

        return {
            user,
            token
        };
    }

    async login(email: string, password: string) {
        const user = await authRepository.findByEmail(email.trim().toLowerCase());

        // Одинаковый текст на «нет пользователя» и «неверный пароль», чтобы
        // по ответу нельзя было перебором узнать, какие email зарегистрированы.
        if (!user) {
            throw unauthorized("Invalid email or password");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordCorrect) {
            throw unauthorized("Invalid email or password");
        }

        const token = tokenService.generate({
            id: user.id
        });

        return {
            user,
            token
        };
    }
}

export const authService = new AuthService();
