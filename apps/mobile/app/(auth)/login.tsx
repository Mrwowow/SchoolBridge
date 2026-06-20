/**
 * app/(auth)/login.tsx
 * Phone + password login with an OTP alternative path.
 *
 * Flow:
 *  1. User enters phone number.
 *  2a. "Sign in with password" → LoginDto → POST /auth/login
 *  2b. "Use OTP instead" → RequestOtpDto → POST /auth/otp/request
 *       → OTP input → VerifyOtpDto → POST /auth/otp/verify
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/api';
import { Button } from '../../components';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

type Mode = 'password' | 'otp-request' | 'otp-verify';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);

  const [mode, setMode] = useState<Mode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordLogin() {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your phone and password.');
      return;
    }
    setLoading(true);
    try {
      const { user, tokens } = await authApi.login({
        phone: phone.trim(),
        password,
      });
      await login({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      // Navigation handled by AuthGate in _layout.tsx
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp() {
    if (!phone.trim()) {
      Alert.alert('Missing phone', 'Please enter your phone number.');
      return;
    }
    setLoading(true);
    try {
      await authApi.requestOtp({ phone: phone.trim() });
      setMode('otp-verify');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Could not send OTP. Try again.';
      Alert.alert('OTP error', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const { user, tokens } = await authApi.verifyOtp({
        phone: phone.trim(),
        code: otp.trim(),
      });
      await login({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Incorrect code. Try again.';
      Alert.alert('Verification failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Brand */}
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>SB</Text>
          </View>
          <Text style={styles.brandName}>SchoolBridge</Text>
        </View>

        <Text style={styles.heading}>
          {mode === 'otp-verify' ? 'Enter your code' : 'Sign in'}
        </Text>
        <Text style={styles.subheading}>
          {mode === 'otp-verify'
            ? `We sent a 6-digit code to ${phone}`
            : 'Connect with your child\'s school'}
        </Text>

        {/* Phone field — shown on all modes */}
        {mode !== 'otp-verify' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 08012345678"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
            />
          </View>
        )}

        {/* Password field */}
        {mode === 'password' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handlePasswordLogin}
            />
          </View>
        )}

        {/* OTP input */}
        {mode === 'otp-verify' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>6-digit code</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="_ _ _ _ _ _"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))}
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleVerifyOtp}
            />
          </View>
        )}

        {/* Primary CTA */}
        {mode === 'password' && (
          <Button
            label="Sign in"
            onPress={handlePasswordLogin}
            loading={loading}
            style={styles.cta}
          />
        )}

        {mode === 'otp-request' && (
          <Button
            label="Send OTP"
            onPress={handleRequestOtp}
            loading={loading}
            style={styles.cta}
          />
        )}

        {mode === 'otp-verify' && (
          <Button
            label="Verify code"
            onPress={handleVerifyOtp}
            loading={loading}
            style={styles.cta}
          />
        )}

        {/* Mode toggles */}
        <View style={styles.toggleRow}>
          {mode === 'password' && (
            <Pressable onPress={() => setMode('otp-request')}>
              <Text style={styles.toggleLink}>Use OTP instead</Text>
            </Pressable>
          )}

          {(mode === 'otp-request' || mode === 'otp-verify') && (
            <Pressable onPress={() => { setMode('password'); setOtp(''); }}>
              <Text style={styles.toggleLink}>Use password instead</Text>
            </Pressable>
          )}

          {mode === 'otp-verify' && (
            <Pressable
              style={styles.resendRow}
              onPress={handleRequestOtp}
              disabled={loading}
            >
              <Text style={styles.toggleLinkMuted}>Resend code</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },

  container: {
    paddingHorizontal: Spacing.lg,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: Colors.surface,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  brandName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  heading: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subheading: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },

  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: FontSize.xl,
    letterSpacing: 8,
    fontWeight: FontWeight.bold,
  },

  cta: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },

  toggleRow: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  resendRow: {
    marginTop: Spacing.xs,
  },
  toggleLink: {
    color: Colors.brand,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  toggleLinkMuted: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
});
