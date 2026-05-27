import { Pressable, Text, View } from 'react-native';
import { Car, Clock3, Gauge, Menu, Settings, Star, Trophy } from 'lucide-react-native';

import { Header, IconButton, PhoneFrame, BottomNav } from '../components/layout';
import { BLUE } from '../constants';
import { styles } from '../styles';
import type { GoToScreen, IconType, Screen } from '../types';

export function HomeScreen({ go }: { go: GoToScreen }) {
  const cards: Array<{ label: string; Icon: IconType; screen: Screen }> = [
    { label: 'Nova voznja', Icon: Car, screen: 'prepare' },
    { label: 'Moje voznje', Icon: Clock3, screen: 'history' },
    { label: 'Rezultati', Icon: Gauge, screen: 'summary' },
    { label: 'Ocenjevanje', Icon: Star, screen: 'rating' },
    { label: 'Izzivi', Icon: Trophy, screen: 'challenges' },
    { label: 'Nastavitve', Icon: Settings, screen: 'settings' },
  ];

  return (
    <PhoneFrame>
      <Header
        title="VozimVarno"
        go={go}
        right={
          <IconButton label="Meni" onPress={() => go('settings')}>
            <Menu size={22} color={BLUE} />
          </IconButton>
        }
      />
      <View style={styles.homeGrid}>
        {cards.map(({ label, Icon, screen }) => (
          <Pressable key={label} style={styles.menuCard} onPress={() => go(screen)}>
            <Icon size={41} color={BLUE} strokeWidth={2} />
            <Text style={styles.menuCardText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <BottomNav active="home" go={go} />
    </PhoneFrame>
  );
}
