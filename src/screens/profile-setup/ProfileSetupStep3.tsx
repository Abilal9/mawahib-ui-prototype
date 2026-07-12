import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

export default function ProfileSetupStep3({ onNext, onBack, step, totalSteps }: StepProps) {
  const [photos, setPhotos] = useState<string[]>([]);

  const addPlaceholder = () => {
    const placeholders = [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
    ];
    if (photos.length < 6) {
      setPhotos([...photos, placeholders[photos.length % placeholders.length]]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>Step {step} of {totalSteps}</Text>
        <Text style={styles.title}>Portfolio Photos</Text>
        <Text style={styles.subtitle}>Upload your best work to showcase your talent</Text>

        <View style={styles.grid}>
          {photos.map((uri, i) => (
            <View key={i} style={styles.photoSlot}>
              <Image source={{ uri }} style={styles.photo} contentFit="cover" />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setPhotos(photos.filter((_, idx) => idx !== i))}
              >
                <Ionicons name="close-circle" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 6 && (
            <TouchableOpacity style={styles.addSlot} onPress={addPlaceholder} activeOpacity={0.8}>
              <Ionicons name="add" size={32} color={colors.primary} />
              <Text style={styles.addText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  photoSlot: { width: '30%', aspectRatio: 1, position: 'relative' },
  photo: { width: '100%', height: '100%', borderRadius: radius.card },
  removeButton: { position: 'absolute', top: -6, right: -6 },
  addSlot: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '08',
  },
  addText: { ...typography.caption, color: colors.primary, marginTop: spacing.xs },
  footer: { paddingBottom: spacing.lg },
  backButton: { marginBottom: spacing.md },
});
