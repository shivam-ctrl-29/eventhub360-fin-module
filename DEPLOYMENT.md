# Deploying EventHub360 Finance — Vercel + Render + Neon

Three pieces: **Postgres on Neon** → **NestJS API on Render** → **React frontend on Vercel**.
Do them in this order (each step needs a value from the previous one).

---

## 1. Database — Neon

1. In the [Neon console](https://console.neon.tech), create a project (e.g. `eventhub360`).
2. Open the **SQL Editor**, paste the entire contents of
   [`database/neon_bootstrap.sql`](database/neon_bootstrap.sql), and run it.
   This creates all 14 tables (foundation + finance) **with the sample data**.
3. Copy the **connection string** (Connect → "Connection string", the
   `postgresql://...@...neon.tech/neondb?sslmode=require` one).
   You'll paste it into Render as `DATABASE_URL`.

> Verify: run `SELECT count(*) FROM invoice;` in the SQL editor — should return 8.

## 2. Backend — Render

1. [Render dashboard](https://dashboard.render.com) → **New → Web Service** → connect the
   GitHub repo `shivam-ctrl-29/eventhub360-fin-module`.
2. Settings:
   | Field | Value |
   |---|---|
   | Root Directory | `backend` |
   | Build Command | `npm install --include=dev && npm run build` |
   | Start Command | `npm start` |
   | Instance Type | Free |
3. Environment variables:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from step 1 |
   | `JWT_SECRET` | a long random string (generate a fresh one — don't reuse the dev value) |
   | `JWT_EXPIRES_IN` | `8h` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | leave blank for now — set after step 3 |
4. Deploy. Copy the service URL (e.g. `https://eventhub360-api.onrender.com`).

> Verify: open `https://<your-render-url>/api/fin/dashboard` — should return JSON with real totals.

## 3. Frontend — Vercel

1. [Vercel dashboard](https://vercel.com/new) → **Import** the same GitHub repo.
2. Settings:
   | Field | Value |
   |---|---|
   | Root Directory | `frontend` |
   | Framework Preset | Vite (auto-detected) |
3. Environment variable:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | your Render URL, **no trailing slash** (e.g. `https://eventhub360-api.onrender.com`) |
4. Deploy. Copy the production URL (e.g. `https://eventhub360-fin.vercel.app`).

## 4. Close the loop — CORS

Back in **Render → Environment**, set:

| Key | Value |
|---|---|
| `CORS_ORIGIN` | `https://<your-vercel-url>` (add `,http://localhost:5174` too if you want local dev to hit the hosted API) |

Render redeploys automatically on env change.

## 5. Smoke test

- Open the Vercel URL → login page loads with live snapshot widgets.
- Sign in with `admin@demo.in` / `Admin@123` → dashboard shows ₹ figures.
- Create an expense via Quick Create → appears in the list (proves DB writes work).

## Notes / gotchas

- **Render free tier sleeps** after ~15 min idle; the first request takes ~30–60s to wake.
  The frontend's 15s axios timeout may fail that first request — just retry/refresh.
- **FX rates**: the backend fetches live INR rates from open.er-api.com at runtime (outbound
  HTTPS works on Render free tier).
- **Uploads**: vendor-bill upload stores metadata + filename only (no file storage needed).
- The dump includes the demo login (`admin@demo.in` / `Admin@123`). Change that password for
  anything public: generate a bcrypt hash and `UPDATE user_account SET password_hash=... WHERE email='admin@demo.in';`
