import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { RootStackScreenProps } from '../../navigation/types';
import { useAuth, AccountType } from '../../context/AuthContext';

const OPTIONS: {
  type: AccountType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    type: 'talent',
    title: 'Talent',
    description: 'Showcase your skills, portfolio, and find opportunities.',
    icon: 'person-outline',
  },
  {
    type: 'business',
    title: 'Business',
    description: 'Hire talent, post jobs, and grow your team.',
    icon: 'business-outline',
  },
];

export default function AccountTypeScreen({
  navigation,
}: RootStackScreenProps<'AccountType'>) {
  const { accountType, setAccountType } = useAuth();

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />

        <Text style={styles.title}>Join Mawahib</Text>
        <Text style={styles.subtitle}>Choose how you want to use the platform.</Text>

        <View style={styles.options}>
          {OPTIONS.map((option) => {
            const selected = accountType === option.type;
            return (
              <TouchableOpacity
                key={option.type}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                onPress={() => setAccountType(option.type)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                  <Ionicons
                    name={option.icon}
                    size={28}
                    color={selected ? colors.white : colors.primary}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title="Continue"
          onPress={() => navigation.navigate('SignUp')}
          disabled={!accountType}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.footerLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  options: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF5FA',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.button,
    backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
