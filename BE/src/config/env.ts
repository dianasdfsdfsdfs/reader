const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in .env");
}

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in .env");
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET;

/**
 * Куда складывать .epub и обложки.
 *
 * `local` — в папку BE/storage, файлы отдаёт сам API через /files/*.
 * Так проект поднимается сразу после `git clone`, без аккаунта Supabase.
 * `supabase` — прод-вариант, включается сам, если заданы все три SUPABASE_*.
 */
const STORAGE_DRIVER = (process.env.STORAGE_DRIVER ??
    (SUPABASE_URL && SUPABASE_SECRET_KEY && SUPABASE_BUCKET ? "supabase" : "local")) as
    | "local"
    | "supabase";

if (STORAGE_DRIVER !== "local" && STORAGE_DRIVER !== "supabase") {
    throw new Error(`STORAGE_DRIVER must be "local" or "supabase", got "${STORAGE_DRIVER}"`);
}

if (STORAGE_DRIVER === "supabase" && !(SUPABASE_URL && SUPABASE_SECRET_KEY && SUPABASE_BUCKET)) {
    throw new Error(
        "STORAGE_DRIVER=supabase requires SUPABASE_URL, SUPABASE_SECRET_KEY and SUPABASE_BUCKET"
    );
}

const env = {
    DATABASE_URL,
    JWT_SECRET,
    STORAGE_DRIVER,
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    SUPABASE_BUCKET,
    /** Абсолютный адрес самого API — из него собираются ссылки на файлы для local-драйвера. */
    PUBLIC_URL: (process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(
        /\/$/,
        ""
    ),
    STORAGE_DIR: process.env.STORAGE_DIR ?? "storage"
};

export default env;
