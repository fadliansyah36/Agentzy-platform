-- Phase 01: add profile email projection for authorized tenant member directory.
alter table public.profiles add column if not exists email text;
create index if not exists profiles_email_lower_idx on public.profiles (lower(email)) where email is not null;
update public.profiles p
set email = u.email,
    display_name = coalesce(p.display_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')
from auth.users u
where u.id = p.user_id
  and (p.email is distinct from u.email or p.display_name is null);
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(user_id,email,display_name)
  values (new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name'))
  on conflict(user_id) do update
    set email=excluded.email,
        display_name=coalesce(excluded.display_name,public.profiles.display_name),
        updated_at=now();
  return new;
end;
$$;
revoke all on function public.handle_new_auth_user() from public,anon,authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update on auth.users
for each row execute function public.handle_new_auth_user();
