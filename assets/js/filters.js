const isRecent = (createdAt) => Date.now() - new Date(createdAt).getTime() <= 1000 * 60 * 60 * 24 * 30;

export function applyFilters(cars, state) {
  return cars.filter((car) => {
    const q = state.q.toLowerCase();
    const haystack = `${car.title} ${car.description} ${car.tags.join(' ')}`.toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (state.minPrice && car.price < Number(state.minPrice)) return false;
    if (state.maxPrice && car.price > Number(state.maxPrice)) return false;
    if (state.minYear && car.year < Number(state.minYear)) return false;
    if (state.maxYear && car.year > Number(state.maxYear)) return false;
    if (state.maxMileage && car.mileage_km > Number(state.maxMileage)) return false;
    if (state.minPower && car.power_kw < Number(state.minPower)) return false;
    if (state.location && car.location !== state.location) return false;
    if (state.transmission && car.transmission !== state.transmission) return false;
    if (state.fuels.length && !state.fuels.includes(car.fuel)) return false;
    if (state.tags.length && !state.tags.every((t) => car.tags.includes(t))) return false;
    if (state.onlyRecent && !isRecent(car.created_at)) return false;
    return true;
  });
}

export function sortCars(cars, sort) {
  const map = {
    newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    priceAsc: (a, b) => a.price - b.price,
    priceDesc: (a, b) => b.price - a.price,
    mileageAsc: (a, b) => a.mileage_km - b.mileage_km,
    yearDesc: (a, b) => b.year - a.year
  };
  return [...cars].sort(map[sort] || map.newest);
}
