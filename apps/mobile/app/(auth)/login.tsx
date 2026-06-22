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
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { authApi, ApiError } from '../../src/api';
import { registerPushToken } from '../../src/notifications/registerPushToken';
import { Button } from '../../components';
import { Logo } from '../../src/design/Logo';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

type Mode = 'password' | 'otp-request' | 'otp-verify';

/** Turn any thrown error into a clear, user-facing message for the login form. */
function loginErrorMessage(err: unknown, context: 'password' | 'otp'): string {
  if (err instanceof ApiError) {
    if (err.isNetworkError) {
      return "Can't reach the server. Check your internet connection and try again.";
    }
    if (err.status === 401) {
      return context === 'otp'
        ? 'That code is incorrect or has expired.'
        : 'Incorrect phone number or password.';
    }
    if (err.status === 400) {
      return err.message || 'Please check the details you entered.';
    }
    if (err.status === 404 && context === 'password') {
      return 'No account found for that phone number.';
    }
    if (err.status >= 500) {
      return 'Something went wrong on our side. Please try again shortly.';
    }
    return err.message || 'Login failed. Please try again.';
  }
  return 'Login failed. Please try again.';
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const setTokens = useAuthStore((s) => s.setTokens);

  /**
   * The API returns only tokens from login/verify. Store the tokens first so the
   * API client sends the bearer header, then fetch the user via /auth/me.
   */
  async function completeSignIn(tokens: { accessToken: string; refreshToken: string }) {
    await setTokens(tokens);
    const user = await authApi.me();
    await login({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    // Redirect is owned by the AuthGate in app/_layout.tsx: once login() flips
    // isAuthenticated, the gate replaces to /(tabs). Navigating here too would
    // double-fire. Registering the push token is the one post-login side effect.
    void registerPushToken().catch(() => undefined);
  }

  const [mode, setMode] = useState<Mode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordLogin() {
    if (!phone.trim() || !password.trim()) {
      setError('Please enter your phone and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const tokens = await authApi.login({ phone: phone.trim(), password });
      await completeSignIn(tokens);
      // Navigation handled by AuthGate in _layout.tsx
    } catch (err: unknown) {
      setError(loginErrorMessage(err, 'password'));
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp() {
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.requestOtp({ phone: phone.trim() });
      setMode('otp-verify');
    } catch (err: unknown) {
      setError(loginErrorMessage(err, 'otp'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const tokens = await authApi.verifyOtp({ phone: phone.trim(), code: otp.trim() });
      await completeSignIn(tokens);
    } catch (err: unknown) {
      setError(loginErrorMessage(err, 'otp'));
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
          <Logo kind="lockup" color="brand" height={40} />
        </View>

        <Text style={styles.heading}>
          {mode === 'otp-verify' ? 'Enter your code' : 'Sign in'}
        </Text>
        <Text style={styles.subheading}>
          {mode === 'otp-verify'
            ? `We sent a 6-digit code to ${phone}`
            : 'Connect with your child\'s school'}
        </Text>

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner} accessibilityLiveRegion="polite">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

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
              onChangeText={(v) => {
                setPhone(v);
                if (error) setError(null);
              }}
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
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Your password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (error) setError(null);
                }}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handlePasswordLogin}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.passwordToggle}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
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
              onChangeText={(v) => {
                setOtp(v.replace(/[^0-9]/g, '').slice(0, 6));
                if (error) setError(null);
              }}
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
            <Pressable onPress={() => { setMode('otp-request'); setError(null); setShowPassword(false); }}>
              <Text style={styles.toggleLink}>Use OTP instead</Text>
            </Pressable>
          )}

          {(mode === 'otp-request' || mode === 'otp-verify') && (
            <Pressable onPress={() => { setMode('password'); setOtp(''); setError(null); }}>
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

  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  passwordToggle: {
    paddingHorizontal: Spacing.md,
    height: '100%',
    justifyContent: 'center',
  },
  passwordToggleText: {
    color: Colors.brand,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
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
