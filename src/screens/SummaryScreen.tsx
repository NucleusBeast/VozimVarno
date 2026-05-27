import { Text, View } from 'react-native';

import { Header, PhoneFrame } from '../components/layout';
import { InfoRows, ScoreRing } from '../components/metrics';
import { PrimaryButton } from '../components/PrimaryButton';
import { formatDuration } from '../utils/formatDuration';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

export function SummaryScreen({ go, elapsedSeconds }: { go: GoToScreen; elapsedSeconds: number }) {
  return (
    <PhoneFrame>
      <Header title="Povzetek voznje" back="active" go={go} />
      <View style={styles.content}>
        <View style={styles.centerBlock}>
          <ScoreRing value={82} size={122} stroke={9} />
          <Text style={styles.successText}>Dobro opravljeno!</Text>
        </View>
        <InfoRows
          rows={[
            ['Razdalja', '18,7 km'],
            ['Cas voznje', formatDuration(elapsedSeconds)],
            ['Povprecna hitrost', '46 km/h'],
          ]}
        />
        <Text style={styles.sectionTitle}>Dosezeni dogodki</Text>
        <InfoRows
          compact
          rows={[
            ['Pospeski', '5'],
            ['Zaviranja', '2'],
            ['Odstopanja hitrosti', '1'],
          ]}
        />
        <View style={styles.flexSpacer} />
        <PrimaryButton title="Shrani voznjo" onPress={() => go('rating')} />
      </View>
    </PhoneFrame>
  );
}
