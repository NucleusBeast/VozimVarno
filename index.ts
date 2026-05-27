import { registerRootComponent } from 'expo';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Platform, Text, View } from 'react-native';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexReactClient } from 'convex/react';

import App from './App';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

const memoryStorage: Record<string, string> = {};

const authStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }

    if (typeof SecureStore.getItemAsync === 'function') {
      return await SecureStore.getItemAsync(key);
    }

    return memoryStorage[key] ?? null;
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
      return;
    }

    if (typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    memoryStorage[key] = value;
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
      return;
    }

    if (typeof SecureStore.deleteItemAsync === 'function') {
      await SecureStore.deleteItemAsync(key);
      return;
    }

    delete memoryStorage[key];
  },
};

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function Root() {
  if (!convex) {
    return React.createElement(
      View,
      { style: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 } },
      React.createElement(
        Text,
        { style: { fontSize: 16, fontWeight: '700', textAlign: 'center' } },
        'Nastavi EXPO_PUBLIC_CONVEX_URL v .env.local.',
      ),
    );
  }

  return React.createElement(
    ConvexAuthProvider,
    { client: convex, storage: authStorage, children: React.createElement(App) },
  );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
