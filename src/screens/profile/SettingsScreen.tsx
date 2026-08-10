import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { ScreenProps } from '../../navigation/types';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { id: 'profile', icon: 'person-outline' as const, label: 'Edit Profile' },
      { id: 'premium', icon: 'diamond-outline' as const, label: 'Mawahib Premium', highlight: true },
      { id: 'privacy', icon: 'lock-closed-outline' as const, label: 'Privacy & Security' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { id: 'notifications', icon: 'notifications-outline' as const, label: 'Notifications', toggle: true },
      { id: 'language', icon: 'language-outline' as const, label: 'Language', value: 'English' },
      { id: 'calendar', icon: 'calendar-outline' as const, label: 'Calendar' },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: 'help', icon: 'help-circle-outline' as const, label: 'Help Center' },
      { id: 'feedback', icon: 'chatbox-outline' as const, label: 'Send Feedback' },
      { id: 'about', icon: 'information-circle-outline' as const, label: 'About Mawahib' },
    ],
  },
];

export default function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  const { signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.row, index < section.items.length - 1 && styles.rowBorder]}
                  onPress={() => {
                    if ('toggle' in item && item.toggle) return;
                    if (item.id === 'premium') {
                      navigation.navigate('Premium');
                      return;
                    }
                    if (item.id === 'calendar') {
                      navigation.navigate('Calendar');
                      return;
                    }
                    if (item.id === 'language') {
                      navigation.navigate('ChangeLanguage');
                      return;
                    }
                    if (item.id === 'profile') {
                      navigation.navigate('EditProfile');
                      return;
                    }
                    Alert.alert('Coming soon', `${item.label} will be available in a future update.`);
                  }}
                  activeOpacity={'toggle' in item && item.toggle ? 1 : 0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={'highlight' in item && item.highlight ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.rowLabel, 'highlight' in item && item.highlight && styles.rowHighlight]}>
                    {item.label}
                  </Text>
                  {'value' in item && item.value && (
                    <Text style={styles.rowValue}>{item.value}</Text>
                  )}
                  {'toggle' in item && item.toggle ? (
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                      trackColor={{ true: colors.primary }}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={() => {
            void (async () => {
              await signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'SignIn' }],
              });
            })();
          }}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Mawahib v1.0.0</Text>
      </ScrollView>
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
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCard: { backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1, borderColor: colors.borderLight },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowLabel: { ...typography.body, color: colors.text, flex: 1 },
  rowHighlight: { color: colors.primary, fontFamily: typography.label.fontFamily },
  rowValue: { ...typography.bodySmall, color: colors.textSecondary, marginRight: spacing.xs },
  logoutButton: {
    alignItems: 'center', paddingVertical: spacing.lg,
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.error + '30', marginTop: spacing.lg,
  },
  logoutText: { ...typography.label, color: colors.error },
  version: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
});
