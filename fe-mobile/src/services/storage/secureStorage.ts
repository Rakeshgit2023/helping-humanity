import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const webStorage = {
  async getItem(key: string): Promise<string | null> {
    return window.localStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  },
};

const nativeStorage = {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

export const secureStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
