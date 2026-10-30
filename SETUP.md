# Setup — Cloudflare (Phase 1+2)

## Secrets (run in project folder)
```powershell
# Telegram (create bot via @BotFather, get token + your chat id)
"YOUR_BOT_TOKEN" | wrangler secret put TELEGRAM_BOT_TOKEN
"YOUR_CHAT_ID"   | wrangler secret put TELEGRAM_CHAT_ID

# Email (Resend) — optional backup
"re_XXXX"        | wrangler secret put RESEND_API_KEY
"you@example.com"| wrangler secret put NOTIFY_EMAIL
```

## Cloudflare Access (admin only you)
Dashboard → Zero Trust → Access → Applications → Add application → Self-hosted:
- Name: Yamal Admin
- Domain: yamalsstickers.elysand123.workers.dev (or your custom domain)
- Path: /admin/* and /api/admin/*
- Policy: Allow → Emails → your email (elysand123@gmail.com)
- (Optional) Add /api/admin/* to same app.

This ensures only you can reach the admin panel and admin API.

## Turnstile
Site key (public, already in index.html): 0x4AAAAAAFs5U0TgpIYQL2kq
Secret: already set as TURNSTILE_SECRET.

## Deploy
```powershell
cd project
wrangler deploy
```

## Custom domain (optional)
Dashboard → Workers & Pages → yamalsstickers → Settings → Domains & Routes → Add custom domain.

## GitHub auto-deploy (optional)
Add a GitHub Action using cloudflare/wrangler-action with CLOUDFLARE_API_TOKEN secret, triggered on push to main. Or keep manual `wrangler deploy`.

## Telegram chat id
Send a message to your bot, then:
https://api.telegram.org/bot<TOKEN>/getUpdates  → read chat.id
