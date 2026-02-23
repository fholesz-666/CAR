const PAGE_SIZE = 12;
const FAV_KEY = 'car_favorites';
const CMP_KEY = 'car_compare';

export const formatPrice = (price) => `${price.toLocaleString('cs-CZ')} Kč`;
const fuelMap = { petrol: 'Benzín', diesel: 'Diesel', hybrid: 'Hybrid', ev: 'EV', lpg: 'LPG', cng: 'CNG' };

function getStored(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}
function setStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function renderTagChips(tags, container, selectedTags, onToggle) {
  container.innerHTML = tags.map((tag) => `<button class="chip ${selectedTags.includes(tag) ? 'active' : ''}" data-tag="${tag}">${tag}</button>`).join('');
  container.querySelectorAll('.chip').forEach((chip) => chip.addEventListener('click', () => onToggle(chip.dataset.tag)));
}

export function renderCars(cars, grid, limit) {
  const fav = getStored(FAV_KEY);
  const cmp = getStored(CMP_KEY);
  grid.innerHTML = cars.slice(0, limit).map((car) => `
    <article class="card">
      <img src="${car.images[0]}" alt="${car.title}" loading="lazy" />
      <div class="card-content">
        <h3>${car.title}</h3>
        <p class="price">${formatPrice(car.price)}</p>
        <p class="meta"><span>${car.year}</span><span>${car.mileage_km.toLocaleString('cs-CZ')} km</span><span>${fuelMap[car.fuel] || car.fuel}</span><span>${car.transmission === 'auto' ? 'Automat' : 'Manuál'}</span><span>${car.power_kw} kW</span></p>
        <div class="badges">${car.tags.map((t) => `<span class="badge">${t}</span>`).join('')}</div>
        <div class="meta">
          <button class="btn js-fav" data-id="${car.id}" aria-label="Oblíbené">${fav.includes(car.id) ? '♥ Oblíbené' : '♡ Oblíbené'}</button>
          <button class="btn js-compare" data-id="${car.id}">${cmp.includes(car.id) ? '✓ V porovnání' : '+ Porovnat'}</button>
          <a class="btn btn-primary" href="car.html?id=${car.id}">Detail</a>
        </div>
      </div>
    </article>
  `).join('');
}

export function canLoadMore(total, shown) {
  return total > shown;
}

export function nextLimit(current) {
  return current + PAGE_SIZE;
}

export function toggleFavorite(id) {
  const fav = getStored(FAV_KEY);
  const next = fav.includes(id) ? fav.filter((x) => x !== id) : [...fav, id];
  setStored(FAV_KEY, next);
}

export function toggleCompare(id) {
  const cmp = getStored(CMP_KEY);
  if (cmp.includes(id)) {
    setStored(CMP_KEY, cmp.filter((x) => x !== id));
    return;
  }
  if (cmp.length >= 3) return;
  setStored(CMP_KEY, [...cmp, id]);
}

export function renderCompare(cars, root) {
  const cmp = getStored(CMP_KEY);
  const selected = cars.filter((c) => cmp.includes(c.id));
  if (!selected.length) {
    root.innerHTML = '<p>Nemáte vybrané žádné auto k porovnání.</p>';
    return;
  }
  const rows = [
    ['Cena', (c) => formatPrice(c.price)],
    ['Rok', (c) => c.year],
    ['Nájezd', (c) => `${c.mileage_km.toLocaleString('cs-CZ')} km`],
    ['Palivo', (c) => fuelMap[c.fuel] || c.fuel],
    ['Převodovka', (c) => c.transmission],
    ['Výkon', (c) => `${c.power_kw} kW`],
    ['Lokalita', (c) => c.location]
  ];
  root.innerHTML = `
    <table class="compare-table">
      <thead><tr><th>Parametr</th>${selected.map((c) => `<th>${c.title}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(([label, fn]) => `<tr><td>${label}</td>${selected.map((c) => `<td>${fn(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
}
