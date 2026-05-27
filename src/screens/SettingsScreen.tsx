import { Pressable, Switch, Text, View } from 'react-native';
import { Bell, Camera, Clock3, Gauge, Info, Lock, MapPin, Mic, User } from 'lucide-react-native';
import { useMutation, useQuery } from 'convex/react';

import { Header, PhoneFrame } from '../components/layout';
import { SettingsRow } from '../components/metrics';
import { BLUE, MUTED } from '../constants';
import { styles } from '../styles';
import type { GoToScreen } from '../types';
import { api } from '../../backend/convex/_generated/api';

type SpeedUnit = 'kmh' | 'mph';
type Theme = 'light' | 'dark';

export function SettingsScreen({ go }: { go: GoToScreen }) {
  const settings = useQuery(api.settings.viewer);
  const updateSettings = useMutation(api.settings.update);

  const notificationsEnabled = settings?.notificationsEnabled ?? true;
  const cameraEnabled = settings?.cameraEnabled ?? true;
  const gpsEnabled = settings?.gpsEnabled ?? true;
  const microphoneEnabled = settings?.microphoneEnabled ?? true;
  const speedUnit = settings?.speedUnit ?? 'kmh';
  const theme = settings?.theme ?? 'light';

  const update = (patch: Parameters<typeof updateSettings>[0]) => {
    void updateSettings(patch);
  };

  return (
    <PhoneFrame>
      <Header title="Nastavitve" back="home" go={go} />
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
            <SegmentedControl<Theme>
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
          trailing={<SettingsSwitch value={cameraEnabled} onValueChange={(value) => update({ cameraEnabled: value })} />}
        />
        <SettingsRow
          title="GPS"
          subtitle={gpsEnabled ? 'Dovoljeno' : 'Izklopljeno'}
          Icon={MapPin}
          trailing={<SettingsSwitch value={gpsEnabled} onValueChange={(value) => update({ gpsEnabled: value })} />}
        />
        <SettingsRow
          title="Mikrofon"
          subtitle={microphoneEnabled ? 'Dovoljeno' : 'Izklopljeno'}
          Icon={Mic}
          trailing={<SettingsSwitch value={microphoneEnabled} onValueChange={(value) => update({ microphoneEnabled: value })} />}
        />
        <SettingsRow title="O aplikaciji" subtitle="VozimVarno v1.0.0" Icon={Info} />
      </View>
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
