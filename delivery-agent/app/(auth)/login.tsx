import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiService } from '@/services/apiService';
import { useOrderStore } from '@/services/orderService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Smartphone, Lock, ArrowRight, AlertCircle } from 'lucide-react-native';

type LoginStep = 'phone' | 'otp';

export default function LoginScreen() {
  const router = useRouter();
  const initializeRider = useOrderStore((state) => state.initializeRider);
  const loadOrders = useOrderStore((state) => state.loadOrders);

  const [step, setStep] = useState<LoginStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhoneNumber = (text: string): string => {
    // Remove all non-digit characters except +
    const cleaned = text.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (cleaned && !cleaned.startsWith('+')) {
      return '+' + cleaned.replace(/\+/g, '');
    }
    
    return cleaned;
  };

  const handleRequestOtp = async () => {
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      setError('Phone number must start with + (e.g., +256...)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiService.requestOtp(phoneNumber);
      
      if (result.success) {
        setOtpSent(true);
        setStep('otp');
        setCountdown(60); // 60 second countdown
        // Focus first OTP input
        otpInputRefs.current[0]?.focus();
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/[^\d]/g, '');
    
    if (digit.length > 1) {
      // Handle paste
      const digits = digit.slice(0, 6).split('');
      const newOtp = [...otpCode];
      digits.forEach((d, i) => {
        if (index + i < 6) {
          newOtp[index + i] = d;
        }
      });
      setOtpCode(newOtp);
      
      // Focus next empty input or last input
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otpCode];
      newOtp[index] = digit;
      setOtpCode(newOtp);
      
      // Auto-focus next input
      if (digit && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiService.verifyOtp(phoneNumber, code);
      
      if (result.success && result.token) {
        // Initialize rider profile and load orders
        await initializeRider();
        await loadOrders();
        
        // Navigate to orders screen
        router.replace('/(delivery)');
      } else {
        setError(result.error || 'Invalid OTP code');
        // Clear OTP inputs on error
        setOtpCode(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setOtpCode(['', '', '', '', '', '']);
    setError(null);
    await handleRequestOtp();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Smartphone size={32} color={Colors.primary[500]} />
            </View>
            <Text style={styles.title}>
              {step === 'phone' ? 'Welcome Back' : 'Enter OTP Code'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? 'Enter your phone number to receive an OTP code'
                : `We sent a code to ${phoneNumber}`}
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={Colors.error[600]} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Phone Input Step */}
          {step === 'phone' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Smartphone size={20} color={Colors.slate[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+256 700 000 000"
                  placeholderTextColor={Colors.slate[400]}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    const formatted = formatPhoneNumber(text);
                    setPhoneNumber(formatted);
                    setError(null);
                  }}
                  keyboardType="phone-pad"
                  autoFocus
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRequestOtp}
                disabled={isLoading || !phoneNumber.startsWith('+')}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Request OTP</Text>
                    <ArrowRight size={20} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Input Step */}
          {step === 'otp' && (
            <View style={styles.form}>
              <View style={styles.otpContainer}>
                {otpCode.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputRefs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                      error && styles.otpInputError,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(index, value)}
                    onKeyPress={({ nativeEvent }) =>
                      handleOtpKeyPress(index, nativeEvent.key)
                    }
                    keyboardType="number-pad"
                    maxLength={1}
                    editable={!isLoading}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={isLoading || otpCode.join('').length !== 6}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Verify OTP</Text>
                    <ArrowRight size={20} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>

              {/* Resend OTP */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code?</Text>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={countdown > 0 || isLoading}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.resendButton,
                      (countdown > 0 || isLoading) && styles.resendButtonDisabled,
                    ]}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Back to phone */}
              <TouchableOpacity
                onPress={() => {
                  setStep('phone');
                  setOtpCode(['', '', '', '', '', '']);
                  setError(null);
                  setOtpSent(false);
                }}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Change phone number</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.slate[600],
    textAlign: 'center',
    paddingHorizontal: Spacing.base,
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.error[500],
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.error[700],
    lineHeight: 18,
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.slate[200],
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.base,
    ...Shadows.sm,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.slate[900],
    paddingVertical: Spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.base,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#ffffff',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  otpInput: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.slate[200],
    borderRadius: BorderRadius.base,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
    textAlign: 'center',
    ...Shadows.sm,
  },
  otpInputFilled: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  otpInputError: {
    borderColor: Colors.error[500],
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  resendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[600],
  },
  resendButton: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[600],
  },
  resendButtonDisabled: {
    color: Colors.slate[400],
  },
  backButton: {
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  backButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[500],
  },
});
