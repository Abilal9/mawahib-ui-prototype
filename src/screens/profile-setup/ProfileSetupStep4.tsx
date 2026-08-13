import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TextInput from '../../components/ui/TextInput';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { useMyProfile } from '../../context/ProfileContext';
import { ProfileService } from '../../data/types';
import { ProfileSetupStepProps } from './stepProps';

interface ServiceDraft {
  title: string;
  price: string;
}

const SETUP_SERVICE_PREFIX = 'setup-service-';

function draftsFromContent(services: ProfileService[]): ServiceDraft[] {
  const fromSetup = services
    .filter((s) => s.id.startsWith(SETUP_SERVICE_PREFIX))
    .map((s) => ({
      title: s.title,
      price: s.packages[0]?.priceLabel?.replace(/[^\d.]/g, '') ?? '',
    }));
  return fromSetup.length > 0 ? fromSetup : [{ title: '', price: '' }];
}

export default function ProfileSetupStep4({
  onNext,
  onBack,
  onSave,
  step,
  totalSteps,
}: ProfileSetupStepProps) {
  const { content, setServices } = useMyProfile();
  const [services, setLocalServices] = useState<ServiceDraft[]>(() =>
    draftsFromContent(content.services)
  );

  const addService = () => setLocalServices([...services, { title: '', price: '' }]);
  const updateService = (index: number, field: keyof ServiceDraft, value: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setLocalServices(updated);
  };

  const persist = () => {
    const drafts = services.filter((s) => s.title.trim());
    const withoutSetup = content.services.filter((s) => !s.id.startsWith(SETUP_SERVICE_PREFIX));
    if (drafts.length === 0) {
      setServices(withoutSetup);
      return;
    }
    const setupServices: ProfileService[] = drafts.map((s, i) => ({
      id: `${SETUP_SERVICE_PREFIX}${i}`,
      title: s.title.trim(),
      description: 'Added during profile setup',
      rating: 0,
      reviewCount: 0,
      images: [
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
      ],
      packages: [
        {
          name: 'Basic',
          priceLabel: s.price.trim() ? s.price.trim() : '—',
          delivery: '3 days',
          includes: ['As discussed'],
        },
      ],
    }));
    setServices([...setupServices, ...withoutSetup]);
  };

  const handleContinue = () => {
    persist();
    onNext();
  };

  const handleSave = () => {
    persist();
    onSave();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>
          Step {step} of {totalSteps}
        </Text>
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
              placeholder="Price"
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
        {onBack ? (
          <Button title="Back" variant="outline" onPress={onBack} style={styles.secondary} />
        ) : null}
        <Button title="Continue" onPress={handleContinue} fullWidth />
        <Button title="Save & exit" variant="ghost" onPress={handleSave} fullWidth style={styles.secondary} />
        <Button title="Skip" variant="ghost" onPress={onNext} fullWidth />
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  addButtonText: { ...typography.bodyMedium, color: colors.primary },
  footer: { paddingBottom: spacing.lg },
  secondary: { marginBottom: spacing.sm },
});
