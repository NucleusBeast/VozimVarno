import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Bell, Camera, Clock3, Gauge, Info, Lock, MapPin, Mic, SlidersHorizontal, User } from 'lucide-react-native';
import { useMutation, useQuery } from 'convex/react';

import { Header, PhoneFrame } from '../components/layout';
import { SettingsRow } from '../components/metrics';
import { BLUE } from '../constants';
import { loadSettings, saveSettings, defaultSettings } from '../services/storage/settingsStorage';
import { seedDemoRide } from '../services/storage/rideStorage';
import { useAppStyles } from '../styles';
import { useTheme } from '../theme/ThemeContext';
import type { AppTheme, GoToScreen, IncidentThresholds, SpeedUnit, UserSettings } from '../types';
import { api } from '../../backend/convex/_generated/api';

export function SettingsScreen({ go }: { go: GoToScreen }) {
  const convexSettings = useQuery(api.settings.viewer);
  const updateConvex = useMutation(api.settings.update);
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);
  const [thresholds, setThresholds] = useState<IncidentThresholds>(defaultSettings.incidentThresholds);
  const [demoSeeded, setDemoSeeded] = useState(false);
  const { setTheme, colors } = useTheme();
  const styles = useAppStyles();

  useEffect(() => {
    loadSettings().then((s) => {
      setLocalSettings(s);
      setThresholds(s.incidentThresholds);
    });
  }, []);

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
    setLocalSettings((prev) => (prev ? { ...prev, ...patch } : null));
    void saveSettings(patch);
    if (patch.theme) setTheme(patch.theme);
    if (convexSettings !== undefined) {
      void updateConvex(patch as Parameters<typeof updateConvex>[0]);
    }
  };

  const updateThreshold = <K extends keyof IncidentThresholds>(key: K, value: number) => {
    const updated = { ...thresholds, [key]: value };
    setThresholds(updated);
    void saveSettings({ incidentThresholds: updated });
  };

  const handleSeedDemo = async () => {
    await seedDemoRide();
    setDemoSeeded(true);
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
            <Lock size={16} color={colors.textMuted} />
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

          <View style={styles.settingsSectionLabelWrap}>
            <SlidersHorizontal size={16} color={colors.textMuted} />
            <Text style={styles.settingsSectionLabel}>Pragi incidentov</Text>
          </View>

          <View style={styles.thresholdSection}>
            <ThresholdRow
              label="Pospesk (m/s²)"
              value={thresholds.hardAccelerationMs2}
              onDecrement={() =>
                updateThreshold('hardAccelerationMs2', Math.max(1.0, Math.round((thresholds.hardAccelerationMs2 - 0.5) * 10) / 10))
              }
              onIncrement={() =>
                updateThreshold('hardAccelerationMs2', Math.min(8.0, Math.round((thresholds.hardAccelerationMs2 + 0.5) * 10) / 10))
              }
            />
            <ThresholdRow
              label="Zaviranje (m/s²)"
              value={thresholds.hardBrakingMs2}
              onDecrement={() =>
                updateThreshold('hardBrakingMs2', Math.max(1.0, Math.round((thresholds.hardBrakingMs2 - 0.5) * 10) / 10))
              }
              onIncrement={() =>
                updateThreshold('hardBrakingMs2', Math.min(8.0, Math.round((thresholds.hardBrakingMs2 + 0.5) * 10) / 10))
              }
            />
            <ThresholdRow
              label="Zavoj (°/s)"
              value={thresholds.sharpTurnDegS}
              onDecrement={() =>
                updateThreshold('sharpTurnDegS', Math.max(15, thresholds.sharpTurnDegS - 5))
              }
              onIncrement={() =>
                updateThreshold('sharpTurnDegS', Math.min(90, thresholds.sharpTurnDegS + 5))
              }
            />
            <ThresholdRow
              label="Hrup (dB)"
              value={thresholds.noiseAlertDb}
              onDecrement={() =>
                updateThreshold('noiseAlertDb', Math.max(-60, thresholds.noiseAlertDb - 5))
              }
              onIncrement={() =>
                updateThreshold('noiseAlertDb', Math.min(-5, thresholds.noiseAlertDb + 5))
              }
            />
            <ThresholdRow
              label="Omejitev hitrosti (km/h)"
              value={thresholds.speedLimitKmh}
              onDecrement={() =>
                updateThreshold('speedLimitKmh', Math.max(10, thresholds.speedLimitKmh - 10))
              }
              onIncrement={() =>
                updateThreshold('speedLimitKmh', Math.min(200, thresholds.speedLimitKmh + 10))
              }
            />
          </View>

          <View style={styles.settingsSectionLabelWrap}>
            <Info size={16} color={colors.textMuted} />
            <Text style={styles.settingsSectionLabel}>Aplikacija</Text>
          </View>

          <SettingsRow
            title={demoSeeded ? 'Demo voznja dodana' : 'Dodaj demo voznjo'}
            subtitle="Za testiranje zgodovine in izzivih"
            Icon={Info}
            onPress={demoSeeded ? undefined : handleSeedDemo}
          />
          <SettingsRow title="O aplikaciji" subtitle="VozimVarno v1.0.0" Icon={Info} />

          {convexSettings === undefined && (
            <View style={styles.settingsSectionLabelWrap}>
              <Text style={[styles.settingsSectionLabel, { color: '#e8a800' }]}>Brez povezave — lokalne nastavitve</Text>
            </View>
          )}
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
  const styles = useAppStyles();
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
  const styles = useAppStyles();
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

function ThresholdRow({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const styles = useAppStyles();
  const display = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return (
    <View style={styles.thresholdRow}>
      <Text style={styles.thresholdLabel}>{label}</Text>
      <View style={styles.thresholdControls}>
        <Pressable style={styles.thresholdStepBtn} onPress={onDecrement}>
          <Text style={styles.thresholdStepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.thresholdValueText}>{display}</Text>
        <Pressable style={styles.thresholdStepBtn} onPress={onIncrement}>
          <Text style={styles.thresholdStepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
