import { Text, View } from 'react-native';
import { Camera, Check, Gauge, MapPin, Mic, Shield } from 'lucide-react-native';

import { Header, PhoneFrame } from '../components/layout';
import { PrimaryButton } from '../components/PrimaryButton';
import { BLUE, GREEN } from '../constants';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

export function PrepareScreen({ go, startRide }: { go: GoToScreen; startRide: () => void }) {
  const checks = [
    { label: 'Kamera', status: 'Povezano', Icon: Camera },
    { label: 'GPS', status: 'Povezano', Icon: MapPin },
    { label: 'Pospeskometer', status: 'Povezano', Icon: Gauge },
    { label: 'Mikrofon', status: 'Povezano', Icon: Mic },
    { label: 'Shranjevanje', status: 'Dovoljeno', Icon: Shield },
  ];

  return (
    <PhoneFrame>
      <Header title="Nova voznja" back="home" go={go} />
      <View style={styles.content}>
        <Text style={styles.sectionIntro}>Pred zacetkom preveri:</Text>
        <View style={styles.checkList}>
          {checks.map(({ label, status, Icon }) => (
            <View key={label} style={styles.checkRow}>
              <View style={styles.checkCircle}>
                <Check size={18} color={GREEN} strokeWidth={3} />
              </View>
              <Icon size={20} color={BLUE} />
              <View>
                <Text style={styles.checkLabel}>{label}</Text>
                <Text style={styles.checkStatus}>{status}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.flexSpacer} />
        <PrimaryButton title="Zacni voznjo" onPress={startRide} />
      </View>
    </PhoneFrame>
  );
}
