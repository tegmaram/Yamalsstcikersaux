// POST /api/order

const OrderSchema = {
  parse(body) {
    if (!body || typeof body !== "object") throw new Error("invalid_body");
    const items = Array.isArray(body.items) ? body.items : null;
    if (!items || items.length === 0 || items.length > 20) throw new Error("invalid_items");
    for (const it of items) {
      if (typeof it.id !== "string" || it.id.length > 64) throw new Error("invalid_item_id");
      if (!Number.isInteger(it.qty) || it.qty < 1 || it.qty > 999) throw new Error("invalid_qty");
    }
    const offeredPrice = body.offeredPrice == null ? null : Number(body.offeredPrice);
    if (offeredPrice !== null && (!isFinite(offeredPrice) || offeredPrice < 0 || offeredPrice > 100000)) throw new Error("invalid_price");
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";
    if (contact.length > 200) throw new Error("invalid_contact");
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (message.length > 2000) throw new Error("invalid_message");
    const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    if (!token) throw new Error("missing_turnstile");
    // honeypot
    if (body.website && String(body.website).trim() !== "") throw new Error("bot");
    // time-to-submit
    const ts = Number(body.formTs);
    if (!isFinite(ts) || Date.now() - ts < 2000) throw new Error("too_fast");
    return { items, offeredPrice, contact, message, token };
  },
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

async function verifyTurnstile(secret, token, ip) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  return data && data.success === true;
}

async function rateLimit(env, ip) {
  const key = `rl:order:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const windowSec = 600; // 10 min
  const limit = 5;
  const raw = await env.RATE_LIMIT.get(key);
  let entry = raw ? JSON.parse(raw) : null;
  if (!entry || entry.reset_at <= now) {
    entry = { count: 0, reset_at: now + windowSec };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfter: entry.reset_at - now };
  }
  entry.count += 1;
  await env.RATE_LIMIT.put(key, JSON.stringify(entry), { expirationTtl: windowSec });
  return { ok: true };
}

async function notifyTelegram(env, order) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  const text = [
    "🛒 *Neue Bestellung*",
    `ID: \`${order.id}\``,
    `Zeit: ${order.created_at}`,
    `IP: ${order.ip} (${order.country || "?"})`,
    `UA: ${order.user_agent}`,
    `Referrer: ${order.referrer || "-"}`,
    `Sprache: ${order.lang || "-"}`,
    `Angebotener Preis: ${order.offered_price == null ? "VB" : order.offered_price + " €"}`,
    `Kontakt: ${order.contact || "-"}`,
    `Nachricht: ${order.message || "-"}`,
    `Artikel: ${JSON.stringify(order.items)}`,
  ].join("\n");
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" }),
  }).catch(() => {});
}

async function notifyEmail(env, order) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Yamal Stickers <onboarding@resend.dev>",
      to: [env.NOTIFY_EMAIL],
      subject: `Neue Bestellung ${order.id}`,
      text: JSON.stringify(order, null, 2),
    }),
  }).catch(() => {});
}

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const country = request.headers.get("CF-IPCountry") || "";
  const ua = request.headers.get("User-Agent") || "";
  const referrer = request.headers.get("Referer") || "";
  const lang = request.headers.get("Accept-Language") || "";

  // rate limit
  const rl = await rateLimit(env, ip);
  if (!rl.ok) {
    return json({ error: "rate_limited", retryAfter: rl.retryAfter }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  let parsed;
  try {
    parsed = OrderSchema.parse(body);
  } catch (e) {
    return json({ error: e.message || "invalid_input" }, 400);
  }

  // verify turnstile
  const ok = await verifyTurnstile(env.TURNSTILE_SECRET, parsed.token, ip);
  if (!ok) {
    return json({ error: "turnstile_failed" }, 400);
  }

  // validate items against DB stock
  const ids = parsed.items.map((i) => i.id);
  const placeholders = ids.map(() => "?").join(",");
  const { results: dbStickers } = await env.DB.prepare(
    `SELECT id, stock, active FROM stickers WHERE id IN (${placeholders})`
  )
    .bind(...ids)
    .all();

  const stockMap = new Map((dbStickers || []).map((s) => [s.id, s]));
  for (const it of parsed.items) {
    const s = stockMap.get(it.id);
    if (!s || s.active !== 1) return json({ error: "unknown_sticker" }, 400);
    if (it.qty > s.stock) return json({ error: "insufficient_stock", id: it.id }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const order = {
    id,
    created_at: now,
    ip,
    country,
    user_agent: ua,
    referrer,
    lang,
    items: parsed.items,
    offered_price: parsed.offeredPrice,
    contact: parsed.contact,
    message: parsed.message,
    turnstile_ok: 1,
  };

  await env.DB.prepare(
    `INSERT INTO orders (id, created_at, ip, country, user_agent, referrer, lang, items_json, offered_price, contact, message, turnstile_ok, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
  )
    .bind(
      id,
      now,
      ip,
      country,
      ua,
      referrer,
      lang,
      JSON.stringify(parsed.items),
      parsed.offeredPrice,
      parsed.contact,
      parsed.message,
      1
    )
    .run();

  // fire-and-forget notifications
  await Promise.allSettled([notifyTelegram(env, order), notifyEmail(env, order)]);

  return json({ ok: true, orderId: id });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
