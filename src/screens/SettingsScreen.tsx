import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Bell, Camera, Clock3, Gauge, Info, Lock, MapPin, Mic, User } from 'lucide-react-native';
import { useMutation, useQuery } from 'convex/react';

import { Header, PhoneFrame } from '../components/layout';
import { SettingsRow } from '../components/metrics';
import { BLUE, MUTED } from '../constants';
import { loadSettings, saveSettings } from '../services/storage/settingsStorage';
import { styles } from '../styles';
import type { AppTheme, GoToScreen, SpeedUnit, UserSettings } from '../types';
import { api } from '../../backend/convex/_generated/api';

export function SettingsScreen({ go }: { go: GoToScreen }) {
  const convexSettings = useQuery(api.settings.viewer);
  const updateConvex = useMutation(api.settings.update);
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);

  // Load local settings as fallback
  useEffect(() => {
    loadSettings().then(setLocalSettings);
  }, []);

  // When Convex settings arrive, sync them locally
  useEffect(() => {
    if (convexSettings) {
      void saveSettings({
        notificationsEnabled: convexSettings.notificationsEnabled,
        speedUnit: convexSettings.speedUnit,
        theme: convexSettings.theme,
        cameraEnabled: convexSettings.cameraEnabled,
        gpsEnabled: convexSettings.gpsEnabled,
        microphoneEnabled: convexSettings.microphoneEnabled,
      });
    }
  }, [convexSettings]);

  const effective = convexSettings ?? localSettings;

  const notificationsEnabled = effective?.notificationsEnabled ?? true;
  const cameraEnabled = effective?.cameraEnabled ?? true;
  const gpsEnabled = effective?.gpsEnabled ?? true;
  const microphoneEnabled = effective?.microphoneEnabled ?? true;
  const speedUnit = effective?.speedUnit ?? 'kmh';
  const theme = effective?.theme ?? 'light';

  const update = (patch: Partial<UserSettings>) => {
    // Optimistically update local state
    setLocalSettings((prev) => (prev ? { ...prev, ...patch } : null));
    void saveSettings(patch);
    // Sync to Convex when online
    if (convexSettings !== undefined) {
      void updateConvex(patch as Parameters<typeof updateConvex>[0]);
    }
  };

  return (
    <PhoneFrame>
      <Header title="Nastavitve" back="home" go={go} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.settingsList}>
          <SettingsRow title="Racun" subtitle="Uredi profil" Icon={User} onPress={() => go('profile')} />
          <SettingsRow
            title="Obvestila"
            subtitle={notificationsEnabled ? 'Vklopljena' : 'Izklopljena'}
            Icon={Bell}
            trailing={
              <SettingsSwitch
                value={notificationsEnabled}
                onValueChange={(value) => update({ notificationsEnabled: value })}
              />
            }
          />
          <SettingsRow
            title="Enote"
            subtitle={speedUnit === 'kmh' ? 'Kilometri na uro' : 'Milje na uro'}
            Icon={Gauge}
            trailing={
              <SegmentedControl<SpeedUnit>
                value={speedUnit}
                options={[
                  ['kmh', 'km/h'],
                  ['mph', 'mph'],
                ]}
                onChange={(value) => update({ speedUnit: value })}
              />
            }
          />
          <SettingsRow
            title="Tema"
            subtitle={theme === 'light' ? 'Svetla' : 'Temna'}
            Icon={Clock3}
            trailing={
              <SegmentedControl<AppTheme>
                value={theme}
                options={[
                  ['light', 'Svetla'],
                  ['dark', 'Temna'],
                ]}
                onChange={(value) => update({ theme: value })}
              />
            }
          />
          <View style={styles.settingsSectionLabelWrap}>
            <Lock size={16} color={MUTED} />
            <Text style={styles.settingsSectionLabel}>Privoljenja</Text>
          </View>
          <SettingsRow
            title="Kamera"
            subtitle={cameraEnabled ? 'Dovoljeno' : 'Izklopljeno'}
            Icon={Camera}
            trailing={
              <SettingsSwitch
                value={cameraEnabled}
                onValueChange={(value) => update({ cameraEnabled: value })}
              />
            }
          />
          <SettingsRow
            title="GPS"
            subtitle={gpsEnabled ? 'Dovoljeno' : 'Izklopljeno'}
            Icon={MapPin}
            trailing={
              <SettingsSwitch
                value={gpsEnabled}
                onValueChange={(value) => update({ gpsEnabled: value })}
              />
            }
          />
          <SettingsRow
            title="Mikrofon"
            subtitle={microphoneEnabled ? 'Dovoljeno' : 'Izklopljeno'}
            Icon={Mic}
            trailing={
              <SettingsSwitch
                value={microphoneEnabled}
                onValueChange={(value) => update({ microphoneEnabled: value })}
              />
            }
          />
          {convexSettings === undefined && (
            <View style={styles.settingsSectionLabelWrap}>
              <Text style={[styles.settingsSectionLabel, { color: '#e8a800' }]}>Brez povezave — lokalne nastavitve</Text>
            </View>
          )}
          <SettingsRow title="O aplikaciji" subtitle="VozimVarno v1.0.0" Icon={Info} />
        </View>
      </ScrollView>
    </PhoneFrame>
  );
}

function SettingsSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchFrame}>
      <Switch
        style={styles.settingsSwitch}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: BLUE, false: '#cfd7e3' }}
        thumbColor="#ffffff"
        ios_backgroundColor="#cfd7e3"
      />
    </View>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmentedControl}>
      {options.map(([option, label]) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            style={[styles.segmentOption, selected && styles.segmentOptionActive]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
