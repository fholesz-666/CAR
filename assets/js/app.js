import { loadCars, saveCars } from './data.js';
import { applyFilters, sortCars } from './filters.js';
import {
  renderCars,
  canLoadMore,
  nextLimit,
  renderTagChips,
  toggleFavorite,
  toggleCompare,
  renderCompare
} from './ui.js';

const ADMIN_PASSWORD = 'MF123';

const state = {
  q: '', minPrice: '', maxPrice: '', minYear: '', maxYear: '', maxMileage: '', minPower: '',
  location: '', transmission: '', fuels: [], tags: [], onlyRecent: false, sort: 'newest'
};

let allCars = [];
let shown = 12;
let adminUnlocked = false;

const debounce = (fn, ms = 250) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

function readQuery() {
  const p = new URLSearchParams(location.search);
  state.q = p.get('q') || '';
  ['minPrice', 'maxPrice', 'minYear', 'maxYear', 'maxMileage', 'minPower', 'location', 'transmission', 'sort'].forEach((k) => state[k] = p.get(k) || state[k]);
  state.fuels = (p.get('fuel') || '').split(',').filter(Boolean);
  state.tags = (p.get('tags') || '').split(',').filter(Boolean);
  state.onlyRecent = p.get('recent') === '1';
}

function writeQuery() {
  const p = new URLSearchParams();
  Object.entries(state).forEach(([k, v]) => {
    if (Array.isArray(v) && v.length) p.set(k === 'fuels' ? 'fuel' : k, v.join(','));
    else if (typeof v === 'boolean' && v) p.set('recent', '1');
    else if (v && typeof v !== 'boolean') p.set(k, v);
  });
  history.replaceState(null, '', `?${p.toString()}`);
}

function bindCardActions() {
  document.querySelectorAll('.js-fav').forEach((btn) => btn.onclick = () => { toggleFavorite(btn.dataset.id); update(); });
  document.querySelectorAll('.js-compare').forEach((btn) => btn.onclick = () => { toggleCompare(btn.dataset.id); update(); });
}

function fillLocations() {
  const select = document.getElementById('location');
  const currentValue = state.location;
  select.innerHTML = '<option value="">Všechny</option>';
  [...new Set(allCars.map((c) => c.location))].sort().forEach((loc) => {
    select.insertAdjacentHTML('beforeend', `<option value="${loc}">${loc}</option>`);
  });
  select.value = currentValue;
}

function setupTagChips() {
  const tags = [...new Set(allCars.flatMap((c) => c.tags))].sort();
  renderTagChips(tags, document.getElementById('tagChips'), state.tags, (tag) => {
    state.tags = state.tags.includes(tag) ? state.tags.filter((t) => t !== tag) : [...state.tags, tag];
    shown = 12;
    setupTagChips();
    update();
  });
}

function refreshDataDerivedUI() {
  fillLocations();
  setupTagChips();
}

const update = () => {
  writeQuery();
  const filtered = sortCars(applyFilters(allCars, state), state.sort);
  renderCars(filtered, document.querySelector('#carsGrid'), shown);
  document.querySelector('#resultCount').textContent = `${filtered.length} vozů`;
  document.querySelector('#zeroState').classList.toggle('hidden', filtered.length !== 0);
  document.querySelector('#loadMore').classList.toggle('hidden', !canLoadMore(filtered.length, shown));
  bindCardActions();
  renderAdminList();
};

function bindFormControls() {
  const sync = debounce(update, 150);
  ['q', 'minPrice', 'maxPrice', 'minYear', 'maxYear', 'maxMileage', 'minPower', 'location', 'sort'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = state[id] || '';
    el.addEventListener('input', (e) => { state[id] = e.target.value; shown = 12; sync(); });
    el.addEventListener('change', (e) => { state[id] = e.target.value; shown = 12; sync(); });
  });

  document.querySelectorAll('[name="transmission"]').forEach((r) => {
    r.checked = r.value === state.transmission;
    r.addEventListener('change', (e) => { state.transmission = e.target.value; shown = 12; update(); });
  });
  document.querySelectorAll('[name="fuel"]').forEach((c) => {
    c.checked = state.fuels.includes(c.value);
    c.addEventListener('change', () => {
      state.fuels = [...document.querySelectorAll('[name="fuel"]:checked')].map((x) => x.value);
      shown = 12;
      update();
    });
  });
  document.getElementById('onlyRecent').checked = state.onlyRecent;
  document.getElementById('onlyRecent').addEventListener('change', (e) => { state.onlyRecent = e.target.checked; shown = 12; update(); });
  document.getElementById('resetFilters').addEventListener('click', () => {
    Object.assign(state, { q: '', minPrice: '', maxPrice: '', minYear: '', maxYear: '', maxMileage: '', minPower: '', location: '', transmission: '', fuels: [], tags: [], onlyRecent: false, sort: 'newest' });
    location.search = '';
  });

  document.getElementById('loadMore').addEventListener('click', () => { shown = nextLimit(shown); update(); });
}

function getField(id) {
  return document.getElementById(id).value.trim();
}

function parseCommaList(value) {
  return value.split(',').map((x) => x.trim()).filter(Boolean);
}

function normalizeId(value) {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function renderAdminList() {
  const list = document.getElementById('adminList');
  if (!list) return;
  list.innerHTML = allCars.map((car) => `
    <li>
      <span>${car.title} <small>(${car.id})</small></span>
      <button class="btn js-delete-ad" data-id="${car.id}" type="button">Smazat</button>
    </li>
  `).join('');

  list.querySelectorAll('.js-delete-ad').forEach((btn) => {
    btn.onclick = () => {
      if (!adminUnlocked) return;
      const { id } = btn.dataset;
      allCars = allCars.filter((car) => car.id !== id);
      saveCars(allCars);
      refreshDataDerivedUI();
      update();
    };
  });
}

function bindAdmin() {
  const dialog = document.getElementById('adminDialog');
  const panel = document.getElementById('adminPanel');
  const pwd = document.getElementById('adminPassword');

  document.getElementById('adminOpen').addEventListener('click', () => dialog.showModal());
  document.getElementById('adminClose').addEventListener('click', () => dialog.close());

  document.getElementById('adminUnlock').addEventListener('click', () => {
    if (pwd.value === ADMIN_PASSWORD) {
      adminUnlocked = true;
      panel.classList.remove('hidden');
      pwd.value = '';
      renderAdminList();
      return;
    }
    alert('Neplatné heslo.');
  });

  document.getElementById('adminAdd').addEventListener('click', () => {
    if (!adminUnlocked) {
      alert('Nejprve odemkněte správu heslem.');
      return;
    }

    const id = normalizeId(getField('adId'));
    const title = getField('adTitle');
    const price = Number(getField('adPrice'));
    const year = Number(getField('adYear'));
    const mileage_km = Number(getField('adMileage'));
    const power_kw = Number(getField('adPower'));
    const engine = getField('adEngine');
    const locationName = getField('adLocation');
    const seller_phone = getField('adPhone');
    const seller_email = getField('adEmail');
    const transmission = getField('adTransmission');
    const fuel = getField('adFuel');
    const condition = getField('adCondition');
    const vin = getField('adVin');
    const description = getField('adDescription');
    const features = parseCommaList(getField('adFeatures'));
    const tags = parseCommaList(getField('adTags'));
    const images = parseCommaList(getField('adImages'));

    if (!id || !title || !price || !year || !mileage_km || !power_kw || !engine || !locationName || !seller_phone || !seller_email || !description) {
      alert('Vyplňte všechna povinná pole označená *.');
      return;
    }
    if (allCars.some((car) => car.id === id)) {
      alert('ID už existuje. Použijte unikátní ID.');
      return;
    }

    const newCar = {
      id,
      title,
      price,
      year,
      mileage_km,
      transmission,
      fuel,
      power_kw,
      engine,
      vin,
      location: locationName,
      seller_phone,
      seller_email,
      description,
      features,
      images: images.length ? images : ['images/cars/skoda-octavia-tdi-2020/01.svg'],
      condition,
      tags,
      created_at: new Date().toISOString()
    };

    allCars = [newCar, ...allCars];
    saveCars(allCars);
    refreshDataDerivedUI();
    shown = 12;
    update();
    alert('Inzerát byl přidán.');
  });
}

(async function init() {
  document.getElementById('yearNow').textContent = new Date().getFullYear();
  try {
    readQuery();
    allCars = await loadCars();
    refreshDataDerivedUI();
    bindFormControls();
    bindAdmin();
    update();

    const dialog = document.getElementById('compareDialog');
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'p') {
        renderCompare(allCars, document.getElementById('compareContent'));
        dialog.showModal();
      }
    });
  } catch (e) {
    document.querySelector('#carsGrid').innerHTML = `<p class="zero">${e.message}</p>`;
  }
})();
