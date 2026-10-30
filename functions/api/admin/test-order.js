import webpush from "web-push";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
function isAuthorized(request, env) {
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (jwt) return true;
  const token = request.headers.get("X-Admin-Token");
  if (env.ADMIN_TOKEN && token && token === env.ADMIN_TOKEN) return true;
  return false;
}

export async function onRequestPost({ request, env }) {
  if (!isAuthorized(request, env)) return json({ error: "unauthorized" }, 401);

  const now = new Date().toISOString();
  const id = "test-" + crypto.randomUUID().slice(0, 8);
  const items = [{ id: "la-adler", qty: 2 }, { id: "gruppe-fuggerstadt", qty: 1 }];
  const ip = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
  const country = request.headers.get("CF-IPCountry") || "DE";
  const ua = request.headers.get("User-Agent") || "TestAgent";
  const offeredPrice = 12.5;
  const contact = "test@example.com";
  const message = "TEST ORDER - ignore";

  await env.DB.prepare(
    `INSERT INTO orders (id, created_at, ip, country, user_agent, referrer, lang, items_json, offered_price, contact, message, turnstile_ok, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
  ).bind(id, now, ip, country, ua, "https://test.local", "de", JSON.stringify(items), offeredPrice, contact, message, 1).run();

  // Web Push
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT) {
    try {
      const { results } = await env.DB.prepare("SELECT endpoint, p256dh, auth FROM push_subscriptions").all();
      const subs = results || [];
      if (subs.length) {
        webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
        const payload = JSON.stringify({ title: "Neue Bestellung (TEST)", body: "2x la-adler, 1x gruppe-fuggerstadt · 12.5 € · test@example.com", url: "/admin/?tab=orders", orderId: id });
        await Promise.allSettled(subs.map(async (s) => {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
          } catch (err) {
            if (err && (err.statusCode === 404 || err.statusCode === 410)) {
              await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(s.endpoint).run();
            }
          }
        }));
      }
    } catch (e) {}
  }

  // Email
  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: "Yamal Stickers <onboarding@resend.dev>", to: [env.NOTIFY_EMAIL], subject: `TEST Bestellung ${id}`, text: JSON.stringify({ id, items, offeredPrice, contact, message }, null, 2) }),
    }).catch(() => {});
  }

  return json({ ok: true, orderId: id });
}
