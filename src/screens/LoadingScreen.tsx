import { ActivityIndicator, View } from 'react-native';

import { PhoneFrame } from '../components/layout';
import { BLUE } from '../constants';
import { useAppStyles } from '../styles';

export function LoadingScreen() {
  const styles = useAppStyles();
  return (
    <PhoneFrame>
      <View style={styles.loadingBody}>
        <ActivityIndicator color={BLUE} size="large" />
      </View>
    </PhoneFrame>
  );
}
