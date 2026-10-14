import { useEffect } from 'react';
import * as Location from 'expo-location';

import { LOCATION_TRACKING, SOCKET_EVENTS } from '@/constants/config';
import { socketClient } from '@/services/socket/socket.client';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';

/**
 * While the user is authenticated: open the socket, ask for location
 * permission, and stream lat/lng over the socket. Cleans up on logout.
 */
export function useLocationSharing() {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const { setSocketConnected, setPermission, setLastSent, reset } = useLocationStore.getState();
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    let latest: { lat: number; lng: number } | null = null;

    const send = (payload: { lat: number; lng: number }) => {
      const sent = socketClient.emit(SOCKET_EVENTS.locationUpdate, payload);
      console.log('[location]', sent ? 'sent' : 'not sent (socket offline)', payload);
      if (sent) setLastSent(payload);
    };

    const socket = socketClient.connect();
    socket.on('connect', () => {
      console.log('[socket] connected:', socket.id);
      setSocketConnected(true);
      // A fix may have arrived while the socket was still connecting/reconnecting.
      if (latest) send(latest);
    });
    socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected:', reason);
      setSocketConnected(false);
    });
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error:', err.message);
      setSocketConnected(false);
    });
    if (socket.connected) setSocketConnected(true);

    (async () => {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (permission !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: LOCATION_TRACKING.timeIntervalMs,
          distanceInterval: LOCATION_TRACKING.distanceIntervalM,
        },
        ({ coords }) => {
          latest = { lat: coords.latitude, lng: coords.longitude };
          send(latest);
        },
      );

      if (cancelled) sub.remove();
      else subscription = sub;
    })().catch((err) => console.warn('[location] failed:', err));

    return () => {
      cancelled = true;
      subscription?.remove();
      socketClient.disconnect();
      reset();
    };
  }, [status]);
}
