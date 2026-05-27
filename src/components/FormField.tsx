import { Text, TextInput, View } from 'react-native';
import { Lock } from 'lucide-react-native';

import { MUTED } from '../constants';
import { styles } from '../styles';

export function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  secure = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#a1adbf"
          secureTextEntry={secure}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={secure ? 'default' : 'email-address'}
          value={value}
          onChangeText={onChangeText}
        />
        {secure ? <Lock size={16} color={MUTED} /> : null}
      </View>
    </View>
  );
}
