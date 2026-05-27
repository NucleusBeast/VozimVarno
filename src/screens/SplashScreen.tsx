import { Text, View } from 'react-native';
import { Car, ShieldCheck } from 'lucide-react-native';

import { styles } from '../styles';

export function SplashScreen() {
  return (
    <View style={styles.splashFrame}>
      <View style={styles.splashBody}>
        <View style={styles.brandMark}>
          <Car size={56} color="#ffffff" strokeWidth={2.6} />
          <View style={styles.brandShield}>
            <ShieldCheck size={39} color="#ffffff" strokeWidth={2.4} />
          </View>
        </View>
        <Text style={styles.splashTitle}>VozimVarno</Text>
        <Text style={styles.splashSubtitle}>Vozim odgovorno.{'\n'}Prihodnost varno.</Text>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}
