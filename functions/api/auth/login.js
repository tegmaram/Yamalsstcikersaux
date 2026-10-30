// GET /api/auth/login -> redirect to GitHub OAuth
export async function onRequestGet({ request, env }) {
  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response("GITHUB_CLIENT_ID not configured", { status: 500 });
  }
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/callback`;
  const state = crypto.randomUUID();
  const ghUrl = new URL("https://github.com/login/oauth/authorize");
  ghUrl.searchParams.set("client_id", clientId);
  ghUrl.searchParams.set("redirect_uri", redirectUri);
  ghUrl.searchParams.set("scope", "read:user");
  ghUrl.searchParams.set("state", state);
  return Response.redirect(ghUrl.toString(), 302);
}
