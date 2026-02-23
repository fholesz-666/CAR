const CACHE_KEY = 'cars_cache_v1';

export async function loadCars() {
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

export function getCarById(cars, id) {
  return cars.find((car) => car.id === id);
}
