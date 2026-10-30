// GET /api/auth/callback -> exchange code, verify user, set session cookie
async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  const allowedUser = (env.ALLOWED_GITHUB_USER || "").toLowerCase();
  const sessionSecret = env.SESSION_SECRET;
  if (!clientId || !clientSecret || !sessionSecret) {
    return new Response("Auth not configured (missing secrets)", { status: 500 });
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return new Response("Token exchange failed: " + (tokenData.error_description || tokenData.error || "unknown"), { status: 400 });
  }

  // Fetch user info
  const userRes = await fetch("https://api.github.com/user", {
    headers: { "Authorization": `Bearer ${tokenData.access_token}`, "Accept": "application/vnd.github+json", "User-Agent": "yamal-admin" },
  });
  const user = await userRes.json();
  if (!user || !user.login) {
    return new Response("Failed to fetch user", { status: 400 });
  }
  if (allowedUser && user.login.toLowerCase() !== allowedUser && String(user.id) !== allowedUser) {
    return new Response("Access denied: GitHub user '" + user.login + "' is not allowed.", { status: 403 });
  }

  // Create session cookie (expires in 24h)
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const payload = btoa(JSON.stringify({ u: user.login, id: user.id, exp })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const sig = await hmacSign(sessionSecret, payload);
  const cookie = `ys_session=${payload}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`;

  return new Response(null, {
    status: 302,
    headers: { "Location": "/admin/", "Set-Cookie": cookie },
  });
}
