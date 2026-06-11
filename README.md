# کاویان — پیش‌بینی جام جهانی ۲۰۲۶

Persian-first World Cup 2026 prediction site for Kavian. Supports **fa / en / ar**, RTL/LTR, safe monetization (no gambling).

## Features

- Multi-language UI: `/fa`, `/en`, `/ar`
- RTL for Persian & Arabic, LTR for English
- Fixtures, predictions, leaderboard
- SMS OTP login via Samantel (phone verification)
- Admin: matches, predictions, **language overrides**, **tournaments**, **ads & prizes**, **payment settings placeholder**
- Free & VIP prediction tournaments (skill-based, sponsored prizes only)
- SQLite + Prisma for MVP

## Local setup

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

Open [http://localhost:3000/fa](http://localhost:3000/fa) (auto-redirects from `/`).

## Admin login

- **Phone:** `09120000000` (OTP via SMS)
- **Local dev:** set `OTP_DEV_BYPASS=true` and use code `123456` (bypass affects **verify only**; SMS is still sent when `OTP_ENABLED=true`)
- **Debug SMS:** open `/{locale}/admin/otp` to inspect `providerStatus` and `serverId`

## OTP environment variables

```env
SAMANTEL_SMS_USERNAME=
SAMANTEL_SMS_PASSWORD=
SAMANTEL_SMS_SENDER=
OTP_ENABLED=true
OTP_DEV_BYPASS=false
```

## Scoring

| Result | Points |
|--------|--------|
| Exact score | 5 |
| Correct outcome | 2 |
| Wrong | 0 |

## Routes

| Page | Path |
|------|------|
| Home | `/fa`, `/en`, `/ar` |
| Fixtures | `/{locale}/fixtures` |
| Predict | `/{locale}/predict` |
| Leaderboard | `/{locale}/leaderboard` |
| Tournaments | `/{locale}/tournaments` |
| Admin | `/{locale}/admin` |

## Monetization (safe)

- **VIP tournaments** — membership gate only, no wagering
- **Sponsored prizes** — rank-based rewards from sponsors
- **Ad banners** — admin-managed placements
- **Payment settings** — database placeholder, no real gateway in v1

## Deploy (Vercel)

Set `DATABASE_URL` and `SESSION_SECRET`. For production persistence on Vercel, use [Turso](https://turso.tech) (free tier) instead of file SQLite.

## Scripts

```bash
npm run dev
npm run build
npm run db:setup
npm run lint
```
