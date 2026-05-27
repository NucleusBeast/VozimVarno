import { useConvexAuth } from '@convex-dev/auth/react';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native';

import { AUTH_BYPASS_ENABLED } from './src/constants';
import { ActiveRideScreen } from './src/screens/ActiveRideScreen';
import { ChallengesScreen } from './src/screens/ChallengesScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { PrepareScreen } from './src/screens/PrepareScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { RatingScreen } from './src/screens/RatingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { styles } from './src/styles';
import type { Screen } from './src/types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [splashFinished, setSplashFinished] = useState(false);
  const [rideSeconds, setRideSeconds] = useState(0);
  const { isLoading, isAuthenticated } = useConvexAuth();
  const authReady = AUTH_BYPASS_ENABLED || !isLoading;
  const canUseApp = AUTH_BYPASS_ENABLED || isAuthenticated;

  const go = (next: Screen) => setScreen(next);
  const startRide = () => {
    setRideSeconds(0);
    setScreen('active');
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSplashFinished(true);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!splashFinished || !authReady) {
      return;
    }

    if (screen === 'splash') {
      setScreen(canUseApp ? 'home' : 'login');
      return;
    }

    if (canUseApp && screen === 'login') {
      setScreen('home');
      return;
    }

    if (!canUseApp && screen !== 'login') {
      setScreen('login');
    }
  }, [authReady, canUseApp, screen, splashFinished]);

  const content = useMemo(() => {
    if (!splashFinished || screen === 'splash') {
      return <SplashScreen />;
    }

    if (!authReady) {
      return <LoadingScreen />;
    }

    switch (screen) {
      case 'login':
        return <LoginScreen go={go} />;
      case 'home':
        return <HomeScreen go={go} />;
      case 'prepare':
        return <PrepareScreen go={go} startRide={startRide} />;
      case 'active':
        return <ActiveRideScreen go={go} elapsedSeconds={rideSeconds} setElapsedSeconds={setRideSeconds} />;
      case 'summary':
        return <SummaryScreen go={go} elapsedSeconds={rideSeconds} />;
      case 'history':
        return <HistoryScreen go={go} />;
      case 'details':
        return <DetailsScreen go={go} />;
      case 'rating':
        return <RatingScreen go={go} />;
      case 'challenges':
        return <ChallengesScreen go={go} />;
      case 'profile':
        return <ProfileScreen go={go} />;
      case 'settings':
        return <SettingsScreen go={go} />;
      default:
        return <HomeScreen go={go} />;
    }
  }, [screen, rideSeconds, authReady, splashFinished]);

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style={screen === 'splash' ? 'light' : 'dark'} />
      {content}
    </SafeAreaView>
  );
}
