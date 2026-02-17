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

-- ============ RLS Policies ============

alter table profiles enable row level security;
alter table lists enable row level security;
alter table list_shares enable row level security;
alter table todos enable row level security;

-- Profiles: users can read all profiles (for sharing lookup), update own
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (id = auth.uid());

-- Lists: owner or shared user can see (uses exists to avoid recursion with list_shares)
create policy "lists_select" on lists for select using (
  owner_id = auth.uid() or
  exists (
    select 1 from list_shares ls
    where ls.list_id = id and ls.shared_with_id = auth.uid()
  )
);
create policy "lists_insert" on lists for insert with check (true);
create policy "lists_update" on lists for update using (owner_id = auth.uid());
create policy "lists_delete" on lists for delete using (owner_id = auth.uid());

-- List shares: owner can manage, shared user can see
create policy "list_shares_select" on list_shares for select using (
  list_id in (select id from lists where owner_id = auth.uid()) or
  shared_with_id = auth.uid()
);
create policy "list_shares_insert" on list_shares for insert with check (
  list_id in (select id from lists where owner_id = auth.uid())
);
create policy "list_shares_delete" on list_shares for delete using (
  list_id in (select id from lists where owner_id = auth.uid())
);

-- Todos: anyone with list access can CRUD (uses direct join to avoid recursion)
create policy "todos_select" on todos for select using (
  exists (
    select 1 from lists l
    left join list_shares ls on ls.list_id = l.id
    where l.id = list_id
    and (l.owner_id = auth.uid() or ls.shared_with_id = auth.uid())
  )
);
create policy "todos_insert" on todos for insert with check (
  exists (
    select 1 from lists l
    left join list_shares ls on ls.list_id = l.id
    where l.id = list_id
    and (l.owner_id = auth.uid() or ls.shared_with_id = auth.uid())
  )
);
create policy "todos_update" on todos for update using (
  exists (
    select 1 from lists l
    left join list_shares ls on ls.list_id = l.id
    where l.id = list_id
    and (l.owner_id = auth.uid() or ls.shared_with_id = auth.uid())
  )
);
create policy "todos_delete" on todos for delete using (
  exists (
    select 1 from lists l
    left join list_shares ls on ls.list_id = l.id
    where l.id = list_id
    and (l.owner_id = auth.uid() or ls.shared_with_id = auth.uid())
  )
);

-- Enable realtime for sync
alter publication supabase_realtime add table todos;
alter publication supabase_realtime add table lists;
alter publication supabase_realtime add table list_shares;
