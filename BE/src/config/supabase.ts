import { createClient } from "@supabase/supabase-js";
import env from "@/config/env";

/** Клиент создаётся лениво: при STORAGE_DRIVER=local ключей Supabase может не быть вовсе. */
export const createSupabaseStorage = () => {
    if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY || !env.SUPABASE_BUCKET) {
        throw new Error("Supabase credentials are missing");
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    return supabase.storage.from(env.SUPABASE_BUCKET);
};
