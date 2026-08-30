import { request } from "./client";
import type { User } from "@/shared/types";

interface AuthResponse {
    status: string;
    message: string;
    user: User;
    token: string;
}

export const authApi = {
    register: (email: string, password: string) =>
        request<AuthResponse>("/auth/register", { method: "POST", body: { email, password } }),

    login: (email: string, password: string) =>
        request<AuthResponse>("/auth/login", { method: "POST", body: { email, password } }),

    me: () => request<{ user: User }>("/auth/me").then((response) => response.user),

    logout: () => request<unknown>("/auth/logout", { method: "POST" })
};
