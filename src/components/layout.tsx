import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, Clock3, Home, User } from 'lucide-react-native';

import { BLUE, TEXT } from '../constants';
import { styles } from '../styles';
import type { GoToScreen, Screen } from '../types';

export function PhoneFrame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <View style={[styles.phone, dark && styles.phoneDark]}>{children}</View>;
}

export function Header({
  title,
  back,
  right,
  go,
}: {
  title: string;
  back?: Screen;
  right?: React.ReactNode;
  go: GoToScreen;
}) {
  return (
    <View style={styles.header}>
      {back ? (
        <IconButton label="Nazaj" onPress={() => go(back)}>
          <ChevronLeft size={22} color={TEXT} />
        </IconButton>
      ) : (
        <View style={styles.iconSlot} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.iconSlot}>{right}</View>
    </View>
  );
}

export function IconButton({
  children,
  label,
  onPress,
}: {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={label} style={styles.iconButton} onPress={onPress}>
      {children}
    </Pressable>
  );
}

export function BottomNav({ active, go }: { active: 'home' | 'history' | 'profile'; go: GoToScreen }) {
  const items = [
    { key: 'home', label: 'Domov', Icon: Home, screen: 'home' as Screen },
    { key: 'history', label: 'Zgodovina', Icon: Clock3, screen: 'history' as Screen },
    { key: 'profile', label: 'Profil', Icon: User, screen: 'profile' as Screen },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map(({ key, label, Icon, screen }) => {
        const focused = active === key;
        return (
          <Pressable key={key} style={styles.navItem} onPress={() => go(screen)}>
            <Icon size={21} color={focused ? BLUE : '#6b7280'} fill={focused ? BLUE : 'none'} strokeWidth={2} />
            <Text style={[styles.navLabel, focused && styles.navLabelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
