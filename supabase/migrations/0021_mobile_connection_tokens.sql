-- =========================================================
-- GuardianX Mobile — real connection-token mechanism
-- =========================================================

create table if not exists public.mobile_connection_tokens (
                                                               id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users (id) on delete cascade,
    token        text not null unique,
    expires_at   timestamptz not null,
    redeemed_at  timestamptz,
    created_at   timestamptz not null default now()
    );

create index if not exists idx_mobile_connection_tokens_token
    on public.mobile_connection_tokens (token);

alter table public.mobile_connection_tokens enable row level security;

drop policy if exists "Users manage their own connection tokens" on public.mobile_connection_tokens;
create policy "Users manage their own connection tokens"
  on public.mobile_connection_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.generate_mobile_connection_token()
returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
v_token text;
  v_expires_at timestamptz := now() + interval '10 minutes';
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
end if;

  v_token := upper(substr(md5(gen_random_uuid()::text), 1, 8));

insert into public.mobile_connection_tokens (user_id, token, expires_at)
values (auth.uid(), v_token, v_expires_at);

return query select v_token, v_expires_at;
end;
$$;

grant execute on function public.generate_mobile_connection_token() to authenticated;

create or replace function public.redeem_mobile_connection_token(p_token text)
returns table (email text)
language plpgsql
security definer
set search_path = public
as $$
declare
v_row public.mobile_connection_tokens%rowtype;
  v_email text;
begin
select * into v_row
from public.mobile_connection_tokens
where token = upper(trim(p_token))
    for update;

if not found then
    raise exception 'Invalid code.';
end if;

  if v_row.redeemed_at is not null then
    raise exception 'This code has already been used.';
end if;

  if v_row.expires_at < now() then
    raise exception 'This code has expired.';
end if;

update public.mobile_connection_tokens
set redeemed_at = now()
where id = v_row.id;

select au.email into v_email from auth.users au where au.id = v_row.user_id;

return query select v_email;
end;
$$;

grant execute on function public.redeem_mobile_connection_token(text) to anon, authenticated;