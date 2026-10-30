import webpush from "web-push";

// /api/admin/push  (protected by Cloudflare Access / admin token)
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
export async function onRequest({ request, env }) {
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (!isAuthorized(request, env)) return json({ error: "unauthorized" }, 401);

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

    if (body.action === "test") {
      // send test push to all subscriptions
      if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) return json({ error: "vapid_missing" }, 500);
      const { results } = await env.DB.prepare("SELECT endpoint, p256dh, auth FROM push_subscriptions").all();
      const subs = results || [];
      if (!subs.length) return json({ error: "no_subscriptions" }, 400);
      webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
      const payload = JSON.stringify({ title: "Test-Benachrichtigung", body: "Push funktioniert!", url: "/admin/?tab=orders", orderId: "test" });
      await Promise.allSettled(subs.map(async (s) => {
        try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload); }
        catch (err) { if (err && (err.statusCode === 404 || err.statusCode === 410)) await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(s.endpoint).run(); }
      }));
      return json({ ok: true, sent: subs.length });
    }

    const endpoint = body.endpoint;
    const keys = body.keys || {};
    if (!endpoint || !keys.p256dh || !keys.auth) return json({ error: "invalid_subscription" }, 400);
    const ua = request.headers.get("User-Agent") || "";
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_agent, created_at, last_used)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth, last_used=excluded.last_used`
    ).bind(endpoint, keys.p256dh, keys.auth, ua, now, now).run();
    return json({ ok: true });
  }

  if (request.method === "DELETE") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
    if (!body.endpoint) return json({ error: "missing_endpoint" }, 400);
    await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(body.endpoint).run();
    return json({ ok: true });
  }

  if (request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT id, endpoint, user_agent, created_at, last_used FROM push_subscriptions").all();
    return json({ subscriptions: results || [] });
  }

  return json({ error: "method_not_allowed" }, 405);
}
