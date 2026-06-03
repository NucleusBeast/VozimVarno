import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Gauge, Moon, Rocket, Smartphone } from 'lucide-react-native';

import { Header, PhoneFrame } from '../components/layout';
import { getRides } from '../services/storage/rideStorage';
import { GREEN, RED } from '../constants';
import { useAppStyles } from '../styles';
import type { GoToScreen, Ride } from '../types';

type Tab = 'aktivni' | 'zakljuceni';

type Challenge = {
  title: string;
  description: string;
  current: number;
  target: number;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
};

function computeChallenges(rides: Ride[]): Challenge[] {
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const recentRides = rides.filter((r) => now - r.startTime < ONE_WEEK);

  const hardAccels = recentRides.reduce(
    (sum, r) => sum + r.incidents.filter((i) => i.type === 'hard_acceleration').length,
    0,
  );

  const hardBrakes = recentRides.reduce(
    (sum, r) => sum + r.incidents.filter((i) => i.type === 'hard_braking').length,
    0,
  );

  const nightRides = recentRides.filter((r) => {
    const hour = new Date(r.startTime).getHours();
    return hour >= 22 || hour < 6;
  }).length;

  const noPhoneRides = recentRides.filter(
    (r) => r.incidents.filter((i) => i.type === 'noise_alert').length === 0,
  ).length;

  return [
    {
      title: 'Brez motnje',
      description: '5 vozenj brez opozoril',
      current: Math.min(noPhoneRides, 5),
      target: 5,
      Icon: Smartphone,
      color: '#2d7ee8',
    },
    {
      title: 'Varni pospeski',
      description: 'Manj kot 3 mocni pospeski',
      current: Math.max(0, 3 - hardAccels),
      target: 3,
      Icon: Rocket,
      color: GREEN,
    },
    {
      title: 'Gladko zaviranje',
      description: 'Manj kot 2 mocni zaviranji',
      current: Math.max(0, 2 - hardBrakes),
      target: 2,
      Icon: Gauge,
      color: RED,
    },
    {
      title: 'Nocna voznja',
      description: '3 voznje ponoci',
      current: Math.min(nightRides, 3),
      target: 3,
      Icon: Moon,
      color: '#6d59e8',
    },
  ];
}

const demoChallenges: Challenge[] = [
  { title: 'Brez motnje', description: '5 vozenj brez opozoril', current: 5, target: 7, Icon: Smartphone, color: '#2d7ee8' },
  { title: 'Varni pospeski', description: 'Manj kot 3 mocni pospeski', current: 2, target: 3, Icon: Rocket, color: GREEN },
  { title: 'Gladko zaviranje', description: 'Manj kot 2 mocni zaviranji', current: 1, target: 2, Icon: Gauge, color: RED },
  { title: 'Nocna voznja', description: '3 voznje ponoci', current: 1, target: 3, Icon: Moon, color: '#6d59e8' },
];

export function ChallengesScreen({ go }: { go: GoToScreen }) {
  const [activeTab, setActiveTab] = useState<Tab>('aktivni');
  const [challenges, setChallenges] = useState<Challenge[]>(demoChallenges);
  const styles = useAppStyles();

  useEffect(() => {
    getRides().then((rides) => {
      if (rides.length > 0) {
        setChallenges(computeChallenges(rides));
      }
    });
  }, []);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'aktivni', label: 'Aktivni' },
    { key: 'zakljuceni', label: 'Zakljuceni' },
  ];

  const displayed =
    activeTab === 'zakljuceni'
      ? challenges.filter((c) => c.current >= c.target)
      : challenges.filter((c) => c.current < c.target);

  return (
    <PhoneFrame>
      <Header title="Izzivi" back="home" go={go} />
      <View style={styles.tabs}>
        {tabs.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.challengeList} showsVerticalScrollIndicator={false}>
        {displayed.length === 0 ? (
          <Text style={styles.emptyState}>
            {activeTab === 'zakljuceni' ? 'Ni zakljucenih izzivov.' : 'Vsi izzivi so ze zakljuceni!'}
          </Text>
        ) : (
          displayed.map(({ title, description, current, target, Icon, color }) => {
            const progress = Math.min(current / target, 1);
            return (
              <View key={title} style={styles.challengeCard}>
                <View style={[styles.challengeIcon, { backgroundColor: `${color}18` }]}>
                  <Icon size={28} color={color} />
                </View>
                <View style={styles.challengeText}>
                  <Text style={styles.challengeTitle}>{title}</Text>
                  <Text style={styles.challengeDescription}>{description}</Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.round(progress * 100)}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.progressText}>
                  {current}/{target}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </PhoneFrame>
  );
}
