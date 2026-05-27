import { Text, TextInput, View } from 'react-native';
import { Star } from 'lucide-react-native';

import { Header, PhoneFrame } from '../components/layout';
import { ScoreRing } from '../components/metrics';
import { PrimaryButton } from '../components/PrimaryButton';
import { YELLOW } from '../constants';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

export function RatingScreen({ go }: { go: GoToScreen }) {
  return (
    <PhoneFrame>
      <Header title="Ocenjevanje" back="summary" go={go} />
      <View style={styles.content}>
        <View style={styles.centerBlock}>
          <ScoreRing value={82} size={124} stroke={9} />
          <Text style={styles.ratingQuestion}>Kako varno si vozil?</Text>
        </View>
        <View style={styles.starRow}>
          {[0, 1, 2, 3, 4].map((index) => (
            <Star
              key={index}
              size={42}
              color={index < 4 ? YELLOW : '#9aa6b7'}
              fill={index < 4 ? YELLOW : 'none'}
              strokeWidth={1.8}
            />
          ))}
        </View>
        <TextInput
          editable={false}
          multiline
          placeholder="Dodaj komentar (neobvezno)"
          placeholderTextColor="#9aa6b7"
          style={styles.commentBox}
        />
        <View style={styles.flexSpacer} />
        <PrimaryButton title="Shrani oceno" onPress={() => go('home')} />
      </View>
    </PhoneFrame>
  );
}
