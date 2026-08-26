import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * The only account allowed to write. This check is defence in depth for the
 * UI — the real enforcement is the `is_admin()` RLS policies in
 * supabase/schemas/06_auth_policies.sql, which reject writes from anyone else
 * even if they call supabase-js directly.
 */
export const ADMIN_EMAIL = "conner@conconner.com";

export const isAdminSession = (session: Session | null): boolean =>
  session?.user.email === ADMIN_EMAIL;

export const signInWithGitHub = () =>
  supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${window.location.origin}/admin` },
  });

export const signOut = () => supabase.auth.signOut();
