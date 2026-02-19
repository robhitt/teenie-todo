-- Migration: Fix RLS recursion + Add invite links
-- Run this in Supabase SQL Editor wrapped in a transaction

BEGIN;

-- ============ Drop existing policies ============

DROP POLICY IF EXISTS "lists_select" ON lists;
DROP POLICY IF EXISTS "lists_insert" ON lists;
DROP POLICY IF EXISTS "lists_update" ON lists;
DROP POLICY IF EXISTS "lists_delete" ON lists;

DROP POLICY IF EXISTS "list_shares_select" ON list_shares;
DROP POLICY IF EXISTS "list_shares_insert" ON list_shares;
DROP POLICY IF EXISTS "list_shares_delete" ON list_shares;

DROP POLICY IF EXISTS "todos_select" ON todos;
DROP POLICY IF EXISTS "todos_insert" ON todos;
DROP POLICY IF EXISTS "todos_update" ON todos;
DROP POLICY IF EXISTS "todos_delete" ON todos;

-- ============ Create invite_links table ============

CREATE TABLE IF NOT EXISTS invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;

-- ============ SECURITY DEFINER helper functions ============

CREATE OR REPLACE FUNCTION public.is_list_owner(p_list_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lists
    WHERE id = p_list_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_list_access(p_list_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lists
    WHERE id = p_list_id AND owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.list_shares
    WHERE list_id = p_list_id AND shared_with_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============ accept_invite RPC ============

CREATE OR REPLACE FUNCTION public.accept_invite(p_token text)
RETURNS uuid AS $$
DECLARE
  v_list_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  SELECT list_id INTO v_list_id
  FROM public.invite_links
  WHERE token = p_token AND expires_at > now();

  IF v_list_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite link';
  END IF;

  IF public.is_list_owner(v_list_id) THEN
    RETURN v_list_id;
  END IF;

  INSERT INTO public.list_shares (list_id, shared_with_id)
  VALUES (v_list_id, v_user_id)
  ON CONFLICT (list_id, shared_with_id) DO NOTHING;

  RETURN v_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ Recreate RLS policies using helper functions ============

-- Lists
CREATE POLICY "lists_select" ON lists FOR SELECT USING (
  public.has_list_access(id)
);
CREATE POLICY "lists_insert" ON lists FOR INSERT WITH CHECK (true);
CREATE POLICY "lists_update" ON lists FOR UPDATE USING (public.is_list_owner(id));
CREATE POLICY "lists_delete" ON lists FOR DELETE USING (public.is_list_owner(id));

-- List shares
CREATE POLICY "list_shares_select" ON list_shares FOR SELECT USING (
  public.is_list_owner(list_id) OR shared_with_id = auth.uid()
);
CREATE POLICY "list_shares_insert" ON list_shares FOR INSERT WITH CHECK (
  public.is_list_owner(list_id)
);
CREATE POLICY "list_shares_delete" ON list_shares FOR DELETE USING (
  public.is_list_owner(list_id)
);

-- Todos
CREATE POLICY "todos_select" ON todos FOR SELECT USING (
  public.has_list_access(list_id)
);
CREATE POLICY "todos_insert" ON todos FOR INSERT WITH CHECK (
  public.has_list_access(list_id)
);
CREATE POLICY "todos_update" ON todos FOR UPDATE USING (
  public.has_list_access(list_id)
);
CREATE POLICY "todos_delete" ON todos FOR DELETE USING (
  public.has_list_access(list_id)
);

-- Invite links
CREATE POLICY "invite_links_select" ON invite_links FOR SELECT USING (
  public.is_list_owner(list_id)
);
CREATE POLICY "invite_links_insert" ON invite_links FOR INSERT WITH CHECK (
  public.is_list_owner(list_id)
);
CREATE POLICY "invite_links_delete" ON invite_links FOR DELETE USING (
  public.is_list_owner(list_id)
);

COMMIT;
