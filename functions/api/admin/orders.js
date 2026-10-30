// /api/admin/orders  (protected by Cloudflare Access)
function isAuthorized(request, env) {
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (jwt) return true;
  const token = request.headers.get("X-Admin-Token");
  if (env.ADMIN_TOKEN && token && timingSafeEqual(token, env.ADMIN_TOKEN)) return true;
  return false;
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function adminRateLimit(env, ip) {
  const key = `rl:admin:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const windowSec = 900;
  const limit = 10;
  const raw = await env.RATE_LIMIT.get(key);
  let entry = raw ? JSON.parse(raw) : null;
  if (!entry || entry.reset_at <= now) entry = { count: 0, reset_at: now + windowSec };
  if (entry.count >= limit) return { ok: false, retryAfter: entry.reset_at - now };
  entry.count += 1;
  await env.RATE_LIMIT.put(key, JSON.stringify(entry), { expirationTtl: windowSec });
  return { ok: true };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequest({ request, env }) {
  if (!isAuthorized(request, env)) {
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const rl = await adminRateLimit(env, ip);
    if (!rl.ok) return json({ error: "rate_limited", retryAfter: rl.retryAfter }, 429);
    return json({ error: "unauthorized" }, 401);
  }

  const url = new URL(request.url);
  if (request.method === "GET") {
    const status = url.searchParams.get("status");
    let query = "SELECT * FROM orders";
    const binds = [];
    if (status) {
      query += " WHERE status = ?";
      binds.push(status);
    }
    query += " ORDER BY created_at DESC LIMIT 200";
    const stmt = env.DB.prepare(query);
    const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
    return json({ orders: results || [] });
  }

  if (request.method === "PATCH") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
    if (!body.id || !body.status) return json({ error: "missing_fields" }, 400);
    const allowed = ["new", "contacted", "done", "spam"];
    if (!allowed.includes(body.status)) return json({ error: "invalid_status" }, 400);
    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?")
      .bind(body.status, body.id)
      .run();
    await env.DB.prepare(
      "INSERT INTO audit_log (at,actor,action,target,detail) VALUES (?,?,?,?,?)"
    )
      .bind(now, "admin", "update_order_status", body.id, body.status)
      .run();
    return json({ ok: true });
  }

  return json({ error: "method_not_allowed" }, 405);
}
