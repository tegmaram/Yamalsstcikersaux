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
  addAllBtn: document.getElementById('add-all-btn'),
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
  const clean = Math.max(0, Math.min(500, Math.round(nextQty)));
  if (clean === 0) {
    selection.delete(id);
  } else {
    selection.set(id, clean);
  }
  renderAll();
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
            <div class="vb-label">
              <strong>Preis verhandelbar (VB)</strong>
              <span>Einzeln oder mehrere verfügbar</span>
            </div>

            ${
              qty === 0
                ? `<button type="button" class="btn btn-primary btn-sm add-first-btn" data-id="${escapeHtml(s.id)}">
                     + Auswählen
                   </button>`
                : `<div class="qty-controls" aria-label="Stückzahl anpassen">
                     <button type="button" class="qty-btn dec-btn" data-id="${escapeHtml(s.id)}" aria-label="Weniger">−</button>
                     <span class="qty-value">${qty}×</span>
                     <button type="button" class="qty-btn inc-btn" data-id="${escapeHtml(s.id)}" aria-label="Mehr">+</button>
                   </div>`
            }
          </div>
        </div>
      </article>
    `;
  }).join('');

  els.grid.querySelectorAll('.sticker-photo-wrap').forEach((wrap) => {
    wrap.addEventListener('click', () => {
      openLightbox(wrap.dataset.zoomSrc, wrap.dataset.zoomTitle);
    });
  });

  els.grid.querySelectorAll('.add-first-btn').forEach((btn) => {
    btn.addEventListener('click', () => setQty(btn.dataset.id, 1));
  });

  els.grid.querySelectorAll('.inc-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      setQty(id, (selection.get(id) || 0) + 1);
    });
  });

  els.grid.querySelectorAll('.dec-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      setQty(id, (selection.get(id) || 0) - 1);
    });
  });
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
        Noch keine Sticker ausgewählt. Klicke oben bei den gewünschten Motiven auf <strong>„+ Auswählen“</strong>
        oder wähle direkt alle 5 Motive als Set.
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
          <div class="qty-controls">
            <button type="button" class="qty-btn sel-dec" data-id="${escapeHtml(s.id)}" aria-label="Weniger">−</button>
            <span class="qty-value">${qty}×</span>
            <button type="button" class="qty-btn sel-inc" data-id="${escapeHtml(s.id)}" aria-label="Mehr">+</button>
          </div>
        </div>
      `;
    })
    .join('');

  els.selectedList.querySelectorAll('.sel-inc').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      setQty(id, (selection.get(id) || 0) + 1);
    });
  });

  els.selectedList.querySelectorAll('.sel-dec').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      setQty(id, (selection.get(id) || 0) - 1);
    });
  });
}

function buildInquiryMessage() {
  const chosenLines = STICKERS.filter((s) => selection.has(s.id)).map(
    (s) => `• ${selection.get(s.id)}× ${s.title}`
  );

  const itemsBlock =
    chosenLines.length > 0
      ? chosenLines.join('\n')
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

// Alle 5 Motive auswählen
function addOneOfEach() {
  for (const s of STICKERS) {
    selection.set(s.id, (selection.get(s.id) || 0) + 1);
  }
  renderAll();
}

els.selectAllHero.addEventListener('click', () => {
  if (selection.size === 0) addOneOfEach();
  document.getElementById('anfrage').scrollIntoView({ behavior: 'smooth' });
});

els.addAllBtn.addEventListener('click', addOneOfEach);

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
    // Fallback für ältere Browser
    const range = document.createRange();
    range.selectNodeContents(els.messagePreview);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
});

renderAll();
