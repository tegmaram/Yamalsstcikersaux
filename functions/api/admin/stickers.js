// /api/admin/stickers  (protected by Cloudflare Access)
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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

function requireAccess(request) {
  // kept for compatibility; use isAuthorized instead
  return request.headers.get("Cf-Access-Jwt-Assertion") || request.headers.get("X-Admin-Token");
}

export async function onRequest({ request, env }) {
  if (!isAuthorized(request, env)) {
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const rl = await adminRateLimit(env, ip);
    if (!rl.ok) {
      return json({ error: "rate_limited", retryAfter: rl.retryAfter }, 429);
    }
    return json({ error: "unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM stickers ORDER BY created_at ASC"
    ).all();
    return json({ stickers: results || [] });
  }

  if (method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
    const id = (body.id || "").trim() || crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO stickers (id,title,tag,image,description,stock,price_vb,active,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    )
      .bind(
        id,
        String(body.title || "").trim(),
        body.tag || null,
        String(body.image || "").trim(),
        body.description || null,
        Number.isInteger(body.stock) ? body.stock : 0,
        body.priceVb || body.price_vb || "VB",
        body.active === false ? 0 : 1,
        now,
        now
      )
      .run();
    await env.DB.prepare(
      "INSERT INTO audit_log (at,actor,action,target,detail) VALUES (?,?,?,?,?)"
    )
      .bind(now, "admin", "create_sticker", id, JSON.stringify(body))
      .run();
    return json({ ok: true, id });
  }

  if (method === "PUT") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
    const id = url.searchParams.get("id") || body.id;
    if (!id) return json({ error: "missing_id" }, 400);
    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE stickers SET title=?, tag=?, image=?, description=?, stock=?, price_vb=?, active=?, updated_at=? WHERE id=?`
    )
      .bind(
        String(body.title || "").trim(),
        body.tag || null,
        String(body.image || "").trim(),
        body.description || null,
        Number.isInteger(body.stock) ? body.stock : 0,
        body.priceVb || body.price_vb || "VB",
        body.active === false ? 0 : 1,
        now,
        id
      )
      .run();
    await env.DB.prepare(
      "INSERT INTO audit_log (at,actor,action,target,detail) VALUES (?,?,?,?,?)"
    )
      .bind(now, "admin", "update_sticker", id, JSON.stringify(body))
      .run();
    return json({ ok: true });
  }

  if (method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "missing_id" }, 400);
    const now = new Date().toISOString();
    await env.DB.prepare("DELETE FROM stickers WHERE id = ?").bind(id).run();
    await env.DB.prepare(
      "INSERT INTO audit_log (at,actor,action,target,detail) VALUES (?,?,?,?,?)"
    )
      .bind(now, "admin", "delete_sticker", id, null)
      .run();
    return json({ ok: true });
  }

  if (method === "PATCH") {
    // quick stock adjust: { id, delta } or { id, stock }
    let body;
    try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
    const id = body.id;
    if (!id) return json({ error: "missing_id" }, 400);
    const now = new Date().toISOString();
    if (Number.isInteger(body.stock)) {
      await env.DB.prepare("UPDATE stickers SET stock=?, updated_at=? WHERE id=?")
        .bind(body.stock, now, id)
        .run();
    } else if (Number.isInteger(body.delta)) {
      await env.DB.prepare("UPDATE stickers SET stock = stock + ?, updated_at=? WHERE id=?")
        .bind(body.delta, now, id)
        .run();
    } else {
      return json({ error: "invalid_payload" }, 400);
    }
    await env.DB.prepare(
      "INSERT INTO audit_log (at,actor,action,target,detail) VALUES (?,?,?,?,?)"
    )
      .bind(now, "admin", "adjust_stock", id, JSON.stringify(body))
      .run();
    return json({ ok: true });
  }

  return json({ error: "method_not_allowed" }, 405);
}
