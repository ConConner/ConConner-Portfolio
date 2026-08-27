-- Local-only auth users, so the admin panel can be exercised against
-- `supabase start` without registering a second GitHub OAuth app.
--
-- This file only ever runs during `supabase db reset` against the local
-- stack — seeds are never applied to the hosted project, which is why
-- hardcoding a throwaway password here is fine. Sign in with them via the
-- dev-only password form on /admin/login.
--
--   conner@conconner.com / localtest123  -> passes is_admin(), can write
--   nonadmin@local.test  / localtest123  -> signs in, every write is refused
--
-- The admin user deliberately reuses a real address from the is_admin()
-- allowlist rather than a made-up local one: is_admin() compares auth.email(),
-- so this exercises the exact policy production runs, and no test address ever
-- has to be added to the allowlist that ships.

-- The token columns are '' rather than null: GoTrue scans them into plain
-- strings and 500s ("converting NULL to string is unsupported") otherwise.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token,
  reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000',
  seed.id,
  'authenticated',
  'authenticated',
  seed.email,
  extensions.crypt('localtest123', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  '', '', '', '', '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'conner@conconner.com'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'nonadmin@local.test')
) as seed (id, email)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at,
  created_at, updated_at
)
select
  extensions.gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
)
on conflict (provider, provider_id) do nothing;
