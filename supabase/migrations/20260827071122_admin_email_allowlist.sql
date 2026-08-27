set local check_function_bodies = off;

create or replace function public.is_admin()
  returns boolean
  language sql
  stable
  AS $function$
  select auth.email() = any (array['conner@conconner.com', 'egal3d@gmail.com']);
$function$;
