import { create } from 'zustand';

type ColorSchemePreference = 'light' | 'dark' | 'system';

interface AppState {
  colorSchemePreference: ColorSchemePreference;
  setColorSchemePreference: (preference: ColorSchemePreference) => void;
}

export const useAppStore = create<AppState>((set) => ({
  colorSchemePreference: 'system',
  setColorSchemePreference: (preference) => set({ colorSchemePreference: preference }),
}));
