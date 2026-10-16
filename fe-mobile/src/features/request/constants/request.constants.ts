import { CATEGORIES } from '@/constants/categories';
import { brand } from '@/theme';

import type { RequestPriority } from '../types/request.types';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const PRIORITIES: { id: RequestPriority; color: string }[] = [
  { id: 'Normal', color: brand.leaf },
  { id: 'High', color: brand.marigold },
  { id: 'Urgent', color: brand.clay },
];

/** Pre-filled text + emoji so the form never starts empty. */
export const CATEGORY_DEFAULTS: Record<
  string,
  { emoji: string; description: string; urgent: boolean }
> = {
  animal: {
    emoji: '🐕',
    description: "Injured dog near Sector 12 crossing, can't walk on front leg",
    urgent: false,
  },
  food: {
    emoji: '🍛',
    description: 'Fresh leftover food from guests, serves ~15 people',
    urgent: false,
  },
  blood: {
    emoji: '🩸',
    description: 'Newborn needs O+ blood urgently, City Hospital NICU',
    urgent: true,
  },
  clothes: {
    emoji: '👕',
    description: 'Winter clothes to give away, birthday give-back drive',
    urgent: false,
  },
  money: { emoji: '💰', description: 'Cash donation for birthday give-back drive', urgent: false },
};

export const MAX_PHOTOS = 2;

/** The radar widens in steps; each lasts STEP_SECONDS. */
export const SEARCH_STEPS = [
  { text: 'Searching volunteers near you', sub: 'Looking within 1 km', radius: '1 km' },
  { text: 'Alerting volunteers nearby', sub: 'Looking within 2 km', radius: '2 km' },
  { text: 'Expanding search radius', sub: 'Looking within 3 km', radius: '3 km' },
  {
    text: 'Waiting for a volunteer to accept',
    sub: 'Your request is live with volunteers nearby',
    radius: '3 km',
  },
] as const;
export const STEP_SECONDS = 3;

/** Fake volunteers that "appear" on the radar at `at` seconds. x/y are % of the map. */
export const RADAR_DOTS = [
  { x: 30, y: 30, at: 0.6, km: '0.4 km', min: '3 min' },
  { x: 72, y: 26, at: 1.8, km: '0.9 km', min: '6 min' },
  { x: 78, y: 64, at: 3.0, km: '1.3 km', min: '8 min' },
  { x: 22, y: 68, at: 4.4, km: '1.8 km', min: '11 min' },
  { x: 58, y: 80, at: 5.8, km: '2.4 km', min: '14 min' },
  { x: 44, y: 16, at: 7.2, km: '2.9 km', min: '16 min' },
] as const;

export const RADAR_VOLUNTEERS = [
  { name: 'Anita', accent: brand.teal },
  { name: 'Vikram', accent: brand.marigold },
  { name: 'Kishore', accent: brand.clay },
  { name: 'Meena', accent: brand.leaf },
  { name: 'Sanjay', accent: brand.purple },
];

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}
