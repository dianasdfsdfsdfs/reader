import { createClient } from "@supabase/supabase-js";
import env from "@/config/env";

export const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    },
);

export const storage = supabase.storage.from(env.SUPABASE_BUCKET);
