import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Linking, Text, View } from 'react-native';
import { Camera, Check, Gauge, MapPin, Mic, Shield, X } from 'lucide-react-native';
import * as ExpoCamera from 'expo-camera';
import * as Location from 'expo-location';
import type { PermissionResponse } from 'expo-modules-core';

import { Header, PhoneFrame } from '../components/layout';
import { PrimaryButton } from '../components/PrimaryButton';
import { BLUE, GREEN, RED } from '../constants';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

type NativePermission = {
  granted: boolean;
  canAskAgain: boolean;
  status: PermissionResponse['status'] | 'checking';
};

type PermissionState = {
  camera: NativePermission;
  gps: NativePermission & { servicesEnabled: boolean };
  microphone: NativePermission;
};

const checkingPermission: NativePermission = {
  granted: false,
  canAskAgain: true,
  status: 'checking',
};

const initialPermissions: PermissionState = {
  camera: checkingPermission,
  gps: { ...checkingPermission, servicesEnabled: true },
  microphone: checkingPermission,
};

export function PrepareScreen({ go, startRide }: { go: GoToScreen; startRide: () => void }) {
  const [permissions, setPermissions] = useState<PermissionState>(initialPermissions);
  const [isChecking, setIsChecking] = useState(true);

  const refreshPermissions = useCallback(async () => {
    setIsChecking(true);

    try {
      const [camera, gps, microphone, gpsServicesEnabled] = await Promise.all([
        ExpoCamera.Camera.getCameraPermissionsAsync(),
        Location.getForegroundPermissionsAsync(),
        ExpoCamera.Camera.getMicrophonePermissionsAsync(),
        Location.hasServicesEnabledAsync(),
      ]);

      setPermissions({
        camera,
        gps: {
          ...gps,
          granted: gps.granted && gpsServicesEnabled,
          servicesEnabled: gpsServicesEnabled,
        },
        microphone,
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    void refreshPermissions();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshPermissions();
      }
    });

    return () => subscription.remove();
  }, [refreshPermissions]);

  const canStartRide = permissions.camera.granted && permissions.gps.granted && permissions.microphone.granted;
  const mustOpenSettings = !permissions.camera.canAskAgain || !permissions.gps.canAskAgain || !permissions.microphone.canAskAgain || !permissions.gps.servicesEnabled;

  const permissionStatus = (permission: NativePermission, deniedText = 'Ni dovoljeno') => {
    if (isChecking || permission.status === 'checking') {
      return 'Preverjam...';
    }

    if (permission.granted) {
      return 'Dovoljeno';
    }

    return permission.canAskAgain ? deniedText : 'Zavrnjeno v sistemu';
  };

  const checks = useMemo(() => [
    { label: 'Kamera', status: permissionStatus(permissions.camera), enabled: permissions.camera.granted, Icon: Camera },
    {
      label: 'GPS',
      status: permissions.gps.servicesEnabled ? permissionStatus(permissions.gps) : 'Lokacijske storitve so izklopljene',
      enabled: permissions.gps.granted,
      Icon: MapPin,
    },
    { label: 'Pospeskometer', status: 'Povezano', enabled: true, Icon: Gauge },
    { label: 'Mikrofon', status: permissionStatus(permissions.microphone), enabled: permissions.microphone.granted, Icon: Mic },
    { label: 'Shranjevanje', status: 'Dovoljeno', enabled: true, Icon: Shield },
  ], [isChecking, permissions]);

  const requestMissingPermissions = async () => {
    if (mustOpenSettings) {
      await Linking.openSettings();
      return;
    }

    setIsChecking(true);

    try {
      if (!permissions.camera.granted && permissions.camera.canAskAgain) {
        await ExpoCamera.Camera.requestCameraPermissionsAsync();
      }

      if (!permissions.gps.granted && permissions.gps.canAskAgain) {
        await Location.requestForegroundPermissionsAsync();
      }

      if (!permissions.microphone.granted && permissions.microphone.canAskAgain) {
        await ExpoCamera.Camera.requestMicrophonePermissionsAsync();
      }

      await refreshPermissions();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <PhoneFrame>
      <Header title="Nova voznja" back="home" go={go} />
      <View style={styles.content}>
        <Text style={styles.sectionIntro}>Pred zacetkom preveri:</Text>
        <View style={styles.checkList}>
          {checks.map(({ label, status, enabled, Icon }) => (
            <View key={label} style={styles.checkRow}>
              <View style={[styles.checkCircle, !enabled && styles.checkCircleDisabled]}>
                {enabled ? <Check size={18} color={GREEN} strokeWidth={3} /> : <X size={18} color={RED} strokeWidth={3} />}
              </View>
              <Icon size={20} color={enabled ? BLUE : RED} />
              <View>
                <Text style={styles.checkLabel}>{label}</Text>
                <Text style={[styles.checkStatus, !enabled && styles.checkStatusError]}>{isChecking ? 'Preverjam...' : status}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.flexSpacer} />
        {!canStartRide && !isChecking ? (
          <Text style={styles.permissionHint}>
            {mustOpenSettings
              ? 'Za zacetek voznje omogoci kamero, GPS in mikrofon v sistemskih nastavitvah.'
              : 'Za zacetek voznje dovoli kamero, GPS in mikrofon.'}
          </Text>
        ) : null}
        <PrimaryButton
          title={isChecking ? 'Preverjam...' : canStartRide ? 'Zacni voznjo' : mustOpenSettings ? 'Odpri nastavitve' : 'Dovoli dovoljenja'}
          onPress={canStartRide ? startRide : requestMissingPermissions}
          disabled={isChecking}
        />
      </View>
    </PhoneFrame>
  );
}
