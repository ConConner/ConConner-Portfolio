import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * The only accounts allowed to write. Both addresses are Conner: Supabase
 * takes the account email from the *primary verified* email on the GitHub
 * profile, which is the gmail one.
 *
 * This check is defence in depth for the UI — the real enforcement is the
 * `is_admin()` RLS policies in supabase/schemas/06_auth_policies.sql, which
 * reject writes from anyone else even if they call supabase-js directly. Keep
 * the two lists in sync.
 */
export const ADMIN_EMAILS = ["conner@conconner.com", "egal3d@gmail.com"];

export const isAdminSession = (session: Session | null): boolean =>
  Boolean(session?.user.email && ADMIN_EMAILS.includes(session.user.email));

export const signInWithGitHub = () =>
  supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${window.location.origin}/admin` },
  });

/**
 * Dev-only escape hatch so the admin panel can be exercised against the local
 * Supabase stack without registering a second GitHub OAuth app. The seeded
 * local users live in supabase/seeds/00_local_users.sql; the sign-in form that
 * calls this is behind `import.meta.env.DEV`, so it is never in the bundle
 * Vercel ships.
 */
export const signInWithPassword = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();
