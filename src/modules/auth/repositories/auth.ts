//db.ts import + database requests 

import database from "@/db";

class AuthRepository {
    async findByEmail(email: string) {
        return await database.user.findFirst({
            where: {
                email
            }
        });
    }

    async createUser(data: {
        email: string;
        passwordHash: string;
    }) {
        return await database.user.create({
            data: {
                email: data.email,
                passwordHash: data.passwordHash,
            }
        });
    }
    async findById(id: number) {
        return await database.user.findUnique({
            where: {
                id
            }
        });
    }

}

export const authRepository = new AuthRepository();