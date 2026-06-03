import { Pressable, Text } from 'react-native';

import { useAppStyles } from '../styles';

export function PrimaryButton({
  title,
  onPress,
  outline = false,
  danger = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  outline?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const styles = useAppStyles();
  return (
    <Pressable
      disabled={disabled}
      style={[styles.button, outline && styles.outlineButton, danger && styles.dangerButton, disabled && styles.buttonDisabled]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, outline && styles.outlineButtonText, danger && styles.dangerText]}>
        {title}
      </Text>
    </Pressable>
  );
}
