import { Text, View } from 'react-native';
import { Info, Lock, Settings, Trophy } from 'lucide-react-native';
import { useAuthActions } from '@convex-dev/auth/react';

import { BottomNav, PhoneFrame } from '../components/layout';
import { SettingsRow, Stat } from '../components/metrics';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

export function ProfileScreen({ go }: { go: GoToScreen }) {
  const { signOut } = useAuthActions();

  return (
    <PhoneFrame>
      <View style={styles.profileBody}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
        <Text style={styles.profileName}>Matej</Text>
        <Text style={styles.profileSince}>Clan od maj 2024</Text>
        <View style={styles.profileStats}>
          <Stat label="Skupno vozenj" value="24" />
          <Stat label="Povprecna ocena" value="78" />
          <Stat label="Skupna razdalja" value="312 km" />
        </View>
        <View style={styles.settingsList}>
          <SettingsRow title="Dosezki" Icon={Trophy} onPress={() => go('challenges')} />
          <SettingsRow title="Nastavitve" Icon={Settings} onPress={() => go('settings')} />
          <SettingsRow title="Pomoc in podpora" Icon={Info} onPress={() => go('settings')} />
          <SettingsRow title="Odjava" Icon={Lock} onPress={() => void signOut()} />
        </View>
      </View>
      <BottomNav active="profile" go={go} />
    </PhoneFrame>
  );
}
