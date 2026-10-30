import * as stickersMod from "../functions/api/stickers.js";
import * as orderMod from "../functions/api/order.js";
import * as adminStickersMod from "../functions/api/admin/stickers.js";
import * as adminOrdersMod from "../functions/api/admin/orders.js";
import * as adminPushMod from "../functions/api/admin/push.js";
import * as adminTestOrderMod from "../functions/api/admin/test-order.js";
import * as pushVapidMod from "../functions/api/push/vapid.js";
import * as authLoginMod from "../functions/api/auth/login.js";
import * as authCallbackMod from "../functions/api/auth/callback.js";
import * as authLogoutMod from "../functions/api/auth/logout.js";

async function hmacVerify(secret, data, sig) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  // base64url -> bytes
  const b64 = sig.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (sig.length % 4)) % 4);
  const raw = atob(b64);
  const sigBytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) sigBytes[i] = raw.charCodeAt(i);
  return crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(data));
}

async function getSessionUser(request, env) {
  // 1) Session cookie (GitHub OAuth)
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|;\s*)ys_session=([^;]+)/);
  if (m && env.SESSION_SECRET) {
    const val = m[1];
    const parts = val.split(".");
    if (parts.length === 2) {
      const [payload, sig] = parts;
      try {
        const ok = await hmacVerify(env.SESSION_SECRET, payload, sig);
        if (ok) {
          const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (payload.length % 4)) % 4)));
          if (json.exp && json.exp > Date.now()) return json.u || null;
        }
      } catch (e) {}
    }
  }
  // 2) Fallback: admin token
  const token = request.headers.get("X-Admin-Token");
  if (env.ADMIN_TOKEN && token && token === env.ADMIN_TOKEN) return "token-user";
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();
    const ctxObj = { request, env, ctx };

    // Auth routes
    if (path === "/api/auth/login") return authLoginMod.onRequestGet(ctxObj);
    if (path === "/api/auth/callback") return authCallbackMod.onRequestGet(ctxObj);
    if (path === "/api/auth/logout") return authLogoutMod.onRequestGet(ctxObj);

    // Protect /admin and /api/admin
    const isAdminPage = path === "/admin" || path === "/admin/" || path.startsWith("/admin/");
    const isAdminApi = path.startsWith("/api/admin/");
    if (isAdminPage || isAdminApi) {
      const user = await getSessionUser(request, env);
      if (!user) {
        if (isAdminPage) return Response.redirect(new URL("/api/auth/login", request.url).toString(), 302);
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
    }

    // API routing
    if (path === "/api/stickers") {
      if (method === "GET" && stickersMod.onRequestGet) return stickersMod.onRequestGet(ctxObj);
      if (stickersMod.onRequest) return stickersMod.onRequest(ctxObj);
    }
    if (path === "/api/order") {
      if (method === "POST" && orderMod.onRequestPost) return orderMod.onRequestPost(ctxObj);
      if (method === "OPTIONS" && orderMod.onRequestOptions) return orderMod.onRequestOptions(ctxObj);
      if (orderMod.onRequest) return orderMod.onRequest(ctxObj);
    }
    if (path === "/api/push/vapid") {
      if (method === "GET" && pushVapidMod.onRequestGet) return pushVapidMod.onRequestGet(ctxObj);
    }
    if (path === "/api/admin/stickers") {
      if (adminStickersMod.onRequest) return adminStickersMod.onRequest(ctxObj);
    }
    if (path === "/api/admin/orders") {
      if (adminOrdersMod.onRequest) return adminOrdersMod.onRequest(ctxObj);
    }
    if (path === "/api/admin/push") {
      if (adminPushMod.onRequest) return adminPushMod.onRequest(ctxObj);
    }
    if (path === "/api/admin/test-order") {
      if (adminTestOrderMod.onRequestPost) return adminTestOrderMod.onRequestPost(ctxObj);
    }

    return env.ASSETS.fetch(request);
  },
};
