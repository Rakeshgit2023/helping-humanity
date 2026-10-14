import { io, type Socket } from 'socket.io-client';

import { env } from '@/config/env';
import { STORAGE_KEYS } from '@/constants/config';
import { secureStorage } from '@/services/storage/secureStorage';

let socket: Socket | null = null;

export const socketClient = {
  connect(): Socket {
    if (socket) return socket;

    socket = io(env.apiUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      // Callback form: re-reads the token on every (re)connect attempt.
      auth: (cb) => {
        secureStorage.getItem(STORAGE_KEYS.accessToken).then((token) => cb({ token }));
      },
    });

    return socket;
  },

  emit(event: string, payload: unknown): boolean {
    if (!socket?.connected) return false;
    socket.emit(event, payload);
    return true;
  },

  disconnect(): void {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
  },
};
