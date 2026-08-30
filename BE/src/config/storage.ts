import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import env from "@/config/env";
import { createSupabaseStorage } from "@/config/supabase";

export interface StorageDriver {
    upload(key: string, file: File): Promise<void>;
    remove(keys: string[]): Promise<void>;
    /** Постоянная ссылка — для обложек. */
    publicUrl(key: string): string;
    /** Временная ссылка — для самих .epub. */
    signedUrl(key: string, ttlSeconds: number): Promise<string>;
}

/* ------------------------------------------------------------------ local */

const storageRoot = () => join(process.cwd(), env.STORAGE_DIR);

/** Не даём ключу выбраться за пределы storage через `..`. */
const resolveKey = (key: string) => {
    const path = normalize(join(storageRoot(), key));

    if (!path.startsWith(storageRoot())) {
        throw new Error("Invalid storage key");
    }

    return path;
};

const sign = (key: string, expires: number) =>
    createHmac("sha256", env.JWT_SECRET).update(`${key}:${expires}`).digest("hex");

/** Проверка подписи из query-строки — используется роутом GET /files/*. */
export const verifySignature = (key: string, expires: number, signature: string) => {
    if (!Number.isFinite(expires) || expires * 1000 < Date.now()) {
        return false;
    }

    const expected = Buffer.from(sign(key, expires));
    const actual = Buffer.from(signature);

    return expected.length === actual.length && timingSafeEqual(expected, actual);
};

class LocalStorage implements StorageDriver {
    async upload(key: string, file: File) {
        const path = resolveKey(key);

        await mkdir(dirname(path), { recursive: true });
        await Bun.write(path, file);
    }

    async remove(keys: string[]) {
        await Promise.all(keys.map((key) => rm(resolveKey(key), { force: true })));
    }

    publicUrl(key: string) {
        return `${env.PUBLIC_URL}/files/${key}`;
    }

    async signedUrl(key: string, ttlSeconds: number) {
        const expires = Math.floor(Date.now() / 1000) + ttlSeconds;

        return `${env.PUBLIC_URL}/files/${key}?expires=${expires}&signature=${sign(key, expires)}`;
    }
}

export const readLocalFile = (key: string) => Bun.file(resolveKey(key));

/* --------------------------------------------------------------- supabase */

class SupabaseStorage implements StorageDriver {
    private bucket = createSupabaseStorage();

    async upload(key: string, file: File) {
        const { error } = await this.bucket.upload(key, file, {
            contentType: file.type,
            upsert: false
        });

        if (error) {
            throw new Error(error.message);
        }
    }

    async remove(keys: string[]) {
        await this.bucket.remove(keys);
    }

    publicUrl(key: string) {
        return this.bucket.getPublicUrl(key).data.publicUrl;
    }

    async signedUrl(key: string, ttlSeconds: number) {
        const { data, error } = await this.bucket.createSignedUrl(key, ttlSeconds);

        if (error || !data) {
            throw new Error(error?.message ?? "Failed to create a signed url");
        }

        return data.signedUrl;
    }
}

export const storage: StorageDriver =
    env.STORAGE_DRIVER === "supabase" ? new SupabaseStorage() : new LocalStorage();
