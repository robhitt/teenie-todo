# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Teenie ToDo** — a collaborative todo list app with real-time sync, fuzzy search, and list sharing. Built on React + TypeScript, Vite, Redux Toolkit, Supabase, and Tailwind CSS v4.

## Current Status

All 5 phases complete. Deployed to Vercel at `teenietodo.com` (`better-todo-seven.vercel.app`). Supabase project ID: `ggounpxclsivvkjstcyf`. No test suite — use `pnpm build` to verify type-checking and production build.

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

**UI**: shadcn/ui-style components in `src/components/ui/` (CVA + Radix primitives). Icons from `lucide-react`. Toasts via `sonner` (`<Toaster>` in App.tsx, trigger with `toast()`). Drag-and-drop reordering via `@dnd-kit`.

**Styling**: Tailwind CSS v4 — design tokens (colors, radius) defined in `src/index.css` via `@theme inline` block, no `tailwind.config` file. Uses oklch color space.

**PWA**: `vite-plugin-pwa` with `registerType: 'autoUpdate'` for service worker. Offline banner in `src/components/layout/OfflineBanner.tsx`.

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

## Validation — Fix and Re-check Until Clean

After every change, run the checks below. **If any check fails, fix the issue yourself and re-run until all checks pass. Do not present work to the user until everything passes cleanly.**

1. **Build check**: Run `pnpm build`. It must pass with zero errors (type-check + production build).
2. **Lint check**: Run `pnpm lint`. Fix any warnings or errors introduced by your changes.
3. **UI review**: For visual/layout changes, trace through the component tree and verify the rendered output makes sense — correct classes, responsive behavior (mobile + desktop), conditional rendering, and accessibility (keyboard nav, aria attributes). If something looks wrong, fix it.
4. **Data flow review**: For changes touching Redux or Supabase, read the full path from dispatch → thunk → API call → reducer/state update and confirm the data types, optimistic update logic, and error handling are correct. If something is off, fix it.
5. **Edge cases**: Consider empty states, loading states, error states, and concurrent user scenarios (realtime sync) relevant to the change. If you find a gap, fix it.
