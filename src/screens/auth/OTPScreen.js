import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function OTPScreen({ navigation, route }) {
  const { phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (inputRefs[0].current) {
      setTimeout(() => inputRefs[0].current.focus(), 200);
    }
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    if (value.length > 1) {
      const chars = value.split('');
      chars.forEach((char, i) => {
        if (index + i < 4) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + value.length, 3);
      if (inputRefs[nextIndex].current) inputRefs[nextIndex].current.focus();
      if (newOtp.join('').length === 4) verifyOTP(newOtp.join(''));
      return;
    }
    newOtp[index] = value;
    setOtp(newOtp);
    if (error) setError('');
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
    if (newOtp.join('').length === 4) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const verifyOTP = (code) => {
    const finalCode = code || otp.join('');
    if (finalCode.length < 4) {
      setError('برجاء إدخال الكود كاملاً');
      shake();
      return;
    }
    if (finalCode !== '1234') {
      setError('الكود غير صحيح. الكود التجريبي هو 1234');
      shake();
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('RoleSelection', { phone });
    }, 1000);
  };

  const resendCode = () => {
    if (countdown > 0) return;
    setCountdown(60);
    setOtp(['', '', '', '']);
    setError('');
    inputRefs[0].current.focus();
  };

  const isComplete = otp.join('').length === 4;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>كود التحقق</Text>
        <Text style={styles.subtitle}>
          تم إرسال كود مكون من 4 أرقام على
        </Text>
        <Text style={styles.phone}>{phone}</Text>
      </View>

      <Animated.View style={[styles.otpContainer, { transform: [{ translateX: shakeAnim }] }]}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={inputRefs[index]}
            style={[
              styles.otpInput,
              digit ? styles.otpFilled : null,
              error ? styles.otpError : null,
            ]}
            value={digit}
            onChangeText={(val) => handleOtpChange(val, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={4}
            textAlign="center"
            selectTextOnFocus
          />
        ))}
      </Animated.View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.demoHint}>
        <Text style={styles.demoText}>الكود التجريبي: <Text style={styles.demoCode}>1234</Text></Text>
      </View>

      <TouchableOpacity
        style={[styles.button, (!isComplete || loading) && styles.buttonDisabled]}
        onPress={() => verifyOTP()}
        disabled={!isComplete || loading}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>
          {loading ? 'جاري التحقق...' : 'تأكيد'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.resendButton, countdown > 0 && styles.resendDisabled]}
        onPress={resendCode}
        disabled={countdown > 0}
      >
        <Ionicons name="refresh-outline" size={16} color={countdown > 0 ? colors.textMuted : colors.primary} />
        <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
          {countdown > 0 ? `إعادة الإرسال بعد ${countdown} ثانية` : 'إعادة إرسال الكود'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.white,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF0E8',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
  },
  phone: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  otpInput: {
    width: 60,
    height: 68,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  otpFilled: {
    borderColor: colors.primary,
    backgroundColor: '#FFF8F5',
  },
  otpError: {
    borderColor: colors.error,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  demoHint: {
    backgroundColor: '#FFF0E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  demoText: {
    fontSize: 13,
    color: colors.primary,
  },
  demoCode: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: colors.offlineGray,
    shadowOpacity: 0,
  },
  buttonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  resendDisabled: {
    opacity: 0.6,
  },
  resendText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: colors.textMuted,
  },
});
