-- Extensions Supabase installs by default. Declared explicitly so the
-- declarative planner never treats them as unmanaged (and drops them).
create extension if not exists "pgcrypto" with schema "extensions";
create extension if not exists "uuid-ossp" with schema "extensions";
