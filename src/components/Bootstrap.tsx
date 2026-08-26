/** Shown while the database loads at startup, and if it fails to load. */
export function Bootstrap({ error }: { error?: unknown }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      {error ? (
        <>
          <p className="text-lg font-medium">Couldn't load content</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </>
      ) : (
        <p className="animate-pulse text-muted-foreground">Loading...</p>
      )}
    </div>
  );
}
