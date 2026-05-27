import { ScrollView, Text, View } from 'react-native';

import { Header, PhoneFrame } from '../components/layout';
import { InfoRows, MapCard, MetricCard } from '../components/metrics';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

export function DetailsScreen({ go }: { go: GoToScreen }) {
  return (
    <PhoneFrame>
      <Header title="Podrobnosti voznje" back="history" go={go} />
      <ScrollView contentContainerStyle={styles.detailsBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.dateCenter}>24. maj 2024 ob 15:42</Text>
        <MapCard />
        <View style={styles.metricGrid}>
          <MetricCard label="Razdalja" value="18,7 km" />
          <MetricCard label="Cas voznje" value="00:24:18" />
          <MetricCard label="Povp. hitrost" value="46 km/h" />
        </View>
        <Text style={styles.sectionTitle}>Dogodki</Text>
        <InfoRows
          compact
          rows={[
            ['Pospeski', '5'],
            ['Zaviranja', '2'],
            ['Odstopanja hitrosti', '1'],
          ]}
        />
      </ScrollView>
    </PhoneFrame>
  );
}
