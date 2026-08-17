const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET;

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in .env");
}

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in .env");
}

if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is missing in .env");
}

if (!SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY is missing in .env");
}

if (!SUPABASE_BUCKET) {
    throw new Error("SUPABASE_BUCKET is missing in .env");
}

const env = {
    DATABASE_URL,
    JWT_SECRET,
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    SUPABASE_BUCKET
};

export default env;
