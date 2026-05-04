import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, StatusBar, Alert, ActivityIndicator, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export default function SellerRegistrationScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [kitchenName, setKitchenName] = useState('');
  const [bio, setBio] = useState('');
  const [regionId, setRegionId] = useState(null);
  const [workingHours, setWorkingHours] = useState('');

  // Document State
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [healthCert, setHealthCert] = useState(null);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    const { data } = await supabase.from('regions').select('*').eq('is_active', true);
    if (data) setRegions(data);
  };

  const pickImage = async (setter) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };

  const uploadDocument = async (uri, fileName) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = `${user.id}/${fileName}.jpg`;

    const { data, error } = await supabase.storage
      .from('seller-documents')
      .upload(path, blob, { upsert: true });

    if (error) throw error;
    return data?.path;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Upload images
      const frontPath = await uploadDocument(idFront, 'national_id_front');
      const backPath = await uploadDocument(idBack, 'national_id_back');
      const certPath = await uploadDocument(healthCert, 'health_certificate');

      // 2. Update seller profile
      const { error: profileError } = await supabase
        .from('seller_profiles')
        .update({
          kitchen_name: kitchenName,
          bio: bio,
          region_id: regionId,
          working_hours: workingHours,
          national_id_front_url: frontPath,
          national_id_back_url: backPath,
          health_certificate_url: certPath,
          health_certificate_expiry: expiryDate.toISOString().split('T')[0],
          status: 'pending'
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // 3. Update user
      const { data: updatedUser, error: userError } = await supabase
        .from('users')
        .update({ full_name: fullName, region_id: regionId })
        .eq('id', user.id)
        .select()
        .single();

      if (userError) throw userError;

      // 4. Update Context & Navigate
      updateUser({ ...updatedUser, sellerStatus: 'pending' });
      navigation.replace('SellerPending');

    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'تعذر إرسال الطلب. يرجى التأكد من اختيار جميع المستندات والمحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>الاسم الكامل *</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="ادخلي اسمك بالكامل" textAlign="right" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>اسم المطبخ *</Text>
        <TextInput style={styles.input} value={kitchenName} onChangeText={setKitchenName} placeholder="مثال: مطبخ أم أحمد" textAlign="right" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>نبذة عن مطبخك *</Text>
        <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} multiline numberOfLines={4} placeholder="اكتبي وصفاً لمهاراتك والأطباق اللي بتقدميها" textAlign="right" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>المنطقة *</Text>
        <View style={styles.regionsContainer}>
          {regions.map(r => (
            <TouchableOpacity key={r.id} style={[styles.regionChip, regionId === r.id && styles.regionChipActive]} onPress={() => setRegionId(r.id)}>
              <Text style={[styles.regionText, regionId === r.id && styles.regionTextActive]}>{r.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>ساعات العمل *</Text>
        <TextInput style={styles.input} value={workingHours} onChangeText={setWorkingHours} placeholder="مثال: 9 ص - 9 م" textAlign="right" />
      </View>
      <TouchableOpacity style={styles.nextBtn} onPress={() => {
        if (!fullName || !kitchenName || !bio || !regionId || !workingHours) {
          Alert.alert('تنبيه', 'يرجى ملء جميع الحقول المطلوبة');
          return;
        }
        setStep(2);
      }}>
        <Text style={styles.nextBtnText}>التالي</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>المستندات المطلوبة</Text>

      <View style={styles.docGroup}>
        <Text style={styles.docLabel}>صورة وجه البطاقة الشخصية *</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setIdFront)}>
          {idFront ? <Image source={{ uri: idFront }} style={styles.previewImg} /> : <Ionicons name="camera-outline" size={32} color={colors.primary} />}
          <Text style={styles.uploadText}>{idFront ? 'تم الاختيار - تغيير' : 'اضغطي للتصوير أو الاختيار'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.docGroup}>
        <Text style={styles.docLabel}>صورة ظهر البطاقة الشخصية *</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setIdBack)}>
          {idBack ? <Image source={{ uri: idBack }} style={styles.previewImg} /> : <Ionicons name="camera-outline" size={32} color={colors.primary} />}
          <Text style={styles.uploadText}>{idBack ? 'تم الاختيار - تغيير' : 'اضغطي للتصوير أو الاختيار'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.docGroup}>
        <Text style={styles.docLabel}>الشهادة الصحية *</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setHealthCert)}>
          {healthCert ? <Image source={{ uri: healthCert }} style={styles.previewImg} /> : <Ionicons name="camera-outline" size={32} color={colors.primary} />}
          <Text style={styles.uploadText}>{healthCert ? 'تم الاختيار - تغيير' : 'اضغطي للتصوير أو الاختيار'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.docGroup}>
        <Text style={styles.docLabel}>تاريخ انتهاء الشهادة الصحية *</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.dateText}>{expiryDate.toLocaleDateString('ar-EG')}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={expiryDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setExpiryDate(selectedDate);
            }}
          />
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <Text style={styles.backBtnText}>رجوع</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={() => {
          if (!idFront || !idBack || !healthCert) {
            Alert.alert('تنبيه', 'يرجى تحميل جميع المستندات المطلوبة');
            return;
          }
          setStep(3);
        }}>
          <Text style={styles.nextBtnText}>مراجعة البيانات</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>مراجعة طلب التسجيل</Text>

      <View style={styles.reviewCard}>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>الاسم:</Text>
          <Text style={styles.reviewValue}>{fullName}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>المطبخ:</Text>
          <Text style={styles.reviewValue}>{kitchenName}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>المنطقة:</Text>
          <Text style={styles.reviewValue}>{regions.find(r => r.id === regionId)?.name}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>ساعات العمل:</Text>
          <Text style={styles.reviewValue}>{workingHours}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>المستندات:</Text>
          <Text style={styles.reviewValue}>تم إرفاق 3 مستندات</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
          <Text style={styles.backBtnText}>تعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.submitBtn, loading && styles.disabledBtn]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : (
            <>
              <Text style={styles.nextBtnText}>إرسال طلب التسجيل</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>تسجيل بائعة جديدة</Text>
        <View style={styles.progressContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.progressDot, step >= i && styles.progressDotActive]} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  progressContainer: { flexDirection: 'row', gap: 8 },
  progressDot: { width: 40, height: 6, borderRadius: 3, backgroundColor: colors.border },
  progressDotActive: { backgroundColor: colors.primary },
  scroll: { padding: 20 },
  stepContainer: { gap: 16 },
  stepTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'right', marginBottom: 10 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'right' },
  input: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: colors.text },
  textArea: { height: 100, textAlignVertical: 'top' },
  regionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  regionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  regionChipActive: { borderColor: colors.primary, backgroundColor: '#FFF0E8' },
  regionText: { fontSize: 13, color: colors.text },
  regionTextActive: { color: colors.primary, fontWeight: 'bold' },
  docGroup: { gap: 10 },
  docLabel: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'right' },
  uploadBtn: { height: 120, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(232, 114, 74, 0.05)', overflow: 'hidden' },
  uploadText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  previewImg: { width: '100%', height: '100%', position: 'absolute' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 12 },
  dateText: { fontSize: 15, color: colors.text },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  nextBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  backBtn: { flex: 1, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: colors.textLight, fontSize: 16, fontWeight: '600' },
  submitBtn: { flex: 2, backgroundColor: colors.success, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  disabledBtn: { opacity: 0.7 },
  reviewCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, gap: 12, borderWidth: 1, borderColor: colors.border },
  reviewItem: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 },
  reviewLabel: { color: colors.textLight, fontSize: 14 },
  reviewValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
