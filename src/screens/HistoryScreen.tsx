import { Pressable, ScrollView, Text, View } from 'react-native';

import { BottomNav, Header, PhoneFrame } from '../components/layout';
import { ScoreRing } from '../components/metrics';
import { rideHistory } from '../data';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

export function HistoryScreen({ go }: { go: GoToScreen }) {
  return (
    <PhoneFrame>
      <Header title="Moje voznje" back="home" go={go} />
      <View style={styles.tabs}>
        {['Vse', 'Ta teden', 'Ta mesec'].map((tab, index) => (
          <Pressable key={tab} style={[styles.tab, index === 0 && styles.tabActive]}>
            <Text style={[styles.tabText, index === 0 && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.historyList} showsVerticalScrollIndicator={false}>
        {rideHistory.map((ride) => (
          <Pressable key={ride.date} style={styles.historyItem} onPress={() => go('details')}>
            <View>
              <Text style={styles.historyDate}>{ride.date}</Text>
              <Text style={styles.historyMeta}>
                {ride.distance}  •  {ride.time}
              </Text>
            </View>
            <ScoreRing value={ride.score} size={48} stroke={4} small />
          </Pressable>
        ))}
      </ScrollView>
      <BottomNav active="history" go={go} />
    </PhoneFrame>
  );
}
