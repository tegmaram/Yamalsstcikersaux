const STICKERS = [
  {
    id: 'ulrich-biesinger-tribuene',
    title: 'Ulrich-Biesinger-Tribüne',
    image: './assets/stickers/ulrich-biesinger-tribuene.jpg'
  },
  {
    id: 'gruppe-fuggerstadt',
    title: 'Gruppe Fuggerstadt',
    image: './assets/stickers/gruppe-fuggerstadt.jpg'
  },
  {
    id: 'fuggerstadt-wappen',
    title: 'Fuggerstadt Wappen',
    image: './assets/stickers/fuggerstadt-wappen.jpg'
  },
  {
    id: 'la-07-adler',
    title: 'LA 07',
    image: './assets/stickers/la-07-adler.jpg'
  },
  {
    id: 'la-adler',
    title: 'L A Klassik',
    image: './assets/stickers/la-adler.jpg'
  }
];

const selection = new Map();
let offerInView = false;

const els = {
  loader: document.getElementById('page-loader'),
  list: document.getElementById('sticker'),
  topCount: document.getElementById('top-count'),
  clearTopBtn: document.getElementById('clear-top-btn'),
  clearBtn: document.getElementById('clear-selection-btn'),
  summary: document.getElementById('selected-summary'),
  offerSection: document.getElementById('anfrage'),
  offerPrice: document.getElementById('offer-price'),
  offerDelivery: document.getElementById('offer-delivery'),
  offerNote: document.getElementById('offer-note'),
  messagePreview: document.getElementById('message-preview'),
  copyBtn: document.getElementById('copy-btn'),
  whatsappLink: document.getElementById('whatsapp-link'),
  stickyBar: document.getElementById('sticky-bar'),
  stickyCount: document.getElementById('sticky-count'),
  lightbox: document.getElementById('lightbox'),
  lightboxImg: document.getElementById('lightbox-img'),
  lightboxCaption: document.getElementById('lightbox-caption'),
  lightboxClose: document.getElementById('lightbox-close')
};

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTotalCount() {
  let sum = 0;
  for (const qty of selection.values()) sum += qty;
  return sum;
}

/* Initial Card Creation (once, so taps never re-render images) */
function initCards() {
  els.list.innerHTML = STICKERS.map((s, idx) => {
    const id = escapeHtml(s.id);
    const title = escapeHtml(s.title);
    const img = escapeHtml(s.image);
    const delay = (0.08 + idx * 0.06).toFixed(2);

    return `
      <article class="sticker-card" data-card-id="${id}" style="animation-delay: ${delay}s">
        <div class="photo-box" data-zoom-src="${img}" data-zoom-title="${title}">
          <img src="${img}" alt="${title}" class="sticker-img" loading="${idx < 2 ? 'eager' : 'lazy'}" />
          <span class="vb-pill">VB</span>
        </div>
        <div class="card-main">
          <div class="card-title-row">
            <h2>${title}</h2>
          </div>
          <div class="stepper" role="group" aria-label="${title} Menge">
            <button type="button" class="step-btn minus" data-id="${id}" data-step="-30" disabled>−30</button>
            <button type="button" class="step-btn minus" data-id="${id}" data-step="-10" disabled>−10</button>
            <button type="button" class="step-btn minus" data-id="${id}" data-step="-1" disabled>−1</button>
            <span class="step-qty" data-qty-for="${id}">0×</span>
            <button type="button" class="step-btn plus" data-id="${id}" data-step="1">+1</button>
            <button type="button" class="step-btn plus" data-id="${id}" data-step="10">+10</button>
            <button type="button" class="step-btn plus" data-id="${id}" data-step="30">+30</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function syncCardUi(id) {
  const qty = selection.get(id) || 0;
  const card = els.list.querySelector(`[data-card-id="${id}"]`);
  if (!card) return;

  card.classList.toggle('is-selected', qty > 0);

  const qtyEl = card.querySelector(`[data-qty-for="${id}"]`);
  if (qtyEl) {
    qtyEl.textContent = `${qty}×`;
    qtyEl.classList.remove('has-qty');
    if (qty > 0) {
      // Trigger subtle pop animation
      void qtyEl.offsetWidth;
      qtyEl.classList.add('has-qty');
    }
  }

  card.querySelectorAll('.step-btn.minus').forEach((btn) => {
    btn.disabled = qty === 0;
  });
}

function setQty(id, nextQty) {
  const clean = Math.max(0, Math.min(2000, Math.round(nextQty)));
  if (clean === 0) selection.delete(id);
  else selection.set(id, clean);

  syncCardUi(id);
  updateSelectionViews();
}

function buildMessage() {
  const chosen = STICKERS.filter((s) => selection.has(s.id)).map(
    (s) => `• ${selection.get(s.id)}× ${s.title}`
  );
  const total = getTotalCount();

  const listPart =
    chosen.length > 0
      ? `${chosen.join('\n')}\nGesamt: ${total} Sticker`
      : '• Interesse an FCA / Augsburg Stickern';

  const price = els.offerPrice.value.trim();
  const priceLine = price ? `Preisvorschlag: ${price} € (VB)` : 'Preis: VB';
  const meetupLine = `Treffpunkt: ${els.offerDelivery.value} (keine Lieferung)`;
  const note = els.offerNote.value.trim();

  const lines = ['Servus! Anfrage Sticker:', listPart, '', priceLine, meetupLine];
  if (note) lines.push(`Info: ${note}`);

  return lines.join('\n');
}

function updateStickyVisibility() {
  const total = getTotalCount();
  els.stickyBar.hidden = total === 0 || offerInView;
}

function updateSelectionViews() {
  const total = getTotalCount();

  // Header & Reset visibility
  els.topCount.textContent = String(total);
  els.topCount.hidden = total === 0;
  els.clearTopBtn.hidden = total === 0;
  els.clearBtn.hidden = total === 0;

  // Sticky Bottom Bar
  els.stickyCount.textContent = `${total} Sticker gewählt`;
  updateStickyVisibility();

  // Compact Summary Chips
  if (total === 0) {
    els.summary.innerHTML = `<div class="summary-empty">Oben Sticker mit +1 / +10 / +30 auswählen</div>`;
  } else {
    els.summary.innerHTML = STICKERS.filter((s) => selection.has(s.id))
      .map(
        (s) => `
        <span class="summary-chip">
          <strong>${selection.get(s.id)}×</strong> ${escapeHtml(s.title)}
        </span>
      `
      )
      .join('');
  }

  // Message & WhatsApp Link
  const msg = buildMessage();
  els.messagePreview.textContent = msg;
  els.whatsappLink.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

/* Lightbox */
function openLightbox(src, caption) {
  els.lightboxImg.src = src;
  els.lightboxImg.alt = caption || '';
  els.lightboxCaption.textContent = caption || '';
  els.lightbox.hidden = false;
}

function closeLightbox() {
  els.lightbox.hidden = true;
  els.lightboxImg.src = '';
}

/* Events */
els.list.addEventListener('click', (e) => {
  const stepBtn = e.target.closest('[data-step]');
  if (stepBtn && !stepBtn.disabled) {
    const id = stepBtn.dataset.id;
    const delta = Number(stepBtn.dataset.step);
    setQty(id, (selection.get(id) || 0) + delta);
    return;
  }

  const photo = e.target.closest('.photo-box');
  if (photo) {
    openLightbox(photo.dataset.zoomSrc, photo.dataset.zoomTitle);
  }
});

document.querySelectorAll('.bulk-add-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const step = Number(btn.dataset.bulkStep) || 1;
    for (const s of STICKERS) {
      const next = Math.max(0, Math.min(2000, (selection.get(s.id) || 0) + step));
      if (next === 0) selection.delete(s.id);
      else selection.set(s.id, next);
      syncCardUi(s.id);
    }
    updateSelectionViews();
  });
});

function clearAll() {
  selection.clear();
  for (const s of STICKERS) syncCardUi(s.id);
  updateSelectionViews();
}

els.clearBtn.addEventListener('click', clearAll);
els.clearTopBtn.addEventListener('click', clearAll);

[els.offerPrice, els.offerDelivery, els.offerNote].forEach((el) => {
  el.addEventListener('input', updateSelectionViews);
  el.addEventListener('change', updateSelectionViews);
});

els.copyBtn.addEventListener('click', async () => {
  const text = buildMessage();
  try {
    await navigator.clipboard.writeText(text);
    els.copyBtn.textContent = '✓ Kopiert!';
    els.copyBtn.classList.add('copied');
    setTimeout(() => {
      els.copyBtn.textContent = 'Text kopieren';
      els.copyBtn.classList.remove('copied');
    }, 1800);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(els.messagePreview);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
});

els.lightboxClose.addEventListener('click', closeLightbox);
els.lightbox.addEventListener('click', (e) => {
  if (e.target === els.lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.lightbox.hidden) closeLightbox();
});

// Hide sticky bottom bar automatically when offer box is visible on screen
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      offerInView = entries.some((entry) => entry.isIntersecting);
      updateStickyVisibility();
    },
    { threshold: 0.25 }
  );
  io.observe(els.offerSection);
}

/* Animated Page Loader Finish */
function finishLoading() {
  if (!document.body.classList.contains('is-loading')) return;
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-ready');
  els.loader.classList.add('is-done');
}

initCards();
updateSelectionViews();

const minLoaderPromise = new Promise((resolve) => setTimeout(resolve, 680));
const windowLoadPromise =
  document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));

Promise.all([minLoaderPromise, windowLoadPromise]).then(finishLoading);
// Safety fallback so mobile never hangs on slow networks
setTimeout(finishLoading, 1350);
