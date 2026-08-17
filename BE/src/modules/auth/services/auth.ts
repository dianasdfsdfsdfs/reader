import bcrypt from "bcrypt";
import { authRepository } from "../repositories/auth";
import { tokenService } from "./token";

class AuthService {
    async register(email: string, password: string) {
        const existingUser = await authRepository.findByEmail(email);

        if (existingUser) {
            throw new Error("User already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await authRepository.createUser({
            email,
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
        const user = await authRepository.findByEmail(email);

        if (!user) {
            throw new Error("User not found");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordCorrect) {
            throw new Error("Invalid password");
        }

        const token = tokenService.generate({
            id: user.id
        });

        return {
            user,
            token
        };
    }

    async logout() {
        return {
            status: "success",
            message: "Logout successful"
        };
    }
}

export const authService = new AuthService();