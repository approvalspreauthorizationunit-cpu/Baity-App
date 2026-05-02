import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const foodTypes = ['كشري', 'فول وطعمية', 'مشاوي', 'دجاج', 'لحوم', 'سمك', 'حلويات بيتية', 'مخبوزات', 'سلطات', 'مشروبات', 'أطباق شامية', 'أكلات مصرية متنوعة'];

const steps = [
  { title: 'أهلاً بك في عائلة بيتي!', subtitle: 'دعيني أساعدك في إعداد متجرك' },
  { title: 'معلومات مطبخك', subtitle: 'أخبرينا عن نوع الأكل اللي بتعمليه' },
  { title: 'عنوانك', subtitle: 'عشان العملاء يقدروا يوصلولك' },
  { title: 'ساعات العمل', subtitle: 'امتى بتكوني متاحة للطلبات؟' },
  { title: 'تبقى جاهزة!', subtitle: 'راجعي بياناتك وابعتي الطلب للموافقة' },
];

export default function SellerSetupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateUser, switchMode } = useApp();
  const [step, setStep] = useState(0);

  const [kitchenName, setKitchenName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [selectedFoodTypes, setSelectedFoodTypes] = useState([]);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('القاهرة');
  const [fromHour, setFromHour] = useState('10:00');
  const [toHour, setToHour] = useState('21:00');

  const toggleFoodType = (type) => {
    setSelectedFoodTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedFoodTypes.length === 0) {
      Alert.alert('تنبيه', 'اختاري نوع الأكل اللي بتعمليه على الأقل');
      return;
    }
    if (step === 2 && !address.trim()) {
      Alert.alert('تنبيه', 'برجاء إدخال عنوانك');
      return;
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      'تم إرسال طلبك!',
      'سيتم مراجعة بياناتك من قبل الإدارة وستصلك إشعار بالموافقة خلال 24 ساعة.\n\nفي الوضع التجريبي: تفعيل فوري!',
      [
        {
          text: 'رائع!',
          onPress: () => {
            updateUser({
              sellerProfile: {
                sellerId: 's1', // demo: use first seller
                isSetup: true,
                kitchenName,
                bio,
                foodTypes: selectedFoodTypes,
                address: `${address}، ${city}`,
                workingHours: { from: fromHour, to: toHour },
              },
            });
            navigation.navigate('SellerTabs');
          },
        },
      ]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.welcomeIconBig}>
              <Ionicons name="restaurant-outline" size={72} color={colors.primary} />
            </View>
            <View style={styles.welcomePoints}>
              {[
                { icon: 'cash-outline',            text: 'كسبي دخل إضافي من المنزل' },
                { icon: 'time-outline',             text: 'شتغلي في أوقاتك المناسبة' },
                { icon: 'people-outline',           text: 'وصلي لآلاف العملاء في منطقتك' },
                { icon: 'phone-portrait-outline',   text: 'إدارة سهلة من موبايلك' },
              ].map((item, i) => (
                <View key={i} style={styles.welcomePoint}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                  <Text style={styles.welcomePointText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.field}>
              <Text style={styles.label}>اسم مطبخك</Text>
              <TextInput
                style={styles.input}
                value={kitchenName}
                onChangeText={setKitchenName}
                placeholder="مثال: مطبخ أم أحمد"
                placeholderTextColor={colors.textMuted}
                textAlign="right"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>نبذة عنك</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="أخبري العملاء عن نفسك وعن طبخك..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                textAlign="right"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>أنواع الأكل اللي بتعمليها *</Text>
              <View style={styles.foodTypesGrid}>
                {foodTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.foodTypeChip, selectedFoodTypes.includes(type) && styles.foodTypeChipActive]}
                    onPress={() => toggleFoodType(type)}
                  >
                    {selectedFoodTypes.includes(type) && (
                      <Ionicons name="checkmark" size={12} color={colors.white} />
                    )}
                    <Text style={[styles.foodTypeText, selectedFoodTypes.includes(type) && styles.foodTypeTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.field}>
              <Text style={styles.label}>المدينة</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="القاهرة"
                placeholderTextColor={colors.textMuted}
                textAlign="right"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>العنوان بالتفصيل *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="مثال: المعادي، شارع النصر، مبنى 15، شقة 4"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                textAlign="right"
              />
            </View>
            <TouchableOpacity style={styles.locationBtn}>
              <Ionicons name="locate-outline" size={18} color={colors.primary} />
              <Text style={styles.locationBtnText}>تحديد الموقع تلقائياً</Text>
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.workingNote}>حددي الأوقات اللي بتستقبلي فيها الطلبات</Text>
            <View style={styles.hoursRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>من الساعة</Text>
                <TextInput
                  style={styles.input}
                  value={fromHour}
                  onChangeText={setFromHour}
                  placeholder="10:00"
                  placeholderTextColor={colors.textMuted}
                  textAlign="center"
                />
              </View>
              <Ionicons name="arrow-back" size={20} color={colors.textLight} style={{ marginTop: 32 }} />
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>لحد الساعة</Text>
                <TextInput
                  style={styles.input}
                  value={toHour}
                  onChangeText={setToHour}
                  placeholder="21:00"
                  placeholderTextColor={colors.textMuted}
                  textAlign="center"
                />
              </View>
            </View>
            <View style={styles.workingDays}>
              <Text style={styles.label}>أيام العمل</Text>
              <View style={styles.daysGrid}>
                {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
                  <TouchableOpacity key={day} style={[styles.dayChip, day !== 'الجمعة' && styles.dayChipActive]}>
                    <Text style={[styles.dayText, day !== 'الجمعة' && styles.dayTextActive]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{kitchenName || user?.name}</Text>
                <Text style={styles.summaryLabel}>اسم المطبخ</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue} numberOfLines={1}>{address || 'لم يتم التحديد'}</Text>
                <Text style={styles.summaryLabel}>العنوان</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{selectedFoodTypes.slice(0, 3).join('، ')}{selectedFoodTypes.length > 3 ? '...' : ''}</Text>
                <Text style={styles.summaryLabel}>أنواع الأكل</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{fromHour} - {toHour}</Text>
                <Text style={styles.summaryLabel}>ساعات العمل</Text>
              </View>
            </View>
            <View style={styles.approvalNote}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={styles.approvalNoteText}>
                بعد إرسال طلبك، سيتم مراجعته من قبل الإدارة وستبدئي في استقبال الطلبات بعد الموافقة وشحن الرصيد.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        {step > 0 ? (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => { switchMode('customer'); navigation.goBack(); }} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.progressBar}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Step Title */}
        <View style={styles.stepTitle}>
          <Text style={styles.stepTitleText}>{steps[step].title}</Text>
          <Text style={styles.stepSubtitle}>{steps[step].subtitle}</Text>
        </View>

        {renderStep()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        {step < steps.length - 1 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>{step === 0 ? 'ابدأ الإعداد' : 'التالي'}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.success }]} onPress={handleSubmit}>
            <Text style={styles.nextBtnText}>إرسال طلب التسجيل ✓</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressBar: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  progressDotActive: { backgroundColor: colors.primary, width: 20 },
  stepTitle: { padding: 24, paddingBottom: 8 },
  stepTitleText: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'right', marginBottom: 4 },
  stepSubtitle: { fontSize: 14, color: colors.textLight, textAlign: 'right' },
  stepContent: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  welcomeIconBig: { alignItems: 'center', marginVertical: 16 },
  welcomePoints: { gap: 12 },
  welcomePoint: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 12, padding: 14,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 2,
  },
  welcomePointEmoji: { fontSize: 24 },
  welcomePointText: { fontSize: 15, color: colors.text, flex: 1, textAlign: 'right', fontWeight: '500' },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right' },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.text,
    backgroundColor: colors.white,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 },
  foodTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foodTypeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  foodTypeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  foodTypeText: { fontSize: 13, color: colors.text },
  foodTypeTextActive: { color: colors.white, fontWeight: '600' },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  locationBtnText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  workingNote: { fontSize: 13, color: colors.textLight, textAlign: 'right', marginBottom: 4 },
  hoursRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  workingDays: { gap: 8 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontSize: 13, color: colors.text },
  dayTextActive: { color: colors.white, fontWeight: '600' },
  summaryCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16, gap: 0,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summaryLabel: { fontSize: 13, color: colors.textLight, flex: 0 },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right', marginLeft: 8 },
  approvalNote: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#FFF0E8', borderRadius: 12, padding: 14,
  },
  approvalNoteText: { fontSize: 13, color: colors.text, flex: 1, textAlign: 'right', lineHeight: 20 },
  footer: {
    backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  nextBtn: {
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  nextBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
