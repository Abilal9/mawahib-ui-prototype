import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import ActionBusyOverlay from '../../components/ui/ActionBusyOverlay';
import SuccessConfirmationModal from '../../components/ui/SuccessConfirmationModal';
import { colors, spacing, radius, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import { useUserJobs } from '../../context/UserJobsContext';
import { useMarketplaceSuccess } from '../../hooks/useMarketplaceSuccess';
import { ApiError } from '../../lib/apiClient';

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'freelance'] as const;
const TOTAL_STEPS = 3;

export default function PostJobScreen({ route, navigation }: ScreenProps<'PostJob'>) {
  const { createPostedJob, refresh } = useUserJobs();
  const {
    successVisible,
    successTitle,
    successMessage,
    showSuccess,
    completeSuccess,
  } = useMarketplaceSuccess(navigation, refresh);
  const step = route.params?.step ?? 1;
  const [title, setTitle] = useState('');
  const [type, setType] = useState<typeof JOB_TYPES[number]>('full-time');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      navigation.navigate('PostJob', { step: step + 1 });
      return;
    }
    void (async () => {
      setSubmitting(true);
      try {
        await createPostedJob({
          title,
          description,
          location,
          budget: salary,
          jobType: type,
        });
        showSuccess('jobPosted');
      } catch (e) {
        Alert.alert(
          'Could not post job',
          e instanceof ApiError ? e.message : 'Please try again.',
        );
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 1 ? navigation.navigate('PostJob', { step: step - 1 }) : navigation.goBack())}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <Text style={styles.stepIndicator}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {step === 1 && (
          <>
            <Text style={styles.title}>Job Details</Text>
            <TextInput label="Job Title" placeholder="e.g. Senior UI Designer" value={title} onChangeText={setTitle} />
            <Text style={styles.label}>Job Type</Text>
            <View style={styles.typeRow}>
              {JOB_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, type === t && styles.typeChipSelected]}
                  onPress={() => setType(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeText, type === t && styles.typeTextSelected]}>
                    {t.replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.title}>Location & Compensation</Text>
            <TextInput label="Location" placeholder="City, Country or Remote" value={location} onChangeText={setLocation} />
            <TextInput label="Salary Range" placeholder="e.g. AED 15,000 - 20,000/mo" value={salary} onChangeText={setSalary} />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.title}>Description</Text>
            <TextInput
              label="Job Description"
              placeholder="Describe the role, responsibilities, and requirements..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={8}
              style={styles.descriptionInput}
            />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={
            submitting
              ? 'Posting…'
              : step === TOTAL_STEPS
                ? 'Post Job'
                : 'Continue'
          }
          onPress={goNext}
          fullWidth
          disabled={submitting || (step === 1 && !title.trim())}
        />
      </View>

      <ActionBusyOverlay visible={submitting} message="Publishing job…" />
      <SuccessConfirmationModal
        visible={successVisible}
        title={successTitle}
        message={successMessage}
        onDone={() => void completeSuccess()}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: { ...typography.h3, color: colors.text },
  stepIndicator: { ...typography.bodySmall, color: colors.textSecondary },
  progressBar: { height: 4, backgroundColor: colors.borderLight, borderRadius: 2, marginBottom: spacing.xl, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  content: { paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xl },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.md },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  typeChip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border,
  },
  typeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { ...typography.bodySmall, color: colors.text, textTransform: 'capitalize' },
  typeTextSelected: { color: colors.white },
  descriptionInput: { minHeight: 160, textAlignVertical: 'top' },
  footer: { paddingBottom: spacing.lg },
});
