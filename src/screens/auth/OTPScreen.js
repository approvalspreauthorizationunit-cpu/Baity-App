import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export default function OTPScreen({ navigation, route }) {
  const { phone } = route.params;
  const { login } = useApp();
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Supabase typically uses 6 digits
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
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
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + value.length, 5);
      if (inputRefs[nextIndex].current) inputRefs[nextIndex].current.focus();
      if (newOtp.join('').length === 6) verifyOTP(newOtp.join(''));
      return;
    }
    newOtp[index] = value;
    setOtp(newOtp);
    if (error) setError('');
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
    if (newOtp.join('').length === 6) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const verifyOTP = async (code) => {
    const finalCode = code || otp.join('');
    if (finalCode.length < 6) {
      setError('برجاء إدخال الكود كاملاً');
      shake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.verifyOtp({
        phone: phone,
        token: finalCode,
        type: 'sms'
      });

      if (authError) {
        setError(authError.message);
        shake();
      } else if (data.user) {
        // Check if user profile exists
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          await login({ ...profile, supabaseUser: data.user });
          // Navigation logic based on role
          if (profile.role === 'seller') {
             // Check if seller profile setup is complete
             const { data: sellerProfile } = await supabase
               .from('seller_profiles')
               .select('status')
               .eq('user_id', data.user.id)
               .single();

             if (sellerProfile) {
                navigation.navigate('SellerRoot');
             } else {
                navigation.navigate('SellerSetup');
             }
          } else {
             navigation.navigate('CustomerRoot');
          }
        } else {
          navigation.navigate('RoleSelection', { userId: data.user.id, phone });
        }
      }
    } catch (err) {
      setError('حدث خطأ في التحقق، حاول مرة أخرى');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (countdown > 0) return;
    setLoading(true);
    const { error: resendError } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);

    if (resendError) {
      setError(resendError.message);
    } else {
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setError('');
      inputRefs[0].current.focus();
    }
  };

  const isComplete = otp.join('').length === 6;

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
          تم إرسال كود مكون من 6 أرقام على
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
            maxLength={6}
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
        style={[styles.resendButton, (countdown > 0 || loading) && styles.resendDisabled]}
        onPress={resendCode}
        disabled={countdown > 0 || loading}
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
    gap: 10,
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    height: 56,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 22,
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
    marginTop: 20,
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
