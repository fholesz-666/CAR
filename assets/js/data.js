const CACHE_KEY = 'cars_cache_v1';
const LOCAL_CARS_KEY = 'cars_local_override_v1';

export async function loadCars() {
  const localCars = localStorage.getItem(LOCAL_CARS_KEY);
  if (localCars) {
    return JSON.parse(localCars);
  }

  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const response = await fetch('./data/cars.json');
    if (!response.ok) throw new Error('Nelze načíst data');
    const cars = await response.json();
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cars));
    return cars;
  } catch (error) {
    throw new Error('Načtení nabídky selhalo. Spusťte web přes static server.');
  }
}

export function saveCars(cars) {
  localStorage.setItem(LOCAL_CARS_KEY, JSON.stringify(cars));
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(cars));
}

export function getCarById(cars, id) {
  return cars.find((car) => car.id === id);
}
