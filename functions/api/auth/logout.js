// GET /api/auth/logout -> clear session cookie
export async function onRequestGet() {
  return new Response(null, {
    status: 302,
    headers: { "Location": "/admin/", "Set-Cookie": "ys_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" },
  });
}
