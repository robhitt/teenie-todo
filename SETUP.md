# Setup Guide

Step-by-step instructions for configuring all external services. Follow these if setting up from scratch or recreating on a new account.

---

## 1. Supabase

### Create Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**, pick a name and region, set a database password
3. Once created, go to **Settings → API** and copy:
   - **Project URL** (e.g., `https://xxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Run Database Schema
1. Go to **SQL Editor** in the Supabase dashboard
2. Paste the entire contents of `supabase/schema.sql` and click **Run**
3. This creates all tables, triggers, RLS policies, and enables Realtime

### Enable Google Auth Provider
1. Go to **Authentication → Providers → Google**
2. Toggle it **on**
3. Paste in the **Client ID** and **Client Secret** from Google Cloud (see section 2)
4. Note the **Callback URL** shown (you'll need it for Google Cloud):
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```

### Configure Redirect URLs
1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your production URL (e.g., `https://better-todo-seven.vercel.app`)
3. Under **Redirect URLs**, add:
   - `http://localhost:5173` (for local dev)
   - `https://your-vercel-url.vercel.app`
   - `https://your-custom-domain.com` (if applicable)

### Verify Realtime
1. Go to **SQL Editor** and run:
   ```sql
   select * from pg_publication_tables where pubname = 'supabase_realtime';
   ```
2. You should see `todos`, `lists`, and `list_shares` listed
3. If not, run:
   ```sql
   alter publication supabase_realtime add table todos;
   alter publication supabase_realtime add table lists;
   alter publication supabase_realtime add table list_shares;
   ```

---

## 2. Google Cloud (OAuth)

### Create Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account
3. Click the project dropdown (top-left) → **New Project**
4. Name it (e.g., "Better ToDo") → **Create**
5. Make sure it's selected as the active project

### Configure OAuth Consent Screen
1. Left sidebar: **APIs & Services → OAuth consent screen**
2. Choose **External** → **Create**
3. Fill in:
   - App name: `Better ToDo`
   - User support email: your email
   - Developer contact email: your email
4. Click through the remaining steps (no scopes or test users needed)

### Create OAuth Credentials
1. Left sidebar: **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `Better ToDo`
5. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
   ```
6. Click **Create**
7. Copy the **Client ID** and **Client Secret** — paste these into Supabase (section 1, "Enable Google Auth Provider")

### Notes
- Google OAuth is **free**, no billing required
- Your personal Gmail account works fine
- The consent screen will show "unverified app" warning for non-verified apps — this is fine for personal use. Click "Advanced" → "Go to app" to proceed

---

## 3. Vercel (Hosting)

### Import Project
1. Go to [vercel.com](https://vercel.com) and sign in with **GitHub**
2. Click **Add New → Project**
3. Find and **Import** your `better-todo` repo
4. Vercel auto-detects it as a Vite project

### Set Environment Variables
Before clicking Deploy, expand **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_ID.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

### Deploy
1. Click **Deploy**
2. Vercel builds and gives you a URL (e.g., `better-todo-xxxx.vercel.app`)
3. Add this URL to Supabase redirect URLs (section 1, "Configure Redirect URLs")

### Custom Domain (Optional)

#### Vercel Side
1. In Vercel: **Project Settings → Domains**
2. Add your root domain (e.g., `teenietodo.com`)
3. Add `www.teenietodo.com` and choose **redirect www → root**
4. Vercel will show the required DNS records

#### DNS at DreamHost (or other registrar)
1. Log into [panel.dreamhost.com](https://panel.dreamhost.com)
2. Go to **Websites → Manage Websites** → find your domain → click **DNS** tab
3. Delete any existing A records for the root domain
4. **IMPORTANT**: Use the exact DNS values shown on the Vercel domains page (step 4 above), NOT generic values. Vercel assigns project-specific records. They will look something like:
   - **A record**: Host = blank (DreamHost auto-adds `@`), Value = the IP Vercel shows (e.g., `216.198.79.1`)
   - **CNAME record**: Host = `www`, Value = the CNAME Vercel shows (e.g., `d8b87378584e83d3.vercel-dns-017.com.`)
5. Click **Add Record** for each
6. DNS propagation takes 10-30 minutes (up to 48 hours)
7. Go back to Vercel and click **Refresh** on each domain to verify

#### Update Supabase
1. Go to **Authentication → URL Configuration**
2. Change **Site URL** to `https://yourdomain.com`
3. Under **Redirect URLs**, add:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

### Auto-Deploy
Every push to `main` on GitHub automatically triggers a new deployment on Vercel. No manual steps needed.

---

## Local Development

```bash
# Install dependencies
pnpm install

# Create .env.local with your Supabase credentials
cp .env.local.example .env.local
# Edit .env.local with your values

# Start dev server
pnpm dev
# App runs at http://localhost:5173
```

### .env.local format
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```
