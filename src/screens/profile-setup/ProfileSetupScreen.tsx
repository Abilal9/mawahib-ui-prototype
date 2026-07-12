import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import ProfileSetupStep1 from './ProfileSetupStep1';
import ProfileSetupStep2 from './ProfileSetupStep2';
import ProfileSetupStep3 from './ProfileSetupStep3';
import ProfileSetupStep4 from './ProfileSetupStep4';
import ProfileSetupStep5 from './ProfileSetupStep5';
import { colors, spacing } from '../../theme';
import { ScreenProps } from '../../navigation/types';

const STEPS = [ProfileSetupStep1, ProfileSetupStep2, ProfileSetupStep3, ProfileSetupStep4, ProfileSetupStep5];
const TOTAL_STEPS = STEPS.length;

export default function ProfileSetupScreen({ route, navigation }: ScreenProps<'ProfileSetup'>) {
  const step = Math.min(Math.max(route.params?.step ?? 1, 1), TOTAL_STEPS);
  const StepComponent = STEPS[step - 1];

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      navigation.navigate('ProfileSetup', { step: step + 1 });
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const goBack = () => {
    if (step > 1) {
      navigation.navigate('ProfileSetup', { step: step - 1 });
    }
  };

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>
      <StepComponent onNext={goNext} onBack={step > 1 ? goBack : undefined} step={step} totalSteps={TOTAL_STEPS} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
