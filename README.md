# Treasure Hunt Photo Hunt – Netlify + Supabase

A lightweight React/Vite web app that lets players submit photo proof for each scavenger‑hunt challenge while an admin reviews and approves submissions in real time. Approved photos unlock coins; collecting ten coins opens the final chest.

This repository contains a minimal MVP implementation located in the src folder.

To play, sign in and pick any photo challenge to start. Expand a challenge card
to read its description and hint, then upload your own photo matching the
example. Once your shot is approved you earn a coin — the challenges can be
completed in any order.

---

## 1 Features

- **Email/password authentication** with browser password-manager prompts
- **Role‑based access control** enforced by Supabase Row Level Security
- **Image uploads** stored privately in Supabase Storage
- **Real‑time updates**: players see status changes instantly
- **Admin dashboard** to accept/decline photos and adjust coin counts
- **Coin counter** per player, persisted in Postgres
- Deploys as a **static site** on Netlify; no server maintenance

---

## 2 Tech Stack

| Layer       | Choice                                       |
| ----------- | -------------------------------------------- |
| Front‑end   | React + Vite, Tailwind CSS                   |
| Auth & DB   | Supabase (Postgres, RLS, Storage)            |
| Hosting     | Netlify (build & CDN)                        |
| State hooks | @supabase/supabase‑js v2                     |
| Utility     | UUID v4 for file names, shadcn/ui components |

---

## 3 Local Quick‑Start

### 3.1 Prerequisites

- Node ≥ 18
- Supabase CLI ≥ 1.0 (optional but handy)
- A free Supabase project
- GitHub account linked to Netlify

### 3.2 Clone & Install

```bash
git clone https://github.com/your‑org/treasure‑hunt.git
cd treasure‑hunt
npm install
```

### 3.3 Environment Variables

Create `.env` in the repo root:

```
VITE_SUPABASE_URL=your‑supabase‑url
VITE_SUPABASE_ANON=public‑anon‑key
```

> Netlify will read these keys from *Site → Settings → Environment variables* at deploy time.

---

## 4 Supabase Configuration

### 4.1 Auth

1. Open **Authentication → Settings**.
2. Enable **Email Magic Link**.
3. Add your production URL and `http://localhost:5173` to **Redirect URLs**.
4. Under **Users**, create your own user account and set `app_metadata.role = "admin"`.

### 4.2 Storage

- Create bucket **photos**.
- Keep **Public bucket** **off** (private).
- When retrieving images, generate a temporary link with
  `createSignedUrl` (e.g., 1 hour expiry) instead of `getPublicUrl`.

### 4.3 Database schema

Execute in *SQL Editor*:

```sql
create table challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  hint text,
  example_photo text,
  active boolean default false,
  sort_order int not null
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  challenge_id uuid references challenges(id) on delete cascade,
  photo_url text not null,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  created_at timestamptz default now()
);

create table coins (
  user_id uuid primary key references auth.users on delete cascade,
  count int default 0
);

-- increment helper
create or replace function public.increment_coins(p_user uuid)
returns void language sql as $$
insert into coins (user_id,count)
values (p_user,1)
on conflict (user_id)
  do update set count = coins.count + 1;
$$;
```

### 4.4 Row Level Security (RLS)

```sql
alter table submissions enable row level security;
create policy "Players read own" on submissions
for select using (auth.uid() = user_id);

create policy "Players insert" on submissions
for insert with check (auth.uid() = user_id);

create policy "Admin update" on submissions
for update using (auth.role() = 'authenticated' and (
    auth.jwt() ->> 'app_metadata' ->> 'role' = 'admin'));
```

Repeat analogous policies for `coins`.

---

## 5 Running Locally

```bash
npm run dev
```

- Access `<http://localhost:5173>`.

- `/login` – email/password sign-in
- `/hunt` – player dashboard
- `/admin` – admin dashboard (role‑gated client‑side + RLS‑gated backend)

---

## 6 Deployment (Netlify)

1. Push code to GitHub.
2. In Netlify, click **New Site → Import from Git**.
3. Set **Build command** `npm run build` and **Publish** `dist`.
4. Add the two environment variables from §3.3.
5. Trigger first deploy. Netlify provides a random preview URL; later add a custom domain.

*Optional*: enable **Netlify Identity** if you prefer double‑gating `/admin` at the edge.

---

## 7 Folder Structure

```
├── src
│   ├── components
│   │   ├── UploadPhoto.jsx
│   │   └── AdminTable.jsx
│   ├── pages
│   │   ├── Login.jsx
│   │   ├── Hunt.jsx
│   │   └── Admin.jsx
│   ├── supabaseClient.js
│   ├── hooks
│   └── styles
├── netlify.toml (optional redirects)
└── vite.config.js
```

---

## 8 Admin Workflow

1. Sign in with admin email.
2. Pending submissions appear in a table ordered by `created_at`.
3. Choose **Accept** → status flips to `approved`.
4. Choose **Decline** → status flips to `rejected`; player may re‑submit.

## 9 Player Workflow

1. Sign in with your email and password.
2. Choose any challenge; each card shows an **Upload** input if you haven't submitted yet.
3. After upload, the card turns yellow while pending. Once approved it turns green and you earn a coin.
4. Repeat for the remaining challenges in any order. A table below lists your submissions and their status.

---

## 10 Security Model in Brief

| Vector                    | Mitigation                                                  |
| ------------------------- | ----------------------------------------------------------- |
| Unauthorized photo access | Private bucket + RLS‑filtered public URLs                   |
| Forged admin actions      | Admin role checked client‑side and enforced by RLS policies |
| URL guessing              | UUID filenames + signed download URLs if needed             |

---

## 11 Extending

- **GPS validation**: add `position` column in `submissions`; compare to target lat/lon in SQL.
- **Push notifications**: Supabase Edge Function → Expo push tokens.
- **Leaderboard**: view combining `coins` and fastest times.

---

## 12 Troubleshooting Checklist

| Issue                         | Fix                                                                        |
| ----------------------------- | -------------------------------------------------------------------------- |
| Magic‑link email not received | Verify Auth SMTP configuration or use OTP debug link in Supabase dashboard |
| Photos 0 bytes                | Check Storage bucket rules and MIME type on upload                         |
| RLS denies admin update       | Ensure `app_metadata.role` = `admin` and your JWT includes it              |
| 500 error on login            | Verify `.env` contains valid Supabase keys and your Redirect URLs are allowed |

---

## 13 License

MIT

---

### Built with ♥ for backyard adventures

