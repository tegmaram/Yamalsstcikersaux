function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderZirbelnussIcon(cx, cy, scale = 1, fill = '#f8f7f3') {
  return `
    <g transform="translate(${cx}, ${cy}) scale(${scale})">
      <ellipse cx="0" cy="-2" rx="11" ry="15" fill="${fill}" />
      <path d="M-8 -8 Q0 -14 8 -8 M-10 -2 Q0 -8 10 -2 M-9 5 Q0 -1 9 5" stroke="#141916" stroke-width="1.8" fill="none"/>
      <rect x="-6" y="13" width="12" height="3.5" rx="1.5" fill="${fill}" />
      <rect x="-3.5" y="16.5" width="7" height="3" rx="1" fill="${fill}" />
    </g>
  `;
}

function renderMotifSvg(motif, uidSuffix = '') {
  const uid = `${motif.id}-${uidSuffix || 'card'}`;
  const badge = escapeHtml(motif.badgeText);
  const sub = escapeHtml(motif.subText);

  if (motif.style === 'stripes') {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="${badge}">
        <rect x="8" y="8" width="204" height="204" rx="18" fill="#f8f7f3" stroke="#d5d3cb" stroke-width="2"/>
        <clipPath id="clip-${uid}">
          <rect x="18" y="18" width="184" height="184" rx="11"/>
        </clipPath>
        <g clip-path="url(#clip-${uid})">
          <rect x="18" y="18" width="61.4" height="184" fill="#d62828"/>
          <rect x="79.3" y="18" width="61.4" height="184" fill="#f8f7f3"/>
          <rect x="140.6" y="18" width="61.4" height="184" fill="#1b874b"/>
          <rect x="18" y="80" width="184" height="62" fill="#111613" fill-opacity="0.92"/>
          <text x="110" y="113" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="25" letter-spacing="1.5" fill="#f8f7f3">${badge}</text>
          <text x="110" y="132" text-anchor="middle" font-family="monospace" font-weight="700" font-size="8.8" letter-spacing="1" fill="#5ef09b">${sub}</text>
        </g>
        ${renderZirbelnussIcon(110, 49, 0.95, '#1b874b')}
      </svg>
    `;
  }

  if (motif.style === 'ticket') {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 175" role="img" aria-label="${badge}">
        <path d="M16 14 H244 Q250 14 250 20 V69 A18 18 0 0 0 250 106 V155 Q250 161 244 161 H16 Q10 161 10 155 V106 A18 18 0 0 0 10 69 V20 Q10 14 16 14 Z" fill="#f8f7f3" stroke="#d5d3cb" stroke-width="2"/>
        <rect x="20" y="24" width="220" height="127" rx="6" fill="#131916"/>
        <rect x="20" y="24" width="220" height="10" fill="#d62828"/>
        <rect x="20" y="141" width="220" height="10" fill="#1b874b"/>
        <line x1="192" y1="36" x2="192" y2="139" stroke="#f8f7f3" stroke-opacity="0.4" stroke-width="2" stroke-dasharray="5 5"/>
        <text x="34" y="56" font-family="monospace" font-weight="700" font-size="9.5" fill="#5ef09b">EINTRITTSKARTE • 0821</text>
        <text x="34" y="95" font-family="sans-serif" font-weight="900" font-size="26" letter-spacing="1" fill="#f8f7f3">${badge}</text>
        <text x="34" y="122" font-family="monospace" font-weight="700" font-size="8.8" fill="#d8dfd9">${sub}</text>
        <text x="216" y="92" text-anchor="middle" font-family="monospace" font-weight="800" font-size="12" fill="#f4c430">1907</text>
        <text x="216" y="110" text-anchor="middle" font-family="monospace" font-weight="700" font-size="9" fill="#f8f7f3">BLOCK M</text>
      </svg>
    `;
  }

  if (motif.style === 'round') {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="${badge}">
        <circle cx="110" cy="110" r="98" fill="#f8f7f3" stroke="#d5d3cb" stroke-width="2"/>
        <circle cx="110" cy="110" r="88" fill="#131916"/>
        <circle cx="110" cy="110" r="79" fill="none" stroke="#d62828" stroke-width="6"/>
        <circle cx="110" cy="110" r="71" fill="none" stroke="#1b874b" stroke-width="5"/>
        ${renderZirbelnussIcon(110, 74, 1.15, '#f8f7f3')}
        <rect x="34" y="106" width="152" height="30" rx="5" fill="#d62828"/>
        <text x="110" y="126.5" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="17" letter-spacing="1.2" fill="#ffffff">${badge}</text>
        <text x="110" y="156" text-anchor="middle" font-family="monospace" font-weight="700" font-size="8.5" letter-spacing="1" fill="#f8f7f3">${sub}</text>
      </svg>
    `;
  }

  if (motif.style === 'banner') {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 120" role="img" aria-label="${badge}">
        <rect x="6" y="10" width="268" height="100" rx="14" fill="#f8f7f3" stroke="#d5d3cb" stroke-width="2"/>
        <rect x="15" y="19" width="250" height="82" rx="8" fill="#1b874b"/>
        <rect x="15" y="19" width="250" height="16" fill="#d62828"/>
        <rect x="15" y="85" width="250" height="16" fill="#f8f7f3"/>
        <text x="140" y="61" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="22" letter-spacing="1.4" fill="#ffffff">${badge}</text>
        <text x="140" y="77" text-anchor="middle" font-family="monospace" font-weight="700" font-size="7.6" letter-spacing="0.7" fill="#e9f7ee">${sub}</text>
        <text x="140" y="96.5" text-anchor="middle" font-family="monospace" font-weight="800" font-size="8.5" letter-spacing="2" fill="#131916">AUGSBURG • 1907 • AUX</text>
      </svg>
    `;
  }

  if (motif.style === 'shield') {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 230" role="img" aria-label="${badge}">
        <path d="M105 10 L192 36 V118 C192 168 140 202 105 218 C70 202 18 168 18 118 V36 Z" fill="#f8f7f3" stroke="#d5d3cb" stroke-width="2"/>
        <path d="M105 21 L181 44 V116 C181 160 135 191 105 206 C75 191 29 160 29 116 V44 Z" fill="#141a17"/>
        <polygon points="30,45 180,95 180,128 30,78" fill="#d62828"/>
        <polygon points="30,78 180,128 180,152 30,102" fill="#1b874b"/>
        ${renderZirbelnussIcon(105, 58, 0.9, '#f8f7f3')}
        <rect x="33" y="102" width="144" height="32" rx="5" fill="#f8f7f3"/>
        <text x="105" y="124" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="20" letter-spacing="1" fill="#141a17">${badge}</text>
        <text x="105" y="156" text-anchor="middle" font-family="monospace" font-weight="700" font-size="7.2" fill="#f8f7f3">${sub.slice(0, 24)}</text>
      </svg>
    `;
  }

  // holo
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 170" role="img" aria-label="${badge}">
      <defs>
        <linearGradient id="holo-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff5964"/>
          <stop offset="35%" stop-color="#f8f7f3"/>
          <stop offset="70%" stop-color="#35e084"/>
          <stop offset="100%" stop-color="#60a5fa"/>
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="244" height="154" rx="16" fill="#f8f7f3" stroke="#d5d3cb" stroke-width="2"/>
      <rect x="18" y="18" width="224" height="134" rx="10" fill="url(#holo-${uid})"/>
      <rect x="26" y="26" width="208" height="118" rx="7" fill="#121714" fill-opacity="0.86"/>
      <text x="130" y="56" text-anchor="middle" font-family="monospace" font-weight="800" font-size="10" letter-spacing="2" fill="#35e084">HOLO SONDEREDITION</text>
      <text x="130" y="95" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="24" letter-spacing="1.2" fill="#ffffff">${badge}</text>
      <text x="130" y="122" text-anchor="middle" font-family="monospace" font-weight="700" font-size="8.6" letter-spacing="1" fill="#ff7a7a">${sub}</text>
    </svg>
  `;
}

const state = {
  catalog: null,
  activeCategory: 'alle',
  lastOfferCopy: ''
};

const els = {
  heroShowcase: document.getElementById('hero-showcase'),
  categoryFilters: document.getElementById('category-filters'),
  motifGrid: document.getElementById('motif-grid'),
  bundleGrid: document.getElementById('bundle-grid'),
  depotGrid: document.getElementById('depot-grid'),
  recentInquiries: document.getElementById('recent-inquiries'),
  form: document.getElementById('inquiry-form'),
  fSelection: document.getElementById('f-selection'),
  fQuantity: document.getElementById('f-quantity'),
  fOffer: document.getElementById('f-offer'),
  fDelivery: document.getElementById('f-delivery'),
  fName: document.getElementById('f-name'),
  fContact: document.getElementById('f-contact'),
  fMessage: document.getElementById('f-message'),
  formError: document.getElementById('form-error'),
  submitBtn: document.getElementById('submit-btn'),
  confBox: document.getElementById('confirmation-box'),
  confTitle: document.getElementById('conf-title'),
  confSummary: document.getElementById('conf-summary'),
  confCopyText: document.getElementById('conf-copy-text'),
  copyOfferBtn: document.getElementById('copy-offer-btn'),
  newOfferBtn: document.getElementById('new-offer-btn')
};

function selectForOffer({ label, quantity, suggestedPrice }) {
  // Ensure option exists in dropdown
  const existing = Array.from(els.fSelection.options).find((opt) => opt.value === label);
  if (!existing) {
    const opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    els.fSelection.prepend(opt);
  }
  els.fSelection.value = label;
  if (quantity) els.fQuantity.value = quantity;
  if (suggestedPrice) els.fOffer.value = suggestedPrice;

  els.confBox.hidden = true;
  els.form.hidden = false;
  document.getElementById('anfrage').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => els.fOffer.focus(), 450);
}

function renderHeroShowcase(motifs) {
  const featured = motifs.slice(0, 4);
  els.heroShowcase.innerHTML = featured
    .map(
      (m) => `
      <div class="showcase-sticker" data-motif-id="${escapeHtml(m.id)}" title="${escapeHtml(m.name)} – Preis VB">
        ${renderMotifSvg(m, 'hero')}
      </div>
    `
    )
    .join('');

  els.heroShowcase.querySelectorAll('.showcase-sticker').forEach((node) => {
    node.addEventListener('click', () => {
      const motif = motifs.find((m) => m.id === node.dataset.motifId);
      if (motif) {
        selectForOffer({
          label: `Motiv: ${motif.name}`,
          quantity: motif.packSize,
          suggestedPrice: motif.guidePrice
        });
      }
    });
  });
}

function renderFilters(motifs) {
  const categories = ['alle', ...new Set(motifs.map((m) => m.category))];
  els.categoryFilters.innerHTML = categories
    .map((cat) => {
      const label = cat === 'alle' ? 'Alle Motive' : cat;
      const active = state.activeCategory === cat ? 'active' : '';
      return `<button type="button" class="filter-btn ${active}" data-category="${escapeHtml(cat)}">${escapeHtml(label)}</button>`;
    })
    .join('');

  els.categoryFilters.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeCategory = btn.dataset.category;
      renderFilters(motifs);
      renderMotifs(motifs);
    });
  });
}

function renderMotifs(motifs) {
  const filtered =
    state.activeCategory === 'alle'
      ? motifs
      : motifs.filter((m) => m.category === state.activeCategory);

  els.motifGrid.innerHTML = filtered
    .map(
      (m) => `
      <article class="motif-card">
        <div class="motif-preview">
          <span class="vb-tag">Preis VB</span>
          ${renderMotifSvg(m, 'grid')}
        </div>
        <div class="motif-body">
          <span class="motif-cat">${escapeHtml(m.category)}</span>
          <h3>${escapeHtml(m.name)}</h3>
          <p class="motif-desc">${escapeHtml(m.description)}</p>
          <ul class="motif-specs">
            <li><strong>Format:</strong> ${escapeHtml(m.format)}</li>
            <li><strong>Qualität:</strong> ${escapeHtml(m.finish)}</li>
            <li><strong>Einheit:</strong> ab ${m.packSize} Stück (auch im Mix)</li>
          </ul>
          <div class="motif-footer">
            <div class="price-block">
              <strong>Richtwert ${m.guidePrice} € VB</strong>
              <span>Verhandelbar &amp; Tausch ok</span>
            </div>
            <button
              type="button"
              class="btn btn-secondary offer-motif-btn"
              data-motif-id="${escapeHtml(m.id)}"
            >
              Preis vorschlagen
            </button>
          </div>
        </div>
      </article>
    `
    )
    .join('');

  els.motifGrid.querySelectorAll('.offer-motif-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const motif = motifs.find((m) => m.id === btn.dataset.motifId);
      if (motif) {
        selectForOffer({
          label: `Motiv: ${motif.name}`,
          quantity: motif.packSize,
          suggestedPrice: motif.guidePrice
        });
      }
    });
  });
}

function renderBundles(bundles) {
  els.bundleGrid.innerHTML = bundles
    .map(
      (b) => `
      <div class="bundle-card">
        <span class="bundle-badge">${escapeHtml(b.badge)}</span>
        <h3>${escapeHtml(b.title)}</h3>
        <div class="bundle-price">
          ${escapeHtml(b.guidePrice)}
          <small>Richtpreis – Gegenvorschlag willkommen!</small>
        </div>
        <p>${escapeHtml(b.details)}</p>
        <button
          type="button"
          class="btn btn-primary btn-block select-bundle-btn"
          data-bundle-id="${escapeHtml(b.id)}"
        >
          Paket wählen &amp; Preis vorschlagen
        </button>
      </div>
    `
    )
    .join('');

  els.bundleGrid.querySelectorAll('.select-bundle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bundle = bundles.find((b) => b.id === btn.dataset.bundleId);
      if (bundle) {
        selectForOffer({
          label: `${bundle.title} (${bundle.count} Sticker)`,
          quantity: bundle.count,
          suggestedPrice: bundle.numericGuide
        });
      }
    });
  });
}

function renderDepots(depots) {
  els.depotGrid.innerHTML = depots
    .map(
      (d) => `
      <div class="depot-card">
        <h3>${escapeHtml(d.name)}</h3>
        <div class="depot-area">${escapeHtml(d.area)}</div>
        <p class="depot-timing">${escapeHtml(d.timing)}</p>
        <span class="depot-cost">${escapeHtml(d.shippingCost)}</span>
      </div>
    `
    )
    .join('');

  els.fDelivery.innerHTML = depots
    .map(
      (d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)} – ${escapeHtml(d.shippingCost)}</option>`
    )
    .join('');
}

function populateFormOptions(catalog) {
  const options = [];
  for (const b of catalog.bundles) {
    options.push({
      value: `${b.title} (${b.count} Sticker)`,
      label: `${b.title} – Richtwert ${b.guidePrice}`
    });
  }
  for (const m of catalog.motifs) {
    options.push({
      value: `Motiv: ${m.name}`,
      label: `Einzelmotiv: ${m.name} (ab ${m.packSize} Stk. – ${m.guidePrice} € VB)`
    });
  }
  options.push({
    value: 'Individuelles Wunschpaket / Großmenge',
    label: 'Individuelles Wunschpaket / Großmenge (Preis VB)'
  });

  els.fSelection.innerHTML = options
    .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
    .join('');
}

function renderRecentInquiries(inquiries) {
  if (!inquiries || inquiries.length === 0) {
    els.recentInquiries.innerHTML =
      '<p class="muted-small">Noch keine Anfragen gespeichert – sei der Erste mit einem Preisvorschlag!</p>';
    return;
  }

  els.recentInquiries.innerHTML = inquiries
    .slice(0, 4)
    .map(
      (item) => `
      <div class="recent-item">
        <div>
          <strong>${escapeHtml(item.selection)}</strong>
          <span> • ${item.quantity} Stk.</span>
        </div>
        <strong>${item.offerPrice} € VB</strong>
      </div>
    `
    )
    .join('');
}

async function loadInitialData() {
  const [catRes, inqRes] = await Promise.all([
    fetch('/api/catalog'),
    fetch('/api/inquiries')
  ]);

  const catalog = await catRes.json();
  const inqData = await inqRes.json();

  state.catalog = catalog;
  renderHeroShowcase(catalog.motifs);
  renderFilters(catalog.motifs);
  renderMotifs(catalog.motifs);
  renderBundles(catalog.bundles);
  renderDepots(catalog.depots);
  populateFormOptions(catalog);
  renderRecentInquiries(inqData.inquiries || []);
}

els.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  els.formError.hidden = true;
  els.submitBtn.disabled = true;
  els.submitBtn.textContent = 'Wird gesendet...';

  const payload = {
    selection: els.fSelection.value,
    quantity: Number(els.fQuantity.value),
    offerPrice: Number(els.fOffer.value),
    delivery: els.fDelivery.value,
    name: els.fName.value,
    contact: els.fContact.value,
    message: els.fMessage.value
  };

  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Anfrage konnte nicht gesendet werden.');
    }

    const inq = data.inquiry;
    const formatted = [
      `Servus! Sticker-Anfrage (${inq.id}) – Yamal's Stickers AUX:`,
      `• Auswahl: ${inq.selection}`,
      `• Menge: ${inq.quantity} Stück`,
      `• Mein Preisvorschlag: ${inq.offerPrice} € (VB)`,
      `• Übergabe / Versand: ${inq.deliveryLabel}`,
      `• Kontakt: ${inq.name} (${inq.contact})`,
      inq.message ? `• Nachricht: ${inq.message}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    state.lastOfferCopy = formatted;
    els.confTitle.textContent = `Top! Anfrage ${inq.id} wurde gespeichert.`;
    els.confSummary.textContent = `Dein Preisvorschlag über ${inq.offerPrice} € VB für ${inq.quantity} Sticker (${inq.deliveryLabel}) ist eingegangen.`;
    els.confCopyText.textContent = formatted;

    els.form.hidden = true;
    els.confBox.hidden = false;

    const inqRes = await fetch('/api/inquiries');
    const inqList = await inqRes.json();
    renderRecentInquiries(inqList.inquiries || []);
  } catch (err) {
    els.formError.textContent = err.message;
    els.formError.hidden = false;
  } finally {
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = 'Preisvorschlag unverbindlich absenden';
  }
});

els.copyOfferBtn.addEventListener('click', async () => {
  if (!state.lastOfferCopy) return;
  try {
    await navigator.clipboard.writeText(state.lastOfferCopy);
    els.copyOfferBtn.textContent = 'Kopiert!';
    setTimeout(() => {
      els.copyOfferBtn.textContent = 'Text für WhatsApp / Instagram kopieren';
    }, 2000);
  } catch {
    els.copyOfferBtn.textContent = 'Bitte Text oben manuell markieren';
  }
});

els.newOfferBtn.addEventListener('click', () => {
  els.confBox.hidden = true;
  els.form.hidden = false;
  els.fMessage.value = '';
});

loadInitialData().catch((err) => {
  console.error('Fehler beim Laden des Sticker-Katalogs:', err);
});
