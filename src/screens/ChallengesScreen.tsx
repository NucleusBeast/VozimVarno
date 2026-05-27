import { Pressable, ScrollView, Text, View } from 'react-native';

import { Header, PhoneFrame } from '../components/layout';
import { challenges } from '../data';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

export function ChallengesScreen({ go }: { go: GoToScreen }) {
  return (
    <PhoneFrame>
      <Header title="Izzivi" back="home" go={go} />
      <View style={styles.tabs}>
        {['Aktivni', 'Zakljuceni'].map((tab, index) => (
          <Pressable key={tab} style={[styles.tab, index === 0 && styles.tabActive]}>
            <Text style={[styles.tabText, index === 0 && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.challengeList} showsVerticalScrollIndicator={false}>
        {challenges.map(({ title, description, progress, Icon, color }) => (
          <View key={title} style={styles.challengeCard}>
            <View style={[styles.challengeIcon, { backgroundColor: `${color}18` }]}>
              <Icon size={28} color={color} />
            </View>
            <View style={styles.challengeText}>
              <Text style={styles.challengeTitle}>{title}</Text>
              <Text style={styles.challengeDescription}>{description}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progress === '5/7' ? '72%' : progress === '2/3' ? '66%' : '50%', backgroundColor: color }]} />
              </View>
            </View>
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        ))}
      </ScrollView>
    </PhoneFrame>
  );
}
