import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../src/server.js';
import { CatalogStore } from '../src/store.js';

async function withServer(fn) {
  const store = new CatalogStore({ inquiriesFile: null });
  const server = createAppServer({ store });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('GET /api/health liefert Status und VB-Preismodell zurück', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.match(body.preismodell, /VB/);
  });
});

test('GET /api/catalog enthält Augsburg/FCA Motive, Mix-Pakete und Abhol-Depots', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/catalog`);
    assert.equal(res.status, 200);
    const catalog = await res.json();

    assert.ok(Array.isArray(catalog.motifs));
    assert.ok(catalog.motifs.length >= 6);
    assert.ok(catalog.motifs.every((m) => m.negotiable === true));
    assert.ok(Array.isArray(catalog.bundles));
    assert.ok(Array.isArray(catalog.depots));
  });
});

test('POST /api/inquiries speichert einen gültigen VB-Preisvorschlag', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Max aus Augsburg',
        contact: '@max_aux0821',
        selection: '100er Kurven-Paket (100 Sticker)',
        quantity: 100,
        offerPrice: 12.5,
        delivery: 'arena',
        message: 'Übergabe gerne Samstag vor Anpfiff!'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.match(data.inquiry.id, /^AUX-\d{4}$/);
    assert.equal(data.inquiry.negotiable, true);
    assert.equal(data.inquiry.offerPrice, 12.5);

    const listRes = await fetch(`${baseUrl}/api/inquiries`);
    const listData = await listRes.json();
    assert.equal(listData.inquiries.length, 1);
  });
});

test('POST /api/inquiries weist unvollständige Eingaben sauber auf Deutsch ab', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '',
        contact: '',
        selection: '50er Einsteiger-Mix',
        quantity: 50,
        offerPrice: -5
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(typeof data.error === 'string' && data.error.length > 5);
  });
});

test('GET / liefert die deutsche Startseite aus', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /Augsburg &amp; FCA Sticker-Verkauf/);
    assert.match(html, /Verhandlungsbasis \(VB\)/);
  });
});
