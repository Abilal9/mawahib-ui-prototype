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
import { ScreenProps } from '../../navigation/types';

export default function AddProfileServiceScreen({
  navigation,
}: ScreenProps<'AddProfileService'>) {
  const insets = useSafeAreaInsets();
  const { addService } = useMyProfile();
  const [title, setTitle] = useState('Designing Dashboards');
  const [description, setDescription] = useState(
    'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.'
  );
  const [basicPrice, setBasicPrice] = useState('800');

  const save = () => {
    addService({
      id: `ps-${Date.now()}`,
      title: title.trim() || 'Untitled service',
      description: description.trim(),
      rating: 5,
      reviewCount: 0,
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
      ],
      packages: [
        {
          name: 'Basic',
          priceLabel: `SAR ${basicPrice || '800'}`,
          delivery: '3 days delivery',
          includes: ['1 dashboard screen', 'Wireframe', '1 revision'],
        },
        {
          name: 'Standard',
          priceLabel: `SAR ${Number(basicPrice || 800) * 2}`,
          delivery: '5 days delivery',
          includes: ['3 screens', 'Prototype', '2 revisions', 'Source files'],
        },
        {
          name: 'Premium',
          priceLabel: `SAR ${Number(basicPrice || 800) * 4}`,
          delivery: '10 days delivery',
          includes: ['Full system', 'Design system', 'Unlimited revisions', 'Handoff'],
        },
      ],
    });
    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Service</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Service name</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.label}>Basic package price (SAR)</Text>
          <TextInput
            style={styles.input}
            value={basicPrice}
            onChangeText={setBasicPrice}
            keyboardType="numeric"
          />
          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>Packages</Text>
            <Text style={styles.hintText}>
              Basic, Standard, and Premium tiers are created automatically from your basic price —
              matching the Figma service cards.
            </Text>
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Button title="Publish Service" onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
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
  content: { padding: spacing.screen, gap: spacing.sm },
  label: { ...typography.label, color: colors.text, marginTop: spacing.md },
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
  multiline: { minHeight: 110 },
  hintBox: {
    marginTop: spacing.lg,
    backgroundColor: '#FFF0F7',
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  hintTitle: { ...typography.label, color: colors.primary },
  hintText: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
