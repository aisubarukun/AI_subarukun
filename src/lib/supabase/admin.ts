import { createClient } from "@supabase/supabase-js";

/**
 * サーバー側や外部スクリプトで、管理者権限（Service Role）でSupabaseを操作するためのクライアント
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
