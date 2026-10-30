// /api/admin/orders  (protected by Cloudflare Access)
function isAuthorized(request, env) {
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (jwt) return true;
  const token = request.headers.get("X-Admin-Token");
  if (env.ADMIN_TOKEN && token && token === env.ADMIN_TOKEN) return true;
  return false;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequest({ request, env }) {
  if (!isAuthorized(request, env)) return json({ error: "unauthorized" }, 401);

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
