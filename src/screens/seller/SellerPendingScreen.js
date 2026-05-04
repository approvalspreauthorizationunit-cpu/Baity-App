import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export default function SellerPendingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState({ status: 'pending', rejection_reason: '' });

  useEffect(() => {
    checkStatus();
    // Check status every 30 seconds while on this screen
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('status, rejection_reason')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setStatusInfo(data);
        if (data.status === 'approved') {
          updateUser({ sellerStatus: 'approved' });
          navigation.replace('SellerRoot');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons
            name={statusInfo.status === 'needs_info' ? "alert-circle-outline" : "time-outline"}
            size={80}
            color={statusInfo.status === 'needs_info' ? colors.error : colors.primary}
          />
        </View>

        <Text style={styles.title}>
          {statusInfo.status === 'needs_info' ? 'مطلوب تحديث بيانات' : 'طلبك قيد المراجعة'}
        </Text>

        <Text style={styles.message}>
          {statusInfo.status === 'needs_info'
            ? 'تمت مراجعة طلبك ومطلوب منك تحديث بعض البيانات أو المستندات.'
            : 'شكراً لتسجيلك في بيتي. سيتم مراجعة بياناتك ومستنداتك والرد عليك في أقرب وقت.'
          }
        </Text>

        {statusInfo.status === 'needs_info' && statusInfo.rejection_reason && (
          <View style={styles.reasonCard}>
            <Text style={styles.reasonTitle}>يرجى مراجعة الملاحظات التالية:</Text>
            <Text style={styles.reasonText}>{statusInfo.rejection_reason}</Text>
          </View>
        )}

        <View style={styles.footer}>
          {statusInfo.status === 'needs_info' && (
            <TouchableOpacity
              style={styles.updateBtn}
              onPress={() => navigation.navigate('SellerRegistration', { editMode: true })}
            >
              <Text style={styles.updateBtnText}>تحديث البيانات</Text>
              <Ionicons name="pencil-outline" size={20} color={colors.white} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
            <Ionicons name="log-out-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 24 },
  iconCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  message: { fontSize: 16, color: colors.textLight, textAlign: 'center', lineHeight: 24 },
  reasonCard: { width: '100%', backgroundColor: '#FFF0F0', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.error, gap: 8 },
  reasonTitle: { fontSize: 14, fontWeight: 'bold', color: colors.error, textAlign: 'right' },
  reasonText: { fontSize: 14, color: colors.text, textAlign: 'right', lineHeight: 20 },
  footer: { width: '100%', gap: 12, marginTop: 24 },
  updateBtn: { width: '100%', backgroundColor: colors.primary, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  updateBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { width: '100%', backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  logoutBtnText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
});
