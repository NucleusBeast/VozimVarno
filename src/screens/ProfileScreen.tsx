import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Check, Info, Lock, Pencil, Settings, Trophy, X } from 'lucide-react-native';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';

import { BottomNav, PhoneFrame } from '../components/layout';
import { SettingsRow, Stat } from '../components/metrics';
import { BLUE, MUTED, RED, TEXT } from '../constants';
import { styles } from '../styles';
import type { GoToScreen } from '../types';
import { api } from '../../backend/convex/_generated/api';

export function ProfileScreen({ go }: { go: GoToScreen }) {
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer);
  const updateProfile = useMutation(api.users.updateProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const displayName = viewer?.name ?? viewer?.email?.split('@')[0] ?? 'Voznik';
  const email = viewer?.email ?? 'E-posta ni na voljo';
  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || 'V';
  const memberSince = useMemo(() => {
    if (!viewer?.createdAt) {
      return 'Clan';
    }

    return `Clan od ${new Intl.DateTimeFormat('sl-SI', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(viewer.createdAt))}`;
  }, [viewer?.createdAt]);

  useEffect(() => {
    setName(displayName);
  }, [displayName]);

  const saveProfile = async () => {
    setError('');
    setSaving(true);

    try {
      await updateProfile({ name });
      setIsEditing(false);
    } catch {
      setError('Ime mora imeti vsaj 2 znaka.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PhoneFrame>
      <View style={styles.profileBody}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        {isEditing ? (
          <View style={styles.profileEditBlock}>
            <TextInput
              style={styles.profileNameInput}
              value={name}
              onChangeText={setName}
              placeholder="Ime"
              placeholderTextColor={MUTED}
              autoCapitalize="words"
            />
            {error ? <Text style={styles.profileError}>{error}</Text> : null}
            <View style={styles.profileActions}>
              <Pressable accessibilityLabel="Shrani profil" style={styles.profileActionButton} disabled={saving} onPress={saveProfile}>
                <Check size={18} color={BLUE} strokeWidth={2.5} />
              </Pressable>
              <Pressable
                accessibilityLabel="Preklici urejanje"
                style={styles.profileActionButton}
                onPress={() => {
                  setName(displayName);
                  setError('');
                  setIsEditing(false);
                }}
              >
                <X size={18} color={RED} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Pressable accessibilityLabel="Uredi profil" style={styles.profileEditButton} onPress={() => setIsEditing(true)}>
              <Pencil size={16} color={TEXT} />
            </Pressable>
          </View>
        )}
        <Text style={styles.profileEmail}>{email}</Text>
        <Text style={styles.profileSince}>{memberSince}</Text>
        <View style={styles.profileStats}>
          <Stat label="Skupno vozenj" value="0" />
          <Stat label="Povprecna ocena" value="-" />
          <Stat label="Skupna razdalja" value="0 km" />
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
