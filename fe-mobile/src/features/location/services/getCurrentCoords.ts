import * as Location from 'expo-location';

import { useLocationStore } from '@/store/locationStore';

/** Best available position: last streamed fix, else ask the OS. null = no permission / no fix. */
export async function getCurrentCoords(): Promise<{ lat: number; lng: number } | null> {
  const cached = useLocationStore.getState().lastCoords;
  if (cached) return cached;

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const position =
      (await Location.getLastKnownPositionAsync()) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}
