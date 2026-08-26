import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/admin/useSession";
import { isAdminSession, signInWithGitHub } from "@/admin/auth";

export default function AdminLogin() {
  const { session, loading } = useSession();
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <p className="p-6 text-muted-foreground">Checking session...</p>;
  }

  if (isAdminSession(session)) {
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
    </div>
  );
}
