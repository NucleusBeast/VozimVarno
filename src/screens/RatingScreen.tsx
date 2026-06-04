import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Star } from 'lucide-react-native';

import { Header, PhoneFrame } from '../components/layout';
import { ScoreRing } from '../components/metrics';
import { PrimaryButton } from '../components/PrimaryButton';
import { YELLOW } from '../constants';
import { saveRide } from '../services/storage/rideStorage';
import { useAppStyles } from '../styles';
import { useTheme } from '../theme/ThemeContext';
import type { GoToScreen, Ride } from '../types';

export function RatingScreen({ go, ride }: { go: GoToScreen; ride: Ride | null }) {
  const [selectedRating, setSelectedRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const styles = useAppStyles();
  const { colors } = useTheme();

  const handleSave = async () => {
    if (ride) {
      setIsSaving(true);
      try {
        await saveRide({
          ...ride,
          userRating: selectedRating,
          userComment: comment.trim() || undefined,
        });
      } catch {
        // Non-critical — proceed to home regardless
      } finally {
        setIsSaving(false);
      }
    }
    go('home');
  };

  return (
    <PhoneFrame>
      <Header title="Ocenjevanje" back="summary" go={go} />
      <KeyboardAvoidingView
        style={styles.ratingKeyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.ratingContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.centerBlock}>
              <ScoreRing value={ride?.score ?? 0} size={124} stroke={9} />
              <Text style={styles.ratingQuestion}>Kako ti je bila vsec voznja?</Text>
            </View>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setSelectedRating(star)}>
                  <Star
                    size={42}
                    color={star <= selectedRating ? YELLOW : colors.textMuted}
                    fill={star <= selectedRating ? YELLOW : 'none'}
                    strokeWidth={1.8}
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              multiline
              blurOnSubmit
              returnKeyType="done"
              placeholder="Dodaj komentar (neobvezno)"
              placeholderTextColor={colors.textMuted}
              style={styles.commentBox}
              value={comment}
              onChangeText={setComment}
              onSubmitEditing={Keyboard.dismiss}
            />
            <View style={styles.flexSpacer} />
            <PrimaryButton
              title={isSaving ? 'Shranjujem...' : 'Shrani oceno'}
              onPress={handleSave}
              disabled={isSaving}
            />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </PhoneFrame>
  );
}
