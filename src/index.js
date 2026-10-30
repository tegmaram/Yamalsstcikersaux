import * as stickersMod from "../functions/api/stickers.js";
import * as orderMod from "../functions/api/order.js";
import * as adminStickersMod from "../functions/api/admin/stickers.js";
import * as adminOrdersMod from "../functions/api/admin/orders.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    const ctxObj = { request, env, ctx };

    if (path === "/api/stickers") {
      if (method === "GET" && stickersMod.onRequestGet) return stickersMod.onRequestGet(ctxObj);
      if (stickersMod.onRequest) return stickersMod.onRequest(ctxObj);
    }
    if (path === "/api/order") {
      if (method === "POST" && orderMod.onRequestPost) return orderMod.onRequestPost(ctxObj);
      if (method === "OPTIONS" && orderMod.onRequestOptions) return orderMod.onRequestOptions(ctxObj);
      if (orderMod.onRequest) return orderMod.onRequest(ctxObj);
    }
    if (path === "/api/admin/stickers") {
      if (adminStickersMod.onRequest) return adminStickersMod.onRequest(ctxObj);
    }
    if (path === "/api/admin/orders") {
      if (adminOrdersMod.onRequest) return adminOrdersMod.onRequest(ctxObj);
    }

    return env.ASSETS.fetch(request);
  },
};
