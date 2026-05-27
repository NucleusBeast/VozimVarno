import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuthActions } from '@convex-dev/auth/react';

import { FormField } from '../components/FormField';
import { PhoneFrame } from '../components/layout';
import { PrimaryButton } from '../components/PrimaryButton';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

export function LoginScreen({ go }: { go: GoToScreen }) {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError('');
    setSubmitting(true);

    try {
      await signIn('password', {
        email: email.trim(),
        password,
        flow: mode,
      });
      go('home');
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '';

      if (mode === 'signUp' && message.includes('already exists')) {
        setMode('signIn');
        setError('Racun s to e-posto ze obstaja. Prijavi se z geslom.');
        return;
      }

      setError(mode === 'signIn' ? 'Prijava ni uspela. Preveri e-posto in geslo.' : 'Registracija ni uspela. Geslo naj ima vsaj 8 znakov.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PhoneFrame>
      <View style={styles.loginBody}>
        <Text style={styles.loginTitle}>{mode === 'signIn' ? 'Dobrodosel nazaj!' : 'Ustvari racun'}</Text>
        <Text style={styles.loginSubtitle}>{mode === 'signIn' ? 'Prijavi se za zacetek' : 'Vnesi e-posto in geslo'}</Text>
        <FormField label="E-posta" placeholder="vnesi e-posto" value={email} onChangeText={setEmail} />
        <FormField label="Geslo" placeholder="vnesi geslo" value={password} onChangeText={setPassword} secure />
        <Pressable style={styles.forgot}>
          <Text style={styles.forgotText}>Pozabljeno geslo?</Text>
        </Pressable>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <PrimaryButton title={submitting ? 'Prosim pocakaj...' : mode === 'signIn' ? 'Prijava' : 'Registracija'} onPress={submit} disabled={submitting} />
        <Text style={styles.orText}>ali</Text>
        <PrimaryButton
          title={mode === 'signIn' ? 'Ustvari racun' : 'Nazaj na prijavo'}
          onPress={() => {
            setError('');
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
          }}
          outline
        />
      </View>
    </PhoneFrame>
  );
}
