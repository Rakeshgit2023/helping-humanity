import { brand } from '@/theme';

import type { HomeData } from '../types/home.types';

// MOCK for now. When the backend endpoint exists, replace the body with
// `apiClient.get<HomeData>(ENDPOINTS.home)` — the hook and UI stay untouched.
async function fetchHome(): Promise<HomeData> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    stats: { livesTouchedToday: 182, volunteersOnline: 1204 },
    nearbyRadiusKm: 3,
    volunteers: [
      { id: '1', name: 'Anita', accent: brand.teal },
      { id: '2', name: 'Vikram', accent: brand.marigold },
      { id: '3', name: 'Kishore', accent: brand.clay },
      { id: '4', name: 'Meena', accent: brand.leaf },
      { id: '5', name: 'Sanjay', accent: brand.purple },
    ],
    volunteersExtra: 18,
    impact: [
      { id: 'a', emoji: '🐕', soft: brand.tealSoft },
      { id: 'b', emoji: '🩸', soft: brand.claySoft },
      { id: 'c', emoji: '🍛', soft: brand.marigoldSoft },
    ],
  };
}

export const homeService = { fetchHome };
