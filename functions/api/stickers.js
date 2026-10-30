export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, title, tag, image, description, stock, price_vb, active FROM stickers WHERE active = 1 ORDER BY created_at ASC"
    ).all();

    const stickers = (results || []).map((r) => ({
      id: r.id,
      title: r.title,
      tag: r.tag,
      image: r.image,
      description: r.description,
      stock: r.stock,
      priceVb: r.price_vb,
      available: r.stock > 0,
    }));

    return new Response(JSON.stringify({ stickers }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "db_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
