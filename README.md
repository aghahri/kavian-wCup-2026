# کاویان — پیش‌بینی جام جهانی ۲۰۲۶

Persian-first World Cup 2026 prediction site for Kavian. Supports **fa / en / ar**, RTL/LTR, safe monetization (no gambling).

## Features

- Multi-language UI: `/fa`, `/en`, `/ar`
- RTL for Persian & Arabic, LTR for English
- Fixtures, predictions, leaderboard
- SMS OTP login via Samantel (phone verification)
- **Private leagues** — family, friends, school, company (`/{locale}/leagues`, invite `/l/{code}`)
- **Football AI Pulse** — deterministic match analysis (`/{locale}/ai`)
- **Match summary cards** — shareable post-match recap (`/{locale}/matches/[id]/summary`)
- **Referral leaderboard** — invite score, clicks, verified signups (`/{locale}/referrals`)
- **Global fan map** — users by phone country (`/{locale}/fans/map`)
- **Achievements** — badges on profile and leaderboard
- **School competition** — school leagues (`/{locale}/schools`)
- Admin: matches, predictions, **language overrides**, **tournaments**, **ads & prizes**, **leagues**, **fans**
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
| Private leagues | `/{locale}/leagues` |
| AI Pulse | `/{locale}/ai` |
| Fan map | `/{locale}/fans/map` |
| Schools | `/{locale}/schools` |
| Referrals | `/{locale}/referrals` |
| League invite | `/l/{code}` |
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
