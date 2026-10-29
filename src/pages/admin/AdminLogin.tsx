import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/admin/useSession";
import { signInWithGitHub, signInWithPassword } from "@/admin/auth";
import { useSeo } from "@/lib/seo";

/**
 * Password sign-in against the users seeded in
 * supabase/seeds/00_local_users.sql. Behind `import.meta.env.DEV`, so Vite
 * drops it from the production bundle entirely.
 */
function LocalSignIn() {
  const [email, setEmail] = useState("conner@conconner.com");
  const [password, setPassword] = useState("localtest123");
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    const { error } = await signInWithPassword(email, password);
    if (error) setError(error.message);
  };

  return (
    <div className="flex w-full flex-col gap-3 border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">
        Dev only — the seeded local users. Sign in as nonadmin@local.test to see
        what a non-admin account gets.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="local-email">Email</Label>
        <Input
          id="local-email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="local-password">Password</Label>
        <Input
          id="local-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <Button variant="outline" onClick={handleSignIn}>
        Sign in with password
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default function AdminLogin() {
  const { session, loading } = useSession();
  const [error, setError] = useState<string | null>(null);

  // This route is outside AuthGuard, so it needs its own noindex.
  useSeo({ title: "Admin sign-in", noindex: true });

  if (loading) {
    return <p className="p-6 text-muted-foreground">Checking session...</p>;
  }

  // Any session goes to /admin: AuthGuard is the single place that decides
  // between the panel and the "not authorised" screen, so signing in with the
  // wrong account lands somewhere that says so instead of silently sitting on
  // this page.
  if (session) {
    return <Navigate to="/admin" replace />;
  }

  const handleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGitHub();
    if (error) setError(error.message);
  };

  return (
    <div className="mx-auto mt-24 flex max-w-sm flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-muted-foreground">
        Sign in with the GitHub account tied to this site to edit content.
      </p>
      <Button onClick={handleSignIn}>Sign in with GitHub</Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {import.meta.env.DEV && <LocalSignIn />}
    </div>
  );
}
