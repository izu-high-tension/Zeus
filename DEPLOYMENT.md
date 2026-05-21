# PI ANIMALS — Deployment Guide

End-to-end walkthrough for getting **PI ANIMALS** live on the Pi Network ecosystem.

> ⚠️ **There is no "upload to the Pi blockchain."** Pi mainnet only stores Pi coin transactions; it does **not** run smart contracts or host code. Pi apps are normal web apps hosted at a public URL — Pi Browser embeds them and exposes the Pi SDK for auth + payments. The NFT contracts deploy to **Polygon**, separately.

There are four moving pieces. Get them in this order:

1. **Postgres on Supabase** — the database the app talks to.
2. **Vercel deploy** — the public URL your app lives at.
3. **Pi Developer Portal** — the API key + URL registration that lets `Pi.authenticate(...)` and payments work in Pi Browser.
4. **App Studio listing** — the in-app submission that makes PI ANIMALS appear in the Pi ecosystem.

Polygon NFT contracts (step 5) can be deferred until you're ready to mint real NFTs.

---

## 0. Prereqs (one-time)

- A GitHub account.
- Push this repo to GitHub: `gh repo create pi-animals --private --source=. --remote=origin --push` (or via the GitHub web UI).
- A Pi Browser-installed phone.

---

## 1. Supabase (Postgres)

1. Go to https://supabase.com → **New project**. Name: `pi-animals`. Pick a strong DB password (save it — you'll need it).
2. Wait ~2 min for the project to provision.
3. **Project Settings → Database → Connection string → URI**. Copy the **Connection pooling** string (port `6543`, mode `transaction`) for `DATABASE_URL`. Replace `[YOUR-PASSWORD]` with the password you set.
4. Also copy the **direct connection** string (port `5432`) — you'll use it for running migrations.
5. Run the initial migration from your local machine:

   ```bash
   # Use the DIRECT (port 5432) URL for migrations, not the pooled one.
   DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" \
     pnpm --filter web exec prisma migrate deploy
   ```

   You should see: `1 migration found in prisma/migrations. Applying migration 00000000000000_init`.

---

## 2. Vercel (web hosting)

1. Sign up at https://vercel.com with your GitHub account.
2. **Add New… → Project** → import the `pi-animals` repo.
3. **Framework Preset**: Next.js (auto-detected).
4. **Root Directory**: leave at `/` — `vercel.json` handles the monorepo.
5. **Environment Variables** — paste these (copy from `.env.example`, fill in real values):

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_APP_URL` | `https://<your-vercel-domain>` (set after first deploy) |
   | `NEXT_PUBLIC_PI_SANDBOX` | `true` (flip to `false` after mainnet approval) |
   | `PI_API_KEY` | (from step 3 below) |
   | `PI_PLATFORM_API_URL` | `https://api.minepi.com/v2` |
   | `SESSION_PASSWORD` | random 32+ char hex — `openssl rand -hex 32` |
   | `SESSION_COOKIE_NAME` | `pi_animals_session` |
   | `DATABASE_URL` | Supabase **pooled** URI (port 6543) |

   Optional (improves rate limits + ratelimit replicates across regions):
   | Key | Value |
   |---|---|
   | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | from Upstash console |

6. Click **Deploy**. ~2 min later you'll have a URL like `https://pi-animals-abc123.vercel.app`. **Go back to env vars and update `NEXT_PUBLIC_APP_URL`** to that URL, then **Redeploy**.
7. Confirm the landing page loads.

---

## 3. Pi Developer Portal

This is **separate from App Studio**. App Studio submits the listing; the Developer Portal gives you the API credentials.

1. Open **Pi Browser** on your phone.
2. Go to `developers.minepi.com` (also known as the Developer Portal app inside Pi Browser).
3. Sign in with your Pi account.
4. **New App** → fill in:
   - App name: `PI ANIMALS`
   - Description: short tagline
   - URL: your Vercel URL from step 2.6
   - Sandbox URL: same URL (you can use staging later)
   - Categories: Games / NFT
5. After creating the app, open it → **API Key** → **Generate**. Copy the key.
6. Paste it into Vercel as `PI_API_KEY` → Redeploy.
7. Configure **Validation domain** if asked — Vercel auto-provisions HTTPS, so this should pass.

> Mainnet access requires Pi Core Team review (weeks). For now everything runs in **sandbox** — `Pi.init({ sandbox: true })`, Pi testnet, test Pi only. That's already the default.

---

## 4. App Studio listing (the screen in your screenshots)

Once steps 1–3 are done, fill in the App Studio form:

| Field | Value |
|---|---|
| **App Link** | your Vercel URL (e.g. `https://pi-animals.vercel.app`) |
| **App Name** | `PI ANIMALS` |
| **App Description** | `Raise NFT pet dogs and cats on Pi Network. Mine Pet tokens, climb the rarity ladder, trade on the marketplace, and win lottery dividends. Built on Pi + Polygon.` |
| **App Language** | English |
| **Category** | Games (or NFT if available) |
| **Upload Logo** | `branding/logo-1024.png` from this repo (1024×1024, 205 KB) |

Submit. Pi reviews listings — expect 1–7 days.

---

## 5. Polygon NFT contracts (deferred — needed for real minting)

Until you do this, "Mint" payments succeed but no on-chain NFT is created (the `Pet` row stays empty). For MVP-α / sandbox demo, you can skip this. When you're ready:

1. Create a fresh EVM wallet for the deployer (e.g. via MetaMask). **Do not reuse your personal wallet.** Export the private key and put it in `packages/contracts/.env` as `DEPLOYER_PRIVATE_KEY`.
2. Fund it with **Amoy MATIC** (testnet) from https://faucet.polygon.technology to deploy on testnet first.
3. Set `MUMBAI_RPC_URL` (Amoy RPC) in `packages/contracts/.env`. Default works.
4. Get a Polygonscan API key from https://polygonscan.com/myapikey → `POLYGONSCAN_API_KEY`.
5. Deploy:
   ```bash
   pnpm --filter contracts exec hardhat run scripts/deploy.ts --network amoy
   ```
   Note the printed proxy addresses.
6. Verify:
   ```bash
   pnpm --filter contracts exec hardhat verify --network amoy <proxy-address>
   ```
7. Set in Vercel env: `PIPET_DOG_CONTRACT`, `PIPET_CAT_CONTRACT` (rename to `PI_ANIMALS_*` if you prefer; keep consistent with code references).
8. For **mainnet** Polygon, repeat with real MATIC and a Gnosis Safe multisig as `DEFAULT_ADMIN_ROLE` (do **not** keep an EOA as admin in prod).

---

## 6. Smoke test (sandbox)

On your phone, in Pi Browser:

1. Open your app URL.
2. Tap **Login with Pi** → grant `username` + `payments`.
3. Go to `/mint` → tap **Mint with Pi** → confirm in the Pi payment sheet (test Pi).
4. Check Vercel logs → the `/api/payments/approve` and `/complete` endpoints fire in order.
5. Refresh `/vitality` → should show +25.

If any step fails, check Vercel **Functions logs** — the error code (`intent_failed`, `amount_mismatch`, `pi_lookup_failed`, etc.) maps directly to the validation in `apps/web/app/api/payments/*/route.ts`.

---

## 7. Going to mainnet

1. Submit your app for **Pi mainnet** review in the Developer Portal (weeks of review).
2. Flip `NEXT_PUBLIC_PI_SANDBOX=false` in Vercel.
3. Get a new mainnet `PI_API_KEY` and swap it in Vercel.
4. Deploy Polygon contracts to **mainnet** (step 5 with `--network polygon`).
5. Transfer contract `DEFAULT_ADMIN_ROLE` to a Gnosis Safe multisig.
6. Commission a smart-contract audit (CertiK, Trail of Bits, Quantstamp).
7. Set up Sentry (`SENTRY_DSN`), Upstash Redis for ratelimit, BullMQ workers on Railway for mining/dividend/lottery.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Login with Pi` button does nothing in regular Chrome | Pi SDK only loads in Pi Browser | Open in Pi Browser |
| `401 invalid_pi_token` from `/api/auth/pi` | API key wrong or missing | Re-paste `PI_API_KEY` in Vercel, redeploy |
| `409 amount_mismatch` on approve | Client tampered with the amount | Expected — server rejected. Verify the `Pi.createPayment(...)` call passes the **server-supplied** amount from `/intent` |
| Prisma `relation does not exist` | Migration not applied | Re-run `prisma migrate deploy` against the Supabase URL |
| Build fails on Vercel: `Cannot find module '@pianimals/shared'` | pnpm workspace not resolving | Make sure `vercel.json` `installCommand` is `pnpm install --frozen-lockfile` at root |
| `EnforcedPause` on contract | Admin paused | Call `unpause()` via the admin signer |

---

## What you actually submit to "the blockchain"

| Asset | Where it lives |
|---|---|
| App code | Vercel (regular web hosting) |
| User accounts, payments, Pet ledger | Supabase Postgres |
| Pi coin payments (real money flow) | Pi mainnet (handled by Pi Browser, not you) |
| NFT ownership (Dog / Cat tokens) | Polygon (you deploy ERC-721 contracts) |
| App listing | Pi App Studio (a Pi-side database, not blockchain) |

There is no single "upload to Pi blockchain" step — Pi has deliberately moved app distribution off-chain into App Studio.
