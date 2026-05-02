import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function PhoneScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (phone.length < 10) {
      setError('برجاء إدخال رقم هاتف صحيح');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OTP', { phone: '0' + phone });
    }, 800);
  };

  const formatPhone = (text) => {
    const cleaned = text.replace(/\D/g, '');
    setPhone(cleaned.slice(0, 10));
    if (error) setError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="phone-portrait-outline" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>أدخل رقم هاتفك</Text>
          <Text style={styles.subtitle}>
            هنبعتلك كود تحقق على رقمك
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>رقم الهاتف</Text>
          <View style={[styles.inputRow, error ? styles.inputError : null]}>
            <View style={styles.flagContainer}>
              <Text style={styles.flag}>🇪🇬</Text>
              <Text style={styles.countryCode}>+20</Text>
            </View>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={formatPhone}
              keyboardType="phone-pad"
              placeholder="1XXXXXXXXX"
              placeholderTextColor={colors.textMuted}
              maxLength={10}
              textAlign="left"
              autoFocus
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            الكود التجريبي هو: <Text style={styles.bold}>1234</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <Text style={styles.buttonText}>جاري الإرسال...</Text>
          ) : (
            <>
              <Text style={styles.buttonText}>إرسال الكود</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          بتسجيلك، بتوافق على{' '}
          <Text style={styles.link}>شروط الاستخدام</Text>
          {' '}و{' '}
          <Text style={styles.link}>سياسة الخصوصية</Text>
        </Text>

        <TouchableOpacity
          style={styles.adminLink}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Text style={styles.adminLinkText}>دخول المشرف</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
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
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    overflow: 'hidden',
    height: 56,
  },
  inputError: {
    borderColor: colors.error,
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  flag: {
    fontSize: 22,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    paddingHorizontal: 12,
    fontWeight: '500',
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'right',
    marginTop: 6,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0E8',
    padding: 12,
    borderRadius: 12,
    marginBottom: 32,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  footer: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
  adminLink: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 8,
  },
  adminLinkText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
