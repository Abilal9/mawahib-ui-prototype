import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TextInput from '../../components/ui/TextInput';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

interface ServiceDraft {
  title: string;
  price: string;
}

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

export default function ProfileSetupStep4({ onNext, onBack, step, totalSteps }: StepProps) {
  const [services, setServices] = useState<ServiceDraft[]>([{ title: '', price: '' }]);

  const addService = () => setServices([...services, { title: '', price: '' }]);
  const updateService = (index: number, field: keyof ServiceDraft, value: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>Step {step} of {totalSteps}</Text>
        <Text style={styles.title}>Your Services</Text>
        <Text style={styles.subtitle}>Add services you offer to clients</Text>

        {services.map((service, index) => (
          <View key={index} style={styles.serviceCard}>
            <Text style={styles.serviceLabel}>Service {index + 1}</Text>
            <TextInput
              placeholder="Service title"
              value={service.title}
              onChangeText={(v) => updateService(index, 'title', v)}
              containerStyle={styles.inputNoMargin}
            />
            <TextInput
              placeholder="Price (AED)"
              value={service.price}
              onChangeText={(v) => updateService(index, 'price', v)}
              keyboardType="numeric"
              containerStyle={styles.inputNoMargin}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addService} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Another Service</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        {onBack && <Button title="Back" variant="outline" onPress={onBack} style={styles.backButton} />}
        <Button title="Continue" onPress={onNext} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: spacing.xl },
  stepLabel: { ...typography.caption, color: colors.primary, marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  serviceLabel: { ...typography.label, color: colors.textTertiary, marginBottom: spacing.md },
  inputNoMargin: { marginBottom: spacing.md },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  addButtonText: { ...typography.bodyMedium, color: colors.primary },
  footer: { paddingBottom: spacing.lg },
  backButton: { marginBottom: spacing.md },
});
