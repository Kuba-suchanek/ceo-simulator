import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createFallbackClient() {
  return {
    from() {
      return {
        select() {
          return {
            order() {
              return this;
            },
            limit() {
              return Promise.resolve({ data: [], error: null });
            },
          };
        },
        insert() {
          return Promise.resolve({ error: null });
        },
      };
    },
  };
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (createFallbackClient() as ReturnType<typeof createClient>);
