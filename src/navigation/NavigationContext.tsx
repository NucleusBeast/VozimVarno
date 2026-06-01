import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';

import type { NavParams, Screen } from '../types';

type NavContextType = {
  currentScreen: Screen;
  params: NavParams;
  go: (screen: Screen, params?: NavParams) => void;
  back: () => void;
  canGoBack: boolean;
};

const NavigationContext = createContext<NavContextType | null>(null);

type Props = {
  children: (screen: Screen, params: NavParams, go: (s: Screen, p?: NavParams) => void) => React.ReactNode;
  initialScreen?: Screen;
  onScreenChange?: (screen: Screen) => void;
};

export function NavigationProvider({ children, initialScreen = 'splash', onScreenChange }: Props) {
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);
  const [params, setParams] = useState<NavParams>({});
  const historyRef = useRef<Array<{ screen: Screen; params: NavParams }>>([]);

  const go = useCallback((screen: Screen, nextParams: NavParams = {}) => {
    setCurrentScreen((prev) => {
      historyRef.current.push({ screen: prev, params });
      return screen;
    });
    setParams(nextParams);
    onScreenChange?.(screen);
  }, [params, onScreenChange]);

  const back = useCallback(() => {
    const entry = historyRef.current.pop();
    if (entry) {
      setCurrentScreen(entry.screen);
      setParams(entry.params);
      onScreenChange?.(entry.screen);
    }
  }, [onScreenChange]);

  const canGoBack = historyRef.current.length > 0;

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (historyRef.current.length > 0) {
        back();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [back]);

  return (
    <NavigationContext.Provider value={{ currentScreen, params, go, back, canGoBack }}>
      {children(currentScreen, params, go)}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavContextType {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used inside NavigationProvider');
  }
  return ctx;
}
