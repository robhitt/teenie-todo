-- Profiles (auto-created on signup via trigger)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lists
create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sharing
create table if not exists list_shares (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  shared_with_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(list_id, shared_with_id)
);

-- Todos
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  text text not null,
  is_completed boolean default false,
  completed_at timestamptz,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invite links for sharing lists via URL
create table if not exists invite_links (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_by uuid not null references profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now()
);

-- Auto-set owner_id on list creation
create or replace function public.set_list_owner()
returns trigger as $$
begin
  new.owner_id := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger set_list_owner_trigger
  before insert on lists
  for each row execute function public.set_list_owner();

-- Updated_at triggers
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create or replace trigger lists_updated_at
  before update on lists
  for each row execute function public.update_updated_at();

create or replace trigger todos_updated_at
  before update on todos
  for each row execute function public.update_updated_at();

-- ============ SECURITY DEFINER Helper Functions ============
-- These bypass RLS to break circular dependency between lists and list_shares

create or replace function public.is_list_owner(p_list_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.lists
    where id = p_list_id and owner_id = auth.uid()
  );
$$ language sql security definer stable;

create or replace function public.has_list_access(p_list_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.lists
    where id = p_list_id and owner_id = auth.uid()
  )
  or exists (
    select 1 from public.list_shares
    where list_id = p_list_id and shared_with_id = auth.uid()
  );
$$ language sql security definer stable;

-- Accept invite link RPC (SECURITY DEFINER to bypass RLS)
create or replace function public.accept_invite(p_token text)
returns uuid as $$
declare
  v_list_id uuid;
  v_user_id uuid := auth.uid();
begin
  -- Find valid, non-expired invite
  select list_id into v_list_id
  from public.invite_links
  where token = p_token and expires_at > now();

  if v_list_id is null then
    raise exception 'Invalid or expired invite link';
  end if;

  -- Don't add owner as a share
  if public.is_list_owner(v_list_id) then
    return v_list_id;
  end if;

  -- Insert share (ignore if already exists)
  insert into public.list_shares (list_id, shared_with_id)
  values (v_list_id, v_user_id)
  on conflict (list_id, shared_with_id) do nothing;

  return v_list_id;
end;
$$ language plpgsql security definer;

-- ============ RLS Policies ============

alter table profiles enable row level security;
alter table lists enable row level security;
alter table list_shares enable row level security;
alter table todos enable row level security;
alter table invite_links enable row level security;

-- Profiles: users can read all profiles (for sharing lookup), update own
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (id = auth.uid());

-- Lists: owner or shared user can see (via helper function)
create policy "lists_select" on lists for select using (
  public.has_list_access(id)
);
create policy "lists_insert" on lists for insert with check (true);
create policy "lists_update" on lists for update using (public.is_list_owner(id));
create policy "lists_delete" on lists for delete using (public.is_list_owner(id));

-- List shares: owner can manage, shared user can see own shares
create policy "list_shares_select" on list_shares for select using (
  public.is_list_owner(list_id) or shared_with_id = auth.uid()
);
create policy "list_shares_insert" on list_shares for insert with check (
  public.is_list_owner(list_id)
);
create policy "list_shares_delete" on list_shares for delete using (
  public.is_list_owner(list_id)
);

-- Todos: anyone with list access can CRUD (via helper function)
create policy "todos_select" on todos for select using (
  public.has_list_access(list_id)
);
create policy "todos_insert" on todos for insert with check (
  public.has_list_access(list_id)
);
create policy "todos_update" on todos for update using (
  public.has_list_access(list_id)
);
create policy "todos_delete" on todos for delete using (
  public.has_list_access(list_id)
);

-- Invite links: only list owner can manage
create policy "invite_links_select" on invite_links for select using (
  public.is_list_owner(list_id)
);
create policy "invite_links_insert" on invite_links for insert with check (
  public.is_list_owner(list_id)
);
create policy "invite_links_delete" on invite_links for delete using (
  public.is_list_owner(list_id)
);

-- Enable realtime for sync
alter publication supabase_realtime add table todos;
alter publication supabase_realtime add table lists;
alter publication supabase_realtime add table list_shares;
