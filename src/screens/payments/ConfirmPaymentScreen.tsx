import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { catalogService } from '../../services';
import { useUserJobs } from '../../context/UserJobsContext';
import { ScreenProps } from '../../navigation/types';

const CARDS = [
  { id: 'c1', brand: 'visa', last4: '4242', expiry: '12/28', default: true },
  { id: 'c2', brand: 'mastercard', last4: '8888', expiry: '06/27', default: false },
];

export default function ConfirmPaymentScreen({ route, navigation }: ScreenProps<'ConfirmPayment'>) {
  const { markJobPaid } = useUserJobs();
  const service = route.params?.serviceId
    ? catalogService.getServiceById(route.params.serviceId)
    : null;
  const jobId = route.params?.jobId;
  const amount = route.params?.amount ?? service?.price ?? 0;
  const [selectedCard, setSelectedCard] = useState('c1');

  const completePayment = () => {
    if (jobId) {
      markJobPaid(jobId);
      navigation.replace('JobInProgress', { jobId });
      return;
    }
    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Payment</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Order Summary</Text>
          {service && (
            <>
              <Text style={styles.serviceName}>{service.title}</Text>
              <Text style={styles.serviceProvider}>by {service.provider.name}</Text>
            </>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>AED {amount.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>
        {CARDS.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.cardItem, selectedCard === card.id && styles.cardItemSelected]}
            onPress={() => setSelectedCard(card.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={24} color={colors.text} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardBrand}>{card.brand.toUpperCase()} ···· {card.last4}</Text>
              <Text style={styles.cardExpiry}>Expires {card.expiry}</Text>
            </View>
            {selectedCard === card.id && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addCard} onPress={() => navigation.navigate('ScanCard')} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.addCardText}>Add New Card</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={`Pay AED ${amount.toLocaleString()}`}
          onPress={completePayment}
          fullWidth
        />
        <TouchableOpacity
          style={styles.applePayLink}
          onPress={() => {
            navigation.navigate('ApplePay', { amount, jobId });
          }}
        >
          <Text style={styles.applePayText}>Pay with Apple Pay</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingVertical: spacing.md,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.text },
  content: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl },
  summaryCard: {
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.xl, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  summaryLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  serviceName: { ...typography.h3, color: colors.text },
  serviceProvider: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.lg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...typography.label, color: colors.text },
  totalAmount: { ...typography.h2, color: colors.primary },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  cardItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1.5, borderColor: colors.borderLight,
  },
  cardItemSelected: { borderColor: colors.primary },
  cardInfo: { flex: 1 },
  cardBrand: { ...typography.label, color: colors.text },
  cardExpiry: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  addCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  addCardText: { ...typography.bodyMedium, color: colors.primary },
  footer: { padding: spacing.screen, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.white },
  applePayLink: { alignItems: 'center', marginTop: spacing.md },
  applePayText: { ...typography.bodySmall, color: colors.textSecondary },
});
