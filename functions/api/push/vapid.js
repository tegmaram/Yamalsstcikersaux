// GET /api/push/vapid -> returns VAPID public key
export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({ publicKey: env.VAPID_PUBLIC_KEY || null }), {
    headers: { "Content-Type": "application/json" },
  });
}
