import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { STICKER_MOTIFS, BUNDLE_DEALS, PICKUP_DEPOTS } from '../data/catalog.js';

const VALID_DELIVERY_IDS = new Set(PICKUP_DEPOTS.map((d) => d.id));

export class CatalogStore {
  constructor({ inquiriesFile = null } = {}) {
    this.inquiriesFile = inquiriesFile;
    this.inquiries = this.#loadInquiries();
  }

  #loadInquiries() {
    if (this.inquiriesFile && fs.existsSync(this.inquiriesFile)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(this.inquiriesFile, 'utf8'));
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fallback to empty array if file is unreadable
      }
    }
    return [];
  }

  #persistInquiries() {
    if (!this.inquiriesFile) return;
    fs.mkdirSync(path.dirname(this.inquiriesFile), { recursive: true });
    fs.writeFileSync(this.inquiriesFile, JSON.stringify(this.inquiries, null, 2), 'utf8');
  }

  getCatalog() {
    return {
      shopName: process.env.SHOP_NAME || "Yamal's Stickers AUX",
      city: process.env.CITY || 'Augsburg (0821 / AUX)',
      pricingPolicy: 'Alle Preise sind verhandelbar (VB) – Mengenrabatt & Tausch möglich.',
      motifs: structuredClone(STICKER_MOTIFS),
      bundles: structuredClone(BUNDLE_DEALS),
      depots: structuredClone(PICKUP_DEPOTS)
    };
  }

  createInquiry(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Ungültige Anfrage-Daten.');
    }

    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const contact = typeof payload.contact === 'string' ? payload.contact.trim() : '';
    const selection = typeof payload.selection === 'string' ? payload.selection.trim() : '';

    if (!name || name.length < 2) {
      throw new Error('Bitte gib deinen Namen oder Spitznamen an.');
    }
    if (!contact || contact.length < 3) {
      throw new Error('Bitte gib eine Kontaktmöglichkeit an (z. B. Instagram, E-Mail oder Handynummer).');
    }
    if (!selection) {
      throw new Error('Bitte wähle ein Sticker-Paket oder Motiv aus.');
    }

    const quantity = Number(payload.quantity);
    if (!Number.isFinite(quantity) || quantity < 10 || quantity > 5000) {
      throw new Error('Bitte gib eine gültige Stückzahl zwischen 10 und 5000 an.');
    }

    const offerPrice = Number(payload.offerPrice);
    if (!Number.isFinite(offerPrice) || offerPrice <= 0 || offerPrice > 2000) {
      throw new Error('Bitte gib einen fairen Preisvorschlag (VB in €) ein.');
    }

    const delivery = VALID_DELIVERY_IDS.has(payload.delivery) ? payload.delivery : 'arena';
    const depotObj = PICKUP_DEPOTS.find((d) => d.id === delivery);

    const message =
      typeof payload.message === 'string' ? payload.message.trim().slice(0, 500) : '';

    const referenceCode = `AUX-${crypto.randomInt(1000, 9999)}`;
    const record = {
      id: referenceCode,
      createdAt: new Date().toISOString(),
      name: name.slice(0, 80),
      contact: contact.slice(0, 120),
      selection: selection.slice(0, 140),
      quantity: Math.round(quantity),
      offerPrice: Math.round(offerPrice * 100) / 100,
      currency: 'EUR',
      negotiable: true,
      delivery,
      deliveryLabel: depotObj ? depotObj.name : delivery,
      message
    };

    this.inquiries.unshift(record);
    this.#persistInquiries();

    return structuredClone(record);
  }

  listInquiries() {
    return structuredClone(this.inquiries);
  }
}
