import type React from 'react';

export type Screen =
  | 'splash'
  | 'login'
  | 'home'
  | 'prepare'
  | 'active'
  | 'summary'
  | 'history'
  | 'details'
  | 'rating'
  | 'challenges'
  | 'profile'
  | 'settings';

export type GoToScreen = (screen: Screen) => void;

export type IconType = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}>;
