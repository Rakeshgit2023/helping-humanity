import { useEffect } from 'react';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';

import { useAppStore } from '@/store/appStore';
import type { ThemeMode } from '@/theme';

export function useColorScheme(): ThemeMode {
  const preference = useAppStore((state) => state.colorSchemePreference);
  const { colorScheme, setColorScheme } = useNativewindColorScheme();

  useEffect(() => {
    setColorScheme(preference);
  }, [preference, setColorScheme]);

  return colorScheme === 'dark' ? 'dark' : 'light';
}
