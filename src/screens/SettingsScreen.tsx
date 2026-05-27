import { Switch, View } from 'react-native';
import { Bell, Clock3, Gauge, Info, Lock, User } from 'lucide-react-native';

import { Header, PhoneFrame } from '../components/layout';
import { SettingsRow } from '../components/metrics';
import { BLUE } from '../constants';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

export function SettingsScreen({ go }: { go: GoToScreen }) {
  return (
    <PhoneFrame>
      <Header title="Nastavitve" back="home" go={go} />
      <View style={styles.settingsList}>
        <SettingsRow title="Racun" subtitle="Uredi profil" Icon={User} />
        <SettingsRow title="Obvestila" Icon={Bell} trailing={<Switch value trackColor={{ true: BLUE, false: '#cfd7e3' }} thumbColor="#ffffff" />} />
        <SettingsRow title="Privoljenja" subtitle="Kamera, GPS, Mikrofon" Icon={Lock} />
        <SettingsRow title="Enote" subtitle="km/h" Icon={Gauge} />
        <SettingsRow title="Tema" subtitle="Svetla" Icon={Clock3} />
        <SettingsRow title="O aplikaciji" subtitle="VozimVarno v1.0.0" Icon={Info} />
      </View>
    </PhoneFrame>
  );
}
