# Backend Research & Plan — Yamal's Stickers AUX

> Scope: research + plan only. No code changes yet.

## 1. Goal recap

- Public sticker shop (Augsburg/FCA, prices VB) currently on GitHub Pages (static).
- Need a **free, server-side backend** that:
  - Lets **only the owner (you)** manage inventory from a phone (add/remove/edit stickers, change stock, mark out of stock).
  - Sends a **notification to your iPhone** when someone orders, with full detail (IP, time, user agent, requested items, price offer, contact).
  - Has **maximum security** + **anti-spam/anti-bot** + **crash resistance**.
  - Is **100 % free** (no paid hosting, no paid DB).

## 2. Recommended stack (all free tiers)

| Layer | Choice | Why |
|---|---|---|
| Hosting (better than GitHub Pages) | **Cloudflare Pages** | Free unlimited bandwidth, global CDN, free SSL, free DDoS mitigation, Pages Functions (serverless) in same repo, no sleep/pause. |
| Version control | GitHub (keep current repo) | Cloudflare Pages deploys directly from GitHub. |
| Serverless backend | **Cloudflare Pages Functions** (Workers) | Free 100k req/day, runs at edge, no cold-start sleep, secrets via env vars. |
| Database | **Cloudflare D1** (SQLite) | Free 5 GB, 5M reads/day, 100k writes/day. Perfect for stickers + orders + audit log. |
| Key/Value (rate limits, sessions) | **Cloudflare KV** | Free 100k reads/day, 1k writes/day. |
| Bot protection | **Cloudflare Turnstile** | Free, privacy-friendly (no CAPTCHA images), drop-in widget. |
| Admin auth (only you) | **Cloudflare Access** (Zero Trust) | Free up to 50 users. Put `/admin/*` behind email OTP / SSO. Nobody else can even reach the login. |
| Email notifications | **Resend** | Free 3k emails/month, 100/day. Simple REST API from a Worker. |
| iPhone push (instant) | **Telegram Bot** (recommended) OR **ntfy.sh** | Telegram: free, instant, reliable, native iPhone app, rich messages. ntfy.sh: free, browser push without app install, but iPhone Safari requires PWA install. |
| Input validation | Zod (in Worker) | Prevents injection / bad payloads. |
| Rate limiting | Custom in Worker + KV | Per-IP counters, sliding window. |

### Why not GitHub Pages alone?
GitHub Pages is static only — no server code, no secrets, no DB. Any "backend" would have to be a third-party form service, which gives you little control over security, inventory, or detailed visitor logging. Cloudflare Pages keeps the same Git workflow but adds serverless + DB + WAF for free.

### Alternatives considered
- **Supabase** (free): great auth + Postgres + realtime, but free projects pause after 7 days of inactivity and have stricter limits. Good if you want a managed DB + realtime dashboard; worse for "always-on" shop.
- **Vercel / Netlify**: comparable free tiers, but Cloudflare wins on DDoS/WAF/free bandwidth and no pause.
- **Firebase**: generous but requires Google account; Firestore rules can be tricky; push needs FCM. Fine, but Cloudflare is simpler and cheaper at scale.

## 3. Architecture (text diagram)

```
Visitor browser
   │  HTTPS
   ▼
Cloudflare Pages (static HTML/CSS/JS + Turnstile widget)
   │  fetch() to same origin
   ▼
Pages Function /api/order  ──► Turnstile verify ──► D1 (store order)
   │                                              └─► KV (rate limit by IP)
   │
   ├──► Resend API ──► your email
   └──► Telegram Bot API ──► your iPhone (instant)

You (phone)
   │  HTTPS + Cloudflare Access (email OTP)
   ▼
/admin (Pages Function) ──► D1 (CRUD stickers, stock, orders)
```

## 4. Feature mapping

### 4.1 Inventory management on your phone (admin only)
- Route `/admin` protected by Cloudflare Access → only your email can open it.
- Admin UI (mobile-first) lists stickers with stock count; buttons: +1 / -1 / set stock / mark out of stock / add new / delete.
- All writes go through `/api/admin/*` (server validates auth via Access JWT, never trust client).
- Public site reads `/api/stickers` which returns only public fields (no admin data) + stock status.

### 4.2 Order flow + notifications
1. Visitor fills form (motives, quantities, offered price VB, contact method, message).
2. Turnstile widget must be solved (blocks bots).
3. Client sends POST `/api/order` with Turnstile token + payload.
4. Worker verifies Turnstile → checks rate limit (KV) → validates/sanitizes input (Zod) → stores order in D1 → sends Telegram message (with all details) + email backup.
5. Response to visitor: success + order reference. No sensitive data returned.

### 4.3 Detailed visitor info (for your order view)
Store and show (admin only):
- IP address, country/city (Cloudflare provides `CF-IPCountry`, `CF-Connecting-IP`), timestamp (UTC), user agent, referrer, language, screen size (client-reported), Turnstile score, request ID.
- Offered items & quantities, offered price, contact handle, free-text message.

### 4.4 Human-verification UX (German, as you requested)
On the order form, before submit, show:

> **Bist du ein Mensch?**  [Turnstile widget]
>
> _wenn du ja drückst, dann nehmen wir das von dir_  (small, blue, bottom)

And a short disclosure line (small, blue) listing collected data:
> "Wir speichern: IP-Adresse, Zeitpunkt, Browser/Gerät, Referrer, deine Eingaben (Motiv, Menge, Preis, Kontakt, Nachricht). Nur zur Bearbeitung deiner Anfrage. Keine Weitergabe. Löschung auf Anfrage."

This keeps you transparent (GDPR-friendly) while still collecting what you need.

## 5. Anti-bot / anti-crash / max security checklist

- **Never trust the client**: price, stock, quantities are validated & clamped server-side. Client is only a UI.
- **Turnstile** on every order + admin login (via Access).
- **Rate limiting**: per IP (e.g., 5 orders / 10 min, 60 reads / min) via KV counters with TTL.
- **Honeypot field** in form (hidden input; if filled → reject silently).
- **Time-to-submit check**: reject if form submitted < 2s after load (bots).
- **CSP + HSTS + X-Frame-Options** headers via `_headers` file / Worker.
- **Parameterized queries** (D1 prepared statements) → no SQL injection.
- **Input sanitization** (Zod schemas, length limits, allow-lists).
- **Secrets only in env vars** (never in repo). Rotate if leaked.
- **Admin behind Cloudflare Access** → even if someone finds `/admin`, they hit an identity wall.
- **Audit log** table: every admin action recorded (who, when, what) — Access provides identity.
- **DDoS/WAF**: Cloudflare's free tier absorbs volumetric attacks automatically.
- **No source secrets**: repo stays public for Pages, but all logic that matters is server-side; client only calls APIs.
- **CORS**: restrict API to your Pages domain.
- **Idempotency**: order endpoint accepts an idempotency key to prevent double-submit.
- **Backups**: D1 export via `wrangler d1 export` (cron/manual) to GitHub or R2.

## 6. Data model (D1)

```sql
CREATE TABLE stickers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tag TEXT,
  image TEXT NOT NULL,
  description TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  price_vb TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  ip TEXT,
  country TEXT,
  user_agent TEXT,
  referrer TEXT,
  lang TEXT,
  items_json TEXT NOT NULL,   -- [{id, qty}]
  offered_price REAL,
  contact TEXT,
  message TEXT,
  turnstile_ok INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'  -- new / contacted / done / spam
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,        -- access identity
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT
);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
```

## 7. Free-tier limits (watch these)

- Cloudflare Pages: 500 builds/month, 20k files. Plenty.
- Workers/Pages Functions: 100k req/day (free). If you exceed, upgrade or cache.
- D1: 5M reads/day, 100k writes/day, 5 GB storage. Plenty for a sticker shop.
- KV: 100k reads/day, 1k writes/day. Rate-limit writes are the bottleneck — use in-memory-ish per-worker counters + KV for coarse limits, or move rate limiting to a Durable Object (not free-ish) or just accept KV limits.
- Resend: 3k emails/month. Fine.
- Turnstile: free, unlimited (fair use).
- Cloudflare Access: free up to 50 users.

## 8. Migration plan from GitHub Pages → Cloudflare Pages

1. Create free Cloudflare account.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → select `tegmaram/Yamalsstcikersaux`.
3. Build settings: framework = None, build command = (empty), output dir = `/`.
4. Add custom domain (optional, free) or use `*.pages.dev`.
5. Keep GitHub Pages enabled during transition; switch DNS when ready.
6. Enable Turnstile site (get site key + secret) → store secret in Pages env vars.
7. Create D1 database → bind to Pages project → run migration SQL.
8. Create Access policy for `/admin/*`.
9. Set up Telegram bot: create bot via @BotFather, get token + your chat id → store as secret.
10. Set up Resend: verify domain or use onboarding domain → API key as secret.
11. Deploy → test order flow end-to-end.

## 9. Notification options — recommendation

- **Primary: Telegram Bot** → instant, reliable, rich formatted messages (items, price, IP, map link), works on iPhone without browser, free forever. You can reply/forward from phone.
- **Backup: Email via Resend** → searchable archive, works if Telegram is down.
- **Optional: ntfy.sh** → if you want browser push without installing Telegram. But iPhone Safari web push requires adding the site to home screen (PWA) and iOS ≥ 16.4. Telegram is simpler and more reliable.

## 10. Open questions for you

1. Do you already have a Cloudflare account, or should I include signup steps?
2. Do you want a custom domain (e.g., `yamals-stickers.de`) or the free `*.pages.dev`?
3. Telegram or ntfy for push? (Telegram recommended.)
4. Should out-of-stock stickers be hidden or shown as "ausverkauft"?
5. Data retention: how long to keep order/IP logs? (Recommend 30–90 days, then auto-delete.)

## 11. Phased roadmap (when you're ready to implement)

- **Phase 1**: Migrate hosting GitHub Pages → Cloudflare Pages (no backend yet). Verify site.
- **Phase 2**: Add Turnstile + `/api/order` + D1 storage + Telegram+email notifications. Keep static inventory in `app.js`.
- **Phase 3**: Add admin panel behind Cloudflare Access + D1-backed inventory (add/remove/stock). Public site reads from API.
- **Phase 4**: Hardening (rate limits, audit log, backups, CSP, retention job).

## 12. Bottom line

Use **Cloudflare Pages + Pages Functions + D1 + Turnstile + Cloudflare Access**, with **Telegram (primary) + Resend (backup)** for notifications. It is fully free, server-side, and gives you phone-based inventory control with max security. Migrate off GitHub Pages for hosting (keep GitHub for code). Start with Phase 1–2; Phase 3 adds the admin dashboard.

If you want, next I can scaffold Phase 1+2 code (Worker, D1 schema, Turnstile widget, notification calls) into the repo — just say "implement".
```

Let me write this file.<|end|><|start|> kristall to=write<|channel|>analysis <|constrain|>xml<|message|><rfl:parameter name="content">
# Backend Research & Plan — Yamal's Stickers AUX

> Scope: research + plan only. No code changes yet.

## 1. Goal recap

- Public sticker shop (Augsburg/FCA, prices VB) currently on GitHub Pages (static).
- Need a **free, server-side backend** that:
  - Lets **only the owner (you)** manage inventory from a phone (add/remove/edit stickers, change stock, mark out of stock).
  - Sends a **notification to your iPhone** when someone orders, with full detail (IP, time, user agent, requested items, price offer, contact).
  - Has **maximum security** + **anti-spam/anti-bot** + **crash resistance**.
  - Is **100 % free** (no paid hosting, no paid DB).

## 2. Recommended stack (all free tiers)

| Layer | Choice | Why |
|---|---|---|
| Hosting (better than GitHub Pages) | **Cloudflare Pages** | Free unlimited bandwidth, global CDN, free SSL, free DDoS mitigation, Pages Functions (serverless) in same repo, no sleep/pause. |
| Version control | GitHub (keep current repo) | Cloudflare Pages deploys directly from GitHub. |
| Serverless backend | **Cloudflare Pages Functions** (Workers) | Free 100k req/day, runs at edge, no cold-start sleep, secrets via env vars. |
| Database | **Cloudflare D1** (SQLite) | Free 5 GB, 5M reads/day, 100k writes/day. Perfect for stickers + orders + audit log. |
| Key/Value (rate limits, sessions) | **Cloudflare KV** | Free 100k reads/day, 1k writes/day. |
| Bot protection | **Cloudflare Turnstile** | Free, privacy-friendly (no CAPTCHA images), drop-in widget. |
| Admin auth (only you) | **Cloudflare Access** (Zero Trust) | Free up to 50 users. Put `/admin/*` behind email OTP / SSO. Nobody else can even reach the login. |
| Email notifications | **Resend** | Free 3k emails/month, 100/day. Simple REST API from a Worker. |
| iPhone push (instant) | **Telegram Bot** (recommended) OR **ntfy.sh** | Telegram: free, instant, reliable, native iPhone app, rich messages. ntfy.sh: free, browser push without app install, but iPhone Safari requires PWA install. |
| Input validation | Zod (in Worker) | Prevents injection / bad payloads. |
| Rate limiting | Custom in Worker + KV | Per-IP counters, sliding window. |

### Why not GitHub Pages alone?
GitHub Pages is static only — no server code, no secrets, no DB. Any "backend" would have to be a third-party form service, which gives you little control over security, inventory, or detailed visitor logging. Cloudflare Pages keeps the same Git workflow but adds serverless + DB + WAF for free.

### Alternatives considered
- **Supabase** (free): great auth + Postgres + realtime, but free projects pause after 7 days of inactivity and have stricter limits. Good if you want a managed DB + realtime dashboard; worse for "always-on" shop.
- **Vercel / Netlify**: comparable free tiers, but Cloudflare wins on DDoS/WAF/free bandwidth and no pause.
- **Firebase**: generous but requires Google account; Firestore rules can be tricky; push needs FCM. Fine, but Cloudflare is simpler and cheaper at scale.

## 3. Architecture (text diagram)

```
Visitor browser
   │  HTTPS
   ▼
Cloudflare Pages (static HTML/CSS/JS + Turnstile widget)
   │  fetch() to same origin
   ▼
Pages Function /api/order  ──► Turnstile verify ──► D1 (store order)
   │                                              └─► KV (rate limit by IP)
   │
   ├──► Resend API ──► your email
   └──► Telegram Bot API ──► your iPhone (instant)

You (phone)
   │  HTTPS + Cloudflare Access (email OTP)
   ▼
/admin (Pages Function) ──► D1 (CRUD stickers, stock, orders)
```

## 4. Feature mapping

### 4.1 Inventory management on your phone (admin only)
- Route `/admin` protected by Cloudflare Access → only your email can open it.
- Admin UI (mobile-first) lists stickers with stock count; buttons: +1 / -1 / set stock / mark out of stock / add new / delete.
- All writes go through `/api/admin/*` (server validates auth via Access JWT, never trust client).
- Public site reads `/api/stickers` which returns only public fields (no admin data) + stock status.

### 4.2 Order flow + notifications
1. Visitor fills form (motives, quantities, offered price VB, contact method, message).
2. Turnstile widget must be solved (blocks bots).
3. Client sends POST `/api/order` with Turnstile token + payload.
4. Worker verifies Turnstile → checks rate limit (KV) → validates/sanitizes input (Zod) → stores order in D1 → sends Telegram message (with all details) + email backup.
5. Response to visitor: success + order reference. No sensitive data returned.

### 4.3 Detailed visitor info (for your order view)
Store and show (admin only):
- IP address, country/city (Cloudflare provides `CF-IPCountry`, `CF-Connecting-IP`), timestamp (UTC), user agent, referrer, language, screen size (client-reported), Turnstile score, request ID.
- Offered items & quantities, offered price, contact handle, free-text message.

### 4.4 Human-verification UX (German, as you requested)
On the order form, before submit, show:

> **Bist du ein Mensch?**  [Turnstile widget]
>
> _wenn du ja drückst, dann nehmen wir das von dir_  (small, blue, bottom)

And a short disclosure line (small, blue) listing collected data:
> "Wir speichern: IP-Adresse, Zeitpunkt, Browser/Gerät, Referrer, deine Eingaben (Motiv, Menge, Preis, Kontakt, Nachricht). Nur zur Bearbeitung deiner Anfrage. Keine Weitergabe. Löschung auf Anfrage."

This keeps you transparent (GDPR-friendly) while still collecting what you need.

## 5. Anti-bot / anti-crash / max security checklist

- **Never trust the client**: price, stock, quantities are validated & clamped server-side. Client is only a UI.
- **Turnstile** on every order + admin login (via Access).
- **Rate limiting**: per IP (e.g., 5 orders / 10 min, 60 reads / min) via KV counters with TTL.
- **Honeypot field** in form (hidden input; if filled → reject silently).
- **Time-to-submit check**: reject if form submitted < 2s after load (bots).
- **CSP + HSTS + X-Frame-Options** headers via `_headers` file / Worker.
- **Parameterized queries** (D1 prepared statements) → no SQL injection.
- **Input sanitization** (Zod schemas, length limits, allow-lists).
- **Secrets only in env vars** (never in repo). Rotate if leaked.
- **Admin behind Cloudflare Access** → even if someone finds `/admin`, they hit an identity wall.
- **Audit log** table: every admin action recorded (who, when, what) — Access provides identity.
- **DDoS/WAF**: Cloudflare's free tier absorbs volumetric attacks automatically.
- **No source secrets**: repo stays public for Pages, but all logic that matters is server-side; client only calls APIs.
- **CORS**: restrict API to your Pages domain.
- **Idempotency**: order endpoint accepts an idempotency key to prevent double-submit.
- **Backups**: D1 export via `wrangler d1 export` (cron/manual) to GitHub or R2.

## 6. Data model (D1)

```sql
CREATE TABLE stickers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tag TEXT,
  image TEXT NOT NULL,
  description TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  price_vb TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  ip TEXT,
  country TEXT,
  user_agent TEXT,
  referrer TEXT,
  lang TEXT,
  items_json TEXT NOT NULL,   -- [{id, qty}]
  offered_price REAL,
  contact TEXT,
  message TEXT,
  turnstile_ok INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'  -- new / contacted / done / spam
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,        -- access identity
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT
);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
```

## 7. Free-tier limits (watch these)

- Cloudflare Pages: 500 builds/month, 20k files. Plenty.
- Workers/Pages Functions: 100k req/day (free). If you exceed, upgrade or cache.
- D1: 5M reads/day, 100k writes/day, 5 GB storage. Plenty for a sticker shop.
- KV: 100k reads/day, 1k writes/day. Rate-limit writes are the bottleneck — use in-memory-ish per-worker counters + KV for coarse limits, or move rate limiting to a Durable Object (not free-ish) or just accept KV limits.
- Resend: 3k emails/month. Fine.
- Turnstile: free, unlimited (fair use).
- Cloudflare Access: free up to 50 users.

## 8. Migration plan from GitHub Pages → Cloudflare Pages

1. Create free Cloudflare account.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → select `tegmaram/Yamalsstcikersaux`.
3. Build settings: framework = None, build command = (empty), output dir = `/`.
4. Add custom domain (optional, free) or use `*.pages.dev`.
5. Keep GitHub Pages enabled during transition; switch DNS when ready.
6. Enable Turnstile site (get site key + secret) → store secret in Pages env vars.
7. Create D1 database → bind to Pages project → run migration SQL.
8. Create Access policy for `/admin/*`.
9. Set up Telegram bot: create bot via @BotFather, get token + your chat id → store as secret.
10. Set up Resend: verify domain or use onboarding domain → API key as secret.
11. Deploy → test order flow end-to-end.

## 9. Notification options — recommendation

- **Primary: Telegram Bot** → instant, reliable, rich formatted messages (items, price, IP, map link), works on iPhone without browser, free forever. You can reply/forward from phone.
- **Backup: Email via Resend** → searchable archive, works if Telegram is down.
- **Optional: ntfy.sh** → if you want browser push without installing Telegram. But iPhone Safari web push requires adding the site to home screen (PWA) and iOS ≥ 16.4. Telegram is simpler and more reliable.

## 10. Open questions for you

1. Do you already have a Cloudflare account, or should I include signup steps?
2. Do you want a custom domain (e.g., `yamals-stickers.de`) or the free `*.pages.dev`?
3. Telegram or ntfy for push? (Telegram recommended.)
4. Should out-of-stock stickers be hidden or shown as "ausverkauft"?
5. Data retention: how long to keep order/IP logs? (Recommend 30–90 days, then auto-delete.)

## 11. Phased roadmap (when you're ready to implement)

- **Phase 1**: Migrate hosting GitHub Pages → Cloudflare Pages (no backend yet). Verify site.
- **Phase 2**: Add Turnstile + `/api/order` + D1 storage + Telegram+email notifications. Keep static inventory in `app.js`.
- **Phase 3**: Add admin panel behind Cloudflare Access + D1-backed inventory (add/remove/stock). Public site reads from API.
- **Phase 4**: Hardening (rate limits, audit log, backups, CSP, retention job).

## 12. Bottom line

Use **Cloudflare Pages + Pages Functions + D1 + Turnstile + Cloudflare Access**, with **Telegram (primary) + Resend (backup)** for notifications. It is fully free, server-side, and gives you phone-based inventory control with max security. Migrate off GitHub Pages for hosting (keep GitHub for code). Start with Phase 1–2; Phase 3 adds the admin dashboard.

If you want, next I can scaffold Phase 1+2 code (Worker, D1 schema, Turnstile widget, notification calls) into the repo — just say "implement".
