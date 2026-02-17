# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Better ToDo** — a collaborative todo list app with real-time sync, fuzzy search, and list sharing. Built on React + TypeScript, Vite, Redux Toolkit, Supabase, and Tailwind CSS v4.

## Current Status

Phases 1-4 complete (Auth, Lists CRUD, Todos + Fuzzy Search, Sharing + Realtime). **Phase 5 (Mobile polish + PWA) is next**: AlphabetScroller, PWA manifest/service worker, mobile responsive sidebar, empty states, loading skeletons, toasts, offline banner, then deploy to Vercel.

## Commands

```bash
pnpm dev        # Start Vite dev server (localhost:5173)
pnpm build      # Type-check (tsc -b) then Vite production build
pnpm lint       # ESLint
pnpm preview    # Serve dist/ locally
```

Environment variables in `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Architecture

**State**: Redux Toolkit store with three slices — `auth` (Supabase user session), `lists` (CRUD + async thunks), `todos` (CRUD + optimistic updates + realtime reducers). Use typed hooks from `src/store/hooks.ts` (`useAppDispatch`, `useAppSelector`).

**Routing**: React Router v7. Routes nest under `AppLayout` (sidebar + outlet). `AuthGuard` wraps the router and shows `LoginPage` when unauthenticated. `HomeRedirect` at `/` sends users to their last-viewed list via localStorage.

**Backend**: Supabase handles auth (Google OAuth), Postgres (with RLS), and Realtime. Single client in `src/lib/supabase.ts`. Database schema in `supabase/schema.sql`.

**Imports**: `@/` alias maps to `src/` (configured in vite.config.ts and tsconfig.app.json).

## Key Patterns

- **Optimistic updates**: `optimisticToggle(id)` dispatched synchronously before async `toggleTodo` thunk. Auto-reverts on `toggleTodo.rejected`.
- **Realtime**: `useRealtimeSubscription(listId)` subscribes to Supabase postgres_changes on `todos` table, dispatches `realtimeUpsert`/`realtimeDelete` into Redux.
- **Fuzzy search**: `useSearch` hook wraps Fuse.js (threshold 0.4, ignoreLocation). AddTodoInput hidden while searching.
- **RLS recursion fix**: `list_shares` policies use `SECURITY DEFINER` helper functions (`is_list_owner`, `has_list_access`) to avoid infinite recursion between `lists` and `list_shares` policies.
- **Auto-triggers**: `handle_new_user()` creates profile on signup, `set_list_owner()` sets owner_id on list insert, `update_updated_at()` maintains timestamps.
- **Sharing**: Lookup by email against `profiles` table — invitee must have signed in at least once.
- **Class merging**: Use `cn()` from `@/lib/utils` for conditional Tailwind classes.

## Database Tables

`profiles` (id, email, display_name, avatar_url) · `lists` (id, name, owner_id) · `list_shares` (list_id, shared_with_id) · `todos` (id, list_id, text, is_completed, completed_at, sort_order)
