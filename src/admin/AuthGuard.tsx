import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/lib/seo";
import { isAdminSession, signOut } from "./auth";
import { useSession } from "./useSession";

export function AuthGuard({ children }: PropsWithChildren) {
  const { session, loading } = useSession();

  // Defence in depth alongside the `Disallow: /admin` in public/robots.txt.
  useSeo({ title: "Admin", noindex: true });

  if (loading) {
    return <p className="p-6 text-muted-foreground">Checking session...</p>;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdminSession(session)) {
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <h1 className="text-xl font-semibold">Not authorised</h1>
        <p className="text-muted-foreground">
          Signed in as {session.user.email ?? "an unknown account"}, which is
          not an admin account for this site.
        </p>
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
