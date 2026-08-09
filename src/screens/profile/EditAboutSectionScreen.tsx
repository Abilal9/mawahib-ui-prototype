import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { useMyProfile } from '../../context/ProfileContext';
import { ABOUT_SECTION_LABELS, AboutSectionKey } from '../../data/types';
import { profileService } from '../../services';
import { ScreenProps } from '../../navigation/types';

export default function EditAboutSectionScreen({
  navigation,
  route,
}: ScreenProps<'EditAboutSection'>) {
  const { section } = route.params;
  const insets = useSafeAreaInsets();
  const profile = useMyProfile();
  const label = ABOUT_SECTION_LABELS[section];
  const filledSeed = profileService.getFilledContent();

  const [bio, setBio] = useState(profile.content.bio || filledSeed.bio);
  const [talentsText, setTalentsText] = useState(
    (profile.content.talents.length
      ? profile.content.talents
      : filledSeed.talents
    ).join(', ')
  );
  const [languageName, setLanguageName] = useState('English');
  const [languageLevel, setLanguageLevel] = useState('C1 Advanced');
  const [eduSchool, setEduSchool] = useState('King Saud University');
  const [eduDegree, setEduDegree] = useState("Bachelor's");
  const [eduField, setEduField] = useState('Media & Communication');
  const [eduYears, setEduYears] = useState('2016 – 2020');
  const [expTitle, setExpTitle] = useState('Event Photographer');
  const [expCompany, setExpCompany] = useState('Freelance');
  const [expType, setExpType] = useState('Full-time');
  const [expYears, setExpYears] = useState('2020 – Present');
  const [expDesc, setExpDesc] = useState(
    'Capturing brand and cultural events across Riyadh and Jeddah.'
  );
  const [certName, setCertName] = useState('Adobe Certified Professional');
  const [certOrg, setCertOrg] = useState('Adobe');
  const [certYear, setCertYear] = useState('2023');

  const save = () => {
    switch (section as AboutSectionKey) {
      case 'bio':
        profile.setBio(bio.trim());
        break;
      case 'languages':
        profile.setLanguages([
          ...profile.content.languages.filter((l) => l.name !== languageName),
          {
            id: `lang-${Date.now()}`,
            name: languageName.trim() || 'English',
            level: languageLevel.trim() || 'C1',
            flag: languageName.toLowerCase().includes('arab') ? '🇸🇦' : '🇬🇧',
          },
        ]);
        break;
      case 'talents':
        profile.setTalents(
          talentsText
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        );
        break;
      case 'education':
        profile.setEducation([
          ...profile.content.education,
          {
            id: `edu-${Date.now()}`,
            school: eduSchool,
            degree: eduDegree,
            field: eduField,
            years: eduYears,
          },
        ]);
        break;
      case 'experience':
        profile.setExperience([
          ...profile.content.experience,
          {
            id: `exp-${Date.now()}`,
            title: expTitle,
            company: expCompany,
            type: expType,
            years: expYears,
            description: expDesc,
          },
        ]);
        break;
      case 'certifications':
        profile.setCertifications([
          ...profile.content.certifications,
          {
            id: `cert-${Date.now()}`,
            name: certName,
            org: certOrg,
            year: certYear,
          },
        ]);
        break;
    }
    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false} safeTop={false} backgroundColor={colors.white}>
      <StatusBar style="dark" />
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {profile.content && section === 'bio' && profile.content.bio ? 'Edit' : 'Add'} {label}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {section === 'bio' && (
            <Field
              label="Bio"
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Tell people about yourself"
              maxLength={BIO_MAX_LENGTH}
              showCount
            />
          )}

          {section === 'languages' && (
            <>
              <Field label="Language" value={languageName} onChangeText={setLanguageName} />
              <Field label="Level" value={languageLevel} onChangeText={setLanguageLevel} />
            </>
          )}

          {section === 'talents' && (
            <Field
              label="Talents"
              value={talentsText}
              onChangeText={setTalentsText}
              multiline
              placeholder="Comma separated, e.g. Videography, Editing"
            />
          )}

          {section === 'education' && (
            <>
              <Field label="Institution" value={eduSchool} onChangeText={setEduSchool} />
              <Field label="Degree" value={eduDegree} onChangeText={setEduDegree} />
              <Field label="Field of study" value={eduField} onChangeText={setEduField} />
              <Field label="Years" value={eduYears} onChangeText={setEduYears} />
            </>
          )}

          {section === 'experience' && (
            <>
              <Field label="Title" value={expTitle} onChangeText={setExpTitle} />
              <Field label="Company" value={expCompany} onChangeText={setExpCompany} />
              <Field label="Employment type" value={expType} onChangeText={setExpType} />
              <Field label="Years" value={expYears} onChangeText={setExpYears} />
              <Field
                label="Description"
                value={expDesc}
                onChangeText={setExpDesc}
                multiline
              />
            </>
          )}

          {section === 'certifications' && (
            <>
              <Field label="Certification name" value={certName} onChangeText={setCertName} />
              <Field label="Issuing organization" value={certOrg} onChangeText={setCertOrg} />
              <Field label="Year" value={certYear} onChangeText={setCertYear} />
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Button title="Save" onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const BIO_MAX_LENGTH = 500;

function Field({
  label,
  value,
  onChangeText,
  multiline,
  placeholder,
  maxLength,
  showCount,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  showCount?: boolean;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {showCount && maxLength != null ? (
          <Text style={styles.charCount}>
            {value.length}/{maxLength}
          </Text>
        ) : null}
      </View>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h3, color: colors.text },
  content: {
    padding: spacing.screen,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  field: { gap: spacing.sm },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { ...typography.label, color: colors.text },
  charCount: { ...typography.caption, color: colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 120,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
