import { Pressable, Text, View } from 'react-native';
import { Car, ShieldCheck } from 'lucide-react-native';

import { PhoneFrame } from '../components/layout';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

export function SplashScreen({ go }: { go: GoToScreen }) {
  return (
    <PhoneFrame dark>
      <Pressable style={styles.splashBody} onPress={() => go('login')}>
        <View style={styles.brandMark}>
          <Car size={56} color="#ffffff" strokeWidth={2.6} />
          <View style={styles.brandShield}>
            <ShieldCheck size={39} color="#ffffff" strokeWidth={2.4} />
          </View>
        </View>
        <Text style={styles.splashTitle}>VozimVarno</Text>
        <Text style={styles.splashSubtitle}>Vozim odgovorno.{'\n'}Prihodnost varno.</Text>
        <View style={styles.homeIndicator} />
      </Pressable>
    </PhoneFrame>
  );
}
