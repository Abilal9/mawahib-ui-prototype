import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import { useUserJobs } from '../../context/UserJobsContext';
import { ScreenProps } from '../../navigation/types';

export default function ApplePayScreen({ route, navigation }: ScreenProps<'ApplePay'>) {
  const amount = route.params?.amount ?? 0;
  const jobId = route.params?.jobId;
  const { markJobPaid } = useUserJobs();

  const completePay = () => {
    if (jobId) {
      void (async () => {
        try {
          await markJobPaid(jobId);
        } catch {
          // Payments are still mock UI; engagement may already be in_progress.
        }
        navigation.replace('JobInProgress', { jobId });
      })();
      return;
    }
    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false} backgroundColor={colors.overlay}>
      <StatusBar style="light" />
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => navigation.goBack()} />

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.merchantRow}>
          <View style={styles.merchantIcon}>
            <Text style={styles.merchantInitial}>M</Text>
          </View>
          <View>
            <Text style={styles.merchantName}>Mawahib</Text>
            <Text style={styles.merchantDesc}>Service Payment</Text>
          </View>
        </View>

        <Text style={styles.amount}>AED {amount.toLocaleString()}</Text>

        <View style={styles.cardRow}>
          <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.cardText}>Apple Card ···· 4242</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>

        <TouchableOpacity style={styles.applePayButton} activeOpacity={0.8} onPress={completePay}>
          <Ionicons name="logo-apple" size={22} color={colors.white} />
          <Text style={styles.applePayText}>Pay</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl, paddingTop: spacing.md,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.xl },
  merchantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  merchantIcon: {
    width: 44, height: 44, borderRadius: radius.button,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  merchantInitial: { ...typography.h3, color: colors.white },
  merchantName: { ...typography.label, color: colors.text },
  merchantDesc: { ...typography.caption, color: colors.textSecondary },
  amount: { ...typography.h1, color: colors.text, textAlign: 'center', marginBottom: spacing.xl },
  cardRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, backgroundColor: colors.background,
    borderRadius: radius.card, marginBottom: spacing.xl,
  },
  cardText: { ...typography.body, color: colors.text, flex: 1 },
  applePayButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: '#000',
    borderRadius: radius.button, paddingVertical: spacing.lg,
  },
  applePayText: { ...typography.button, color: colors.white },
  cancelButton: { alignItems: 'center', paddingVertical: spacing.lg },
  cancelText: { ...typography.body, color: colors.textSecondary },
});
