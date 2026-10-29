const STICKERS = [
  {
    id: 'ulrich-biesinger-tribuene',
    title: 'Ulrich-Biesinger-Tribüne – „Es geht nur gemeinsam“',
    tag: 'Tribüne & Kurve',
    image: './assets/stickers/ulrich-biesinger-tribuene.jpg',
    description:
      'Breiter Tribünen-Streifenkleber in Dunkelgrün, Weinrot und Weiß mit umlaufendem Rahmen und dem Motto „Es geht nur gemeinsam“.'
  },
  {
    id: 'gruppe-fuggerstadt',
    title: 'Gruppe Fuggerstadt (GF19)',
    tag: 'Fuggerstadt',
    image: './assets/stickers/gruppe-fuggerstadt.jpg',
    description:
      'Rot-Grün-Weißer Panorama-Streifensticker mit markantem Riss-Schriftzug „Gruppe Fuggerstadt“ und Augsburger Zirbelnuss-Wappenmotiv rechts.'
  },
  {
    id: 'fuggerstadt-wappen',
    title: 'Fuggerstadt – Stadtwappen & Lorbeerkranz',
    tag: 'Stadt & Tradition',
    image: './assets/stickers/fuggerstadt-wappen.jpg',
    description:
      'Schwarzer Streifen-Sticker mit geschwungenem „Fuggerstadt“-Schriftzug vor dem rot-weißen Augsburger Zirbelnuss-Stadtwappen im Lorbeerkranz.'
  },
  {
    id: 'la-07-adler',
    title: 'LA 07 – Doppeladler & Zirbelnuss',
    tag: 'LA 07 Serie',
    image: './assets/stickers/la-07-adler.jpg',
    description:
      'Langer Streifenkleber in Weinrot-Grün-Weiß mit „LA 07“-Schriftzug und zentralem Doppeladler samt Zirbelnuss-Brustschild.'
  },
  {
    id: 'la-adler',
    title: 'L A – Doppeladler Klassik',
    tag: 'LA Serie',
    image: './assets/stickers/la-adler.jpg',
    description:
      'Kompakter weinroter Streifen-Aufkleber mit grün-weißer Abschlusskante, Doppeladler in der Mitte und klassischem „L A“-Schriftzug.'
  }
];

// Speichert ausgewählte Stückzahl je Sticker-ID
const selection = new Map();

const els = {
  grid: document.getElementById('sticker-grid'),
  selectedList: document.getElementById('selected-list'),
  navCount: document.getElementById('nav-count'),
  selectAllHero: document.getElementById('select-all-hero'),
  clearBtn: document.getElementById('clear-selection-btn'),
  offerPrice: document.getElementById('offer-price'),
  offerDelivery: document.getElementById('offer-delivery'),
  buyerName: document.getElementById('buyer-name'),
  offerNote: document.getElementById('offer-note'),
  messagePreview: document.getElementById('message-preview'),
  copyBtn: document.getElementById('copy-btn'),
  copyStatus: document.getElementById('copy-status'),
  whatsappLink: document.getElementById('whatsapp-link'),
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
  let total = 0;
  for (const qty of selection.values()) {
    total += qty;
  }
  return total;
}

function setQty(id, nextQty) {
  const clean = Math.max(0, Math.min(2000, Math.round(nextQty)));
  if (clean === 0) {
    selection.delete(id);
  } else {
    selection.set(id, clean);
  }
  renderAll();
}

function renderStepperBar(id, qty) {
  const safeId = escapeHtml(id);
  const disableMinus = qty === 0 ? 'disabled' : '';

  return `
    <div class="qty-controls" role="group" aria-label="Stückzahl wählen">
      <div class="qty-group">
        <button type="button" class="qty-btn is-minus" data-id="${safeId}" data-step="-30" ${disableMinus} aria-label="30 weniger">−30</button>
        <button type="button" class="qty-btn is-minus" data-id="${safeId}" data-step="-10" ${disableMinus} aria-label="10 weniger">−10</button>
        <button type="button" class="qty-btn is-minus" data-id="${safeId}" data-step="-1" ${disableMinus} aria-label="1 weniger">−1</button>
      </div>
      <span class="qty-value">${qty}×</span>
      <div class="qty-group">
        <button type="button" class="qty-btn is-plus" data-id="${safeId}" data-step="1" aria-label="1 mehr">+1</button>
        <button type="button" class="qty-btn is-plus" data-id="${safeId}" data-step="10" aria-label="10 mehr">+10</button>
        <button type="button" class="qty-btn is-plus" data-id="${safeId}" data-step="30" aria-label="30 mehr">+30</button>
      </div>
    </div>
  `;
}

function openLightbox(src, caption) {
  els.lightboxImg.src = src;
  els.lightboxImg.alt = caption || 'Sticker Großansicht';
  els.lightboxCaption.textContent = caption || '';
  els.lightbox.hidden = false;
}

function closeLightbox() {
  els.lightbox.hidden = true;
  els.lightboxImg.src = '';
}

function renderStickerCards() {
  els.grid.innerHTML = STICKERS.map((s) => {
    const qty = selection.get(s.id) || 0;
    const selectedClass = qty > 0 ? 'is-selected' : '';

    return `
      <article class="sticker-card ${selectedClass}">
        <div class="sticker-photo-wrap" data-zoom-src="${escapeHtml(s.image)}" data-zoom-title="${escapeHtml(s.title)}">
          <span class="vb-badge">Preis VB</span>
          <img
            src="${escapeHtml(s.image)}"
            alt="${escapeHtml(s.title)}"
            class="sticker-photo"
            loading="lazy"
          />
          <span class="zoom-hint">Foto vergrößern</span>
        </div>
        <div class="sticker-body">
          <span class="sticker-meta">${escapeHtml(s.tag)}</span>
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.description)}</p>

          <div class="sticker-footer">
            <div class="sticker-footer-top">
              <div class="vb-label">
                <strong>Preis verhandelbar (VB)</strong>
                <span>Einzeln oder größere Mengen wählbar</span>
              </div>
              ${qty > 0 ? `<span class="selected-pill">${qty} Stk. gewählt</span>` : ''}
            </div>

            ${renderStepperBar(s.id, qty)}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderSelectedList() {
  const total = getTotalCount();
  if (total > 0) {
    els.navCount.textContent = String(total);
    els.navCount.hidden = false;
  } else {
    els.navCount.hidden = true;
  }

  if (selection.size === 0) {
    els.selectedList.innerHTML = `
      <div class="empty-selection">
        Noch keine Sticker ausgewählt. Nutze oben bei den Motiven die Buttons
        <strong>+1 / +10 / +30</strong> oder wähle unten alle 5 Motive auf einmal.
      </div>
    `;
    return;
  }

  els.selectedList.innerHTML = STICKERS.filter((s) => selection.has(s.id))
    .map((s) => {
      const qty = selection.get(s.id);
      return `
        <div class="selected-row">
          <div class="selected-row-left">
            <img src="${escapeHtml(s.image)}" alt="" class="selected-thumb" />
            <span class="selected-title">${escapeHtml(s.title)}</span>
          </div>
          ${renderStepperBar(s.id, qty)}
        </div>
      `;
    })
    .join('');
}

function buildInquiryMessage() {
  const chosenLines = STICKERS.filter((s) => selection.has(s.id)).map(
    (s) => `• ${selection.get(s.id)}× ${s.title}`
  );

  const total = getTotalCount();
  const itemsBlock =
    chosenLines.length > 0
      ? `${chosenLines.join('\n')}\nGesamtmenge: ${total} Sticker`
      : '• Interesse an Augsburg / FCA Stickern (bitte verfügbare Menge mitteilen)';

  const rawPrice = els.offerPrice.value.trim();
  const priceLine = rawPrice
    ? `Mein Preisvorschlag: ${rawPrice} € (VB)`
    : 'Mein Preisvorschlag: bitte um kurzen Preisvorschlag (VB)';

  const deliveryLine = `Treffpunkt: ${els.offerDelivery.value} (nur Abholung / keine Lieferung)`;
  const nameVal = els.buyerName.value.trim();
  const noteVal = els.offerNote.value.trim();

  const lines = [
    'Servus! Ich habe Interesse an folgenden Augsburg / FCA Stickern:',
    itemsBlock,
    '',
    priceLine,
    deliveryLine
  ];

  if (nameVal) lines.push(`Kontakt: ${nameVal}`);
  if (noteVal) lines.push(`Nachricht: ${noteVal}`);

  return lines.join('\n');
}

function updateMessagePreview() {
  const msg = buildInquiryMessage();
  els.messagePreview.textContent = msg;
  els.whatsappLink.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

function renderAll() {
  renderStickerCards();
  renderSelectedList();
  updateMessagePreview();
}

// Event-Delegation für Karten-Galerie (+1/+10/+30, -1/-10/-30 & Lightbox)
els.grid.addEventListener('click', (e) => {
  const stepBtn = e.target.closest('[data-step]');
  if (stepBtn && !stepBtn.disabled) {
    const id = stepBtn.dataset.id;
    const delta = Number(stepBtn.dataset.step);
    setQty(id, (selection.get(id) || 0) + delta);
    return;
  }

  const photoWrap = e.target.closest('.sticker-photo-wrap');
  if (photoWrap) {
    openLightbox(photoWrap.dataset.zoomSrc, photoWrap.dataset.zoomTitle);
  }
});

// Event-Delegation für Merkliste (+1/+10/+30 & -1/-10/-30)
els.selectedList.addEventListener('click', (e) => {
  const stepBtn = e.target.closest('[data-step]');
  if (stepBtn && !stepBtn.disabled) {
    const id = stepBtn.dataset.id;
    const delta = Number(stepBtn.dataset.step);
    setQty(id, (selection.get(id) || 0) + delta);
  }
});

// Event-Listener für Hero-Fotos (Lightbox)
document.querySelectorAll('[data-lightbox]').forEach((img) => {
  img.addEventListener('click', () => {
    openLightbox(img.dataset.lightbox, img.alt);
  });
});

els.lightboxClose.addEventListener('click', closeLightbox);
els.lightbox.addEventListener('click', (e) => {
  if (e.target === els.lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.lightbox.hidden) closeLightbox();
});

// Alle 5 Motive gleichzeitig erhöhen (+1 / +10 / +30)
function addBulkToAll(step) {
  for (const s of STICKERS) {
    const next = Math.max(0, Math.min(2000, (selection.get(s.id) || 0) + step));
    if (next === 0) selection.delete(s.id);
    else selection.set(s.id, next);
  }
  renderAll();
}

els.selectAllHero.addEventListener('click', () => {
  if (selection.size === 0) addBulkToAll(1);
  document.getElementById('anfrage').scrollIntoView({ behavior: 'smooth' });
});

document.querySelectorAll('.bulk-add-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    addBulkToAll(Number(btn.dataset.bulkStep) || 1);
  });
});

els.clearBtn.addEventListener('click', () => {
  selection.clear();
  renderAll();
});

[els.offerPrice, els.offerDelivery, els.buyerName, els.offerNote].forEach((input) => {
  input.addEventListener('input', updateMessagePreview);
  input.addEventListener('change', updateMessagePreview);
});

els.copyBtn.addEventListener('click', async () => {
  const text = buildInquiryMessage();
  try {
    await navigator.clipboard.writeText(text);
    els.copyStatus.hidden = false;
    setTimeout(() => {
      els.copyStatus.hidden = true;
    }, 2200);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(els.messagePreview);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
});

renderAll();
