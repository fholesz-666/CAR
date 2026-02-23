import { loadCars, getCarById } from './data.js';
import { formatPrice } from './ui.js';

const config = {
  formMode: 'mailto', // mailto | formspree
  formspreeEndpoint: ''
};

const fuelMap = { petrol: 'Benzín', diesel: 'Diesel', hybrid: 'Hybrid', ev: 'EV', lpg: 'LPG', cng: 'CNG' };

function qs(name) { return new URLSearchParams(location.search).get(name); }

function render(car) {
  const root = document.getElementById('detailPage');
  root.innerHTML = `
    <section class="detail-grid">
      <article class="gallery">
        <img id="mainPhoto" class="main-photo" src="${car.images[0]}" alt="${car.title}" loading="eager" tabindex="0" />
        <div id="thumbs" class="thumbs">${car.images.map((img, i) => `<img src="${img}" data-index="${i}" class="${i===0?'active':''}" loading="lazy" alt="Náhled ${i+1}" />`).join('')}</div>
      </article>
      <article class="card card-content">
        <h1>${car.title}</h1>
        <p class="price">${formatPrice(car.price)}</p>
        <div class="specs">
          ${[
            ['Rok', car.year], ['Nájezd', `${car.mileage_km.toLocaleString('cs-CZ')} km`], ['Palivo', fuelMap[car.fuel] || car.fuel],
            ['Výkon', `${car.power_kw} kW`], ['Motor', car.engine], ['Převodovka', car.transmission === 'auto' ? 'Automatická' : 'Manuální'], ['Lokalita', car.location]
          ].map(([k,v]) => `<div class="spec-item"><strong>${k}</strong><br>${v}</div>`).join('')}
        </div>
      </article>
      <article class="card card-content"><h2>Popis</h2><p>${car.description}</p></article>
      <article class="card card-content"><h2>Výbava</h2><ul class="two-col">${car.features.map((f) => `<li>${f}</li>`).join('')}</ul></article>
      <article class="card card-content"><h2>Tagy</h2><div class="badges">${car.tags.map((t) => `<span class="badge">${t}</span>`).join('')}</div></article>
    </section>
    <aside class="cta-panel cta-sticky">
      <h2>Kontakt na prodejce</h2>
      <p><a class="btn btn-primary" href="tel:${car.seller_phone}">📞 ${car.seller_phone}</a></p>
      <p><a class="btn" href="mailto:${car.seller_email}">✉️ ${car.seller_email}</a></p>
      <form id="contactForm">
        <label>Jméno<input name="name" required></label>
        <label>Email<input name="email" type="email" required></label>
        <label>Telefon<input name="phone"></label>
        <label>Zpráva<textarea name="message" required>Dobrý den, mám zájem o vůz ${car.title}.</textarea></label>
        <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;" aria-hidden="true">
        <label class="inline"><input type="checkbox" name="gdpr" required> Souhlas se zpracováním osobních údajů</label>
        <button class="btn btn-primary" type="submit">Odeslat poptávku</button>
      </form>
      <small>Odpovím co nejdřív. Nikdy neposílejte peníze předem bez ověření vozidla.</small>
    </aside>
  `;
}

function setupGallery(images) {
  let index = 0;
  const main = document.getElementById('mainPhoto');
  const thumbs = [...document.querySelectorAll('#thumbs img')];
  const set = (i) => {
    index = (i + images.length) % images.length;
    main.src = images[index];
    thumbs.forEach((t, idx) => t.classList.toggle('active', idx === index));
    document.getElementById('lbImage').src = images[index];
  };
  thumbs.forEach((t) => t.addEventListener('click', () => set(Number(t.dataset.index))));

  let startX = null;
  main.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
  main.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) set(index + (dx < 0 ? 1 : -1));
    startX = null;
  });

  const lb = document.getElementById('lightbox');
  const open = () => { lb.classList.remove('hidden'); lb.setAttribute('aria-hidden', 'false'); set(index); };
  const close = () => { lb.classList.add('hidden'); lb.setAttribute('aria-hidden', 'true'); };
  main.addEventListener('click', open);
  main.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  document.querySelector('.lb-close').onclick = close;
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.querySelectorAll('.lb-nav').forEach((btn) => btn.onclick = () => set(index + (btn.dataset.dir === 'next' ? 1 : -1)));
  document.addEventListener('keydown', (e) => {
    if (lb.classList.contains('hidden')) return;
    if (e.key === 'ArrowRight') set(index + 1);
    if (e.key === 'ArrowLeft') set(index - 1);
    if (e.key === 'Escape') close();
  });
}

function setupForm(car) {
  document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get('website')) return;
    if (!fd.get('gdpr')) return alert('Potvrďte souhlas se zpracováním údajů.');
    const subject = `Poptávka: ${car.title}`;
    const body = `Jméno: ${fd.get('name')}\nEmail: ${fd.get('email')}\nTelefon: ${fd.get('phone') || '-'}\n\nZpráva:\n${fd.get('message')}`;

    if (config.formMode === 'formspree' && config.formspreeEndpoint) {
      await fetch(config.formspreeEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(fd)) });
      alert('Zpráva byla odeslána.');
      return;
    }
    location.href = `mailto:${car.seller_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

function injectJsonLd(car) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: car.title,
    productionDate: `${car.year}`,
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: car.mileage_km, unitCode: 'KMT' },
    fuelType: car.fuel,
    vehicleTransmission: car.transmission,
    offers: { '@type': 'Offer', priceCurrency: 'CZK', price: car.price, availability: 'https://schema.org/InStock' }
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.append(script);
}

(async function init() {
  try {
    const cars = await loadCars();
    const id = qs('id');
    const car = getCarById(cars, id);
    if (!car) throw new Error('Vozidlo nebylo nalezeno.');
    document.title = `${car.title} | Auto nabídka`;
    render(car);
    setupGallery(car.images);
    setupForm(car);
    injectJsonLd(car);
  } catch (e) {
    document.getElementById('detailPage').innerHTML = `<p class="zero">${e.message}</p>`;
  }
})();
