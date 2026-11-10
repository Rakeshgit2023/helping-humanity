import { create } from 'zustand';

type PermissionState = 'unknown' | 'granted' | 'denied';

interface LocationState {
  socketConnected: boolean;
  permission: PermissionState;
  lastSentAt: number | null;
  lastCoords: { lat: number; lng: number } | null;
  setSocketConnected: (connected: boolean) => void;
  setPermission: (permission: PermissionState) => void;
  setLastSent: (coords: { lat: number; lng: number }) => void;
  reset: () => void;
}

const initial = {
  socketConnected: false,
  permission: 'unknown' as PermissionState,
  lastSentAt: null,
  lastCoords: null,
};

export const useLocationStore = create<LocationState>((set) => ({
  ...initial,
  setSocketConnected: (socketConnected) => set({ socketConnected }),
  setPermission: (permission) => set({ permission }),
  setLastSent: (lastCoords) => set({ lastCoords, lastSentAt: Date.now() }),
  reset: () => set(initial),
}));
