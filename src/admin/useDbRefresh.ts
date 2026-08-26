import { useCallback, useState } from "react";
import { initDb } from "@/data/db";

/**
 * Re-reads the database after a write. This is a single-admin site, so
 * refetching everything is simpler (and plenty fast) compared to keeping
 * local state in sync with each mutation.
 */
export const useDbRefresh = () => {
  const [, setVersion] = useState(0);
  return useCallback(async () => {
    await initDb();
    setVersion((version) => version + 1);
  }, []);
};
