import { loadCars } from './data.js';
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

const state = {
  q: '', minPrice: '', maxPrice: '', minYear: '', maxYear: '', maxMileage: '', minPower: '',
  location: '', transmission: '', fuels: [], tags: [], onlyRecent: false, sort: 'newest'
};

const debounce = (fn, ms = 250) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

function readQuery() {
  const p = new URLSearchParams(location.search);
  state.q = p.get('q') || '';
  ['minPrice','maxPrice','minYear','maxYear','maxMileage','minPower','location','transmission','sort'].forEach((k) => state[k] = p.get(k) || state[k]);
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

let allCars = [];
let shown = 12;
const update = () => {
  writeQuery();
  const filtered = sortCars(applyFilters(allCars, state), state.sort);
  renderCars(filtered, document.querySelector('#carsGrid'), shown);
  document.querySelector('#resultCount').textContent = `${filtered.length} vozů`;
  document.querySelector('#zeroState').classList.toggle('hidden', filtered.length !== 0);
  document.querySelector('#loadMore').classList.toggle('hidden', !canLoadMore(filtered.length, shown));
  bindCardActions();
};

function bindCardActions() {
  document.querySelectorAll('.js-fav').forEach((btn) => btn.onclick = () => { toggleFavorite(btn.dataset.id); update(); });
  document.querySelectorAll('.js-compare').forEach((btn) => btn.onclick = () => { toggleCompare(btn.dataset.id); update(); });
}

function bindFormControls() {
  const sync = debounce(update, 150);
  ['q','minPrice','maxPrice','minYear','maxYear','maxMileage','minPower','location','sort'].forEach((id) => {
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
      shown = 12; update();
    });
  });
  document.getElementById('onlyRecent').checked = state.onlyRecent;
  document.getElementById('onlyRecent').addEventListener('change', (e) => { state.onlyRecent = e.target.checked; shown = 12; update(); });
  document.getElementById('resetFilters').addEventListener('click', () => {
    Object.assign(state, { q:'',minPrice:'',maxPrice:'',minYear:'',maxYear:'',maxMileage:'',minPower:'',location:'',transmission:'',fuels:[],tags:[],onlyRecent:false,sort:'newest' });
    location.search = '';
  });

  document.getElementById('loadMore').addEventListener('click', () => { shown = nextLimit(shown); update(); });
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

function fillLocations() {
  const select = document.getElementById('location');
  [...new Set(allCars.map((c) => c.location))].sort().forEach((loc) => {
    select.insertAdjacentHTML('beforeend', `<option value="${loc}">${loc}</option>`);
  });
}

(async function init() {
  document.getElementById('yearNow').textContent = new Date().getFullYear();
  try {
    readQuery();
    allCars = await loadCars();
    fillLocations();
    bindFormControls();
    setupTagChips();
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
