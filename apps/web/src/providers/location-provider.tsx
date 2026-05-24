'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'offroad-selected-cities';

type LocationContextValue = {
  selectedCities: string[];
  setSelectedCities: (cities: string[]) => void;
  toggleCity: (city: string) => void;
  clearCities: () => void;
  hasFilter: boolean;
};

const LocationContext = createContext<LocationContextValue | null>(null);

function readStoredCities(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [selectedCities, setSelectedCitiesState] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelectedCitiesState(readStoredCities());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCities));
  }, [selectedCities, hydrated]);

  const setSelectedCities = useCallback((cities: string[]) => {
    setSelectedCitiesState([...new Set(cities)]);
  }, []);

  const toggleCity = useCallback((city: string) => {
    setSelectedCitiesState((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    );
  }, []);

  const clearCities = useCallback(() => setSelectedCitiesState([]), []);

  const value = useMemo(
    () => ({
      selectedCities,
      setSelectedCities,
      toggleCity,
      clearCities,
      hasFilter: selectedCities.length > 0,
    }),
    [selectedCities, setSelectedCities, toggleCity, clearCities],
  );

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
}

export function useLocationFilter() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocationFilter must be used within LocationProvider');
  }
  return ctx;
}
