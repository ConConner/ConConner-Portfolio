import type { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "./auth";

const SECTIONS = [
  { path: "/admin", label: "Content" },
  { path: "/admin/blog", label: "Blog" },
  { path: "/admin/timeline", label: "Timeline" },
  { path: "/admin/games", label: "Games" },
] as const;

export function AdminShell({
  title,
  action,
  children,
}: PropsWithChildren<{ title: string; action?: React.ReactNode }>) {
  const { pathname } = useLocation();

  return (
    <div className="mt-2 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="flex gap-2">
          {SECTIONS.map((section) => (
            <Button
              key={section.path}
              asChild
              size="sm"
              variant={pathname === section.path ? "default" : "outline"}
            >
              <Link to={section.path}>{section.label}</Link>
            </Button>
          ))}
        </nav>
        <Button size="sm" variant="ghost" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {action}
      </div>

      {children}
    </div>
  );
}

/** Inline status line shared by the admin forms. */
export function FormStatus({
  error,
  busy,
  className,
}: {
  error?: string | null;
  busy?: string | null;
  className?: string;
}) {
  if (!error && !busy) return null;
  return (
    <p
      className={cn(
        "text-sm",
        error ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      {error ?? busy}
    </p>
  );
}
