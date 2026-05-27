import { registerRootComponent } from 'expo';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Text, View } from 'react-native';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexReactClient } from 'convex/react';

import App from './App';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

const secureStore = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
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
    { client: convex, storage: secureStore, children: React.createElement(App) },
  );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
