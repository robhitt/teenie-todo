-- Migration: Make invite links single-use
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.accept_invite(p_token text)
RETURNS uuid AS $$
DECLARE
  v_link_id uuid;
  v_list_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  SELECT id, list_id INTO v_link_id, v_list_id
  FROM public.invite_links
  WHERE token = p_token AND expires_at > now();

  IF v_list_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite link';
  END IF;

  -- Delete the link (one-time use)
  DELETE FROM public.invite_links WHERE id = v_link_id;

  IF public.is_list_owner(v_list_id) THEN
    RETURN v_list_id;
  END IF;

  INSERT INTO public.list_shares (list_id, shared_with_id)
  VALUES (v_list_id, v_user_id)
  ON CONFLICT (list_id, shared_with_id) DO NOTHING;

  RETURN v_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
