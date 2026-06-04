import { useConvexAuth } from '@convex-dev/auth/react';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';

import { NavigationProvider } from './src/navigation';
import { AUTH_BYPASS_ENABLED } from './src/constants';
import { useRideSession } from './src/hooks/useRideSession';
import { ActiveRideScreen } from './src/screens/ActiveRideScreen';
import { ChallengesScreen } from './src/screens/ChallengesScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { PrepareScreen } from './src/screens/PrepareScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { RatingHistoryScreen } from './src/screens/RatingHistoryScreen';
import { RatingScreen } from './src/screens/RatingScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { useAppStyles } from './src/styles';
import { useTheme } from './src/theme/ThemeContext';
import type { NavParams, Ride, Screen } from './src/types';

export default function App() {
  const [splashFinished, setSplashFinished] = useState(false);
  const { isLoading, isAuthenticated } = useConvexAuth();
  const authReady = AUTH_BYPASS_ENABLED || !isLoading;
  const canUseApp = AUTH_BYPASS_ENABLED || isAuthenticated;

  const [completedRide, setCompletedRide] = useState<Ride | null>(null);

  const rideSession = useRideSession();
  const styles = useAppStyles();
  const { isDark } = useTheme();

  useEffect(() => {
    const id = setTimeout(() => setSplashFinished(true), 2000);
    return () => clearTimeout(id);
  }, []);

  function renderScreen(screen: Screen, params: NavParams, go: (s: Screen, p?: NavParams) => void) {
    if (!splashFinished) return <SplashScreen />;
    if (!authReady) return <LoadingScreen />;

    if (!canUseApp && screen !== 'login') {
      return <LoginScreen go={go} />;
    }
    if (canUseApp && screen === 'login') {
      return <HomeScreen go={go} />;
    }

    switch (screen) {
      case 'login':
        return <LoginScreen go={go} />;
      case 'home':
        return <HomeScreen go={go} />;
      case 'prepare':
        return (
          <PrepareScreen
            go={go}
            startRide={async () => {
              await rideSession.start();
              go('active');
            }}
          />
        );
      case 'active':
        return (
          <ActiveRideScreen
            go={go}
            elapsedSeconds={rideSession.elapsedSeconds}
            incidents={rideSession.incidents}
            currentSpeedKmh={rideSession.currentSpeedKmh}
            gpsStatus={rideSession.gpsStatus}
            fatigueResult={rideSession.fatigueResult}
            onEndRide={async () => {
              const ride = await rideSession.end();
              setCompletedRide(ride);
              go('summary');
            }}
          />
        );
      case 'summary':
        return (
          <SummaryScreen
            go={go}
            ride={completedRide}
            elapsedSeconds={rideSession.elapsedSeconds}
            rideId={params.rideId}
          />
        );
      case 'results':
        return <ResultsScreen go={go} />;
      case 'history':
        return <HistoryScreen go={go} />;
      case 'details':
        return <DetailsScreen go={go} rideId={params.rideId} />;
      case 'rating':
        return <RatingScreen go={go} ride={completedRide} />;
      case 'ratingHistory':
        return <RatingHistoryScreen go={go} />;
      case 'challenges':
        return <ChallengesScreen go={go} />;
      case 'profile':
        return <ProfileScreen go={go} />;
      case 'settings':
        return <SettingsScreen go={go} />;
      default:
        return <HomeScreen go={go} />;
    }
  }

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style={!splashFinished ? 'light' : isDark ? 'light' : 'dark'} />
      <NavigationProvider
        initialScreen="splash"
        onScreenChange={() => {}}
      >
        {(screen, params, go) => renderScreen(screen, params, go)}
      </NavigationProvider>
    </SafeAreaView>
  );
}
