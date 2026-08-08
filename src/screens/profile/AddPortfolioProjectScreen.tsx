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
import ReorderableMediaGrid from '../../components/ui/ReorderableMediaGrid';
import { colors, spacing, radius, typography } from '../../theme';
import { useMyProfile } from '../../context/ProfileContext';
import { ScreenProps } from '../../navigation/types';

const MAX_MEDIA = 10;

const SAMPLE_MEDIA = [
  'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=400&h=400&fit=crop',
];

export default function AddPortfolioProjectScreen({
  navigation,
  route,
}: ScreenProps<'AddPortfolioProject'>) {
  const insets = useSafeAreaInsets();
  const { content, addPortfolioProject, updatePortfolioProject } = useMyProfile();
  const editingId = route.params?.projectId;
  const existing = editingId
    ? content.portfolio.find((p) => p.id === editingId)
    : undefined;
  const isEditing = Boolean(existing);

  const [title, setTitle] = useState(
    existing?.title ?? 'E-commerce App Redesign'
  );
  const [description, setDescription] = useState(
    existing?.description ??
      'A complete UX/UI redesign for a multi-category shopping experience focused on speed and clarity.'
  );
  const [media, setMedia] = useState<string[]>(
    () => existing?.images ?? [...SAMPLE_MEDIA]
  );
  const [mediaDragging, setMediaDragging] = useState(false);

  const addMedia = () => {
    if (media.length >= MAX_MEDIA) return;
    setMedia((prev) => [...prev, SAMPLE_MEDIA[prev.length % SAMPLE_MEDIA.length]]);
  };

  const save = () => {
    const trimmedTitle = title.trim() || 'Untitled project';
    const trimmedDesc = description.trim();
    const images = media.length > 0 ? media : [SAMPLE_MEDIA[0]];

    if (isEditing && existing) {
      updatePortfolioProject(existing.id, {
        ...existing,
        title: trimmedTitle,
        description: trimmedDesc,
        images,
        hasVideo: images.length > 4,
      });
    } else {
      addPortfolioProject({
        id: `proj-${Date.now()}`,
        title: trimmedTitle,
        description: trimmedDesc,
        images,
        hasVideo: images.length > 4,
      });
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
        <Text style={styles.title}>{isEditing ? 'Edit Project' : 'Add Project'}</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!mediaDragging}
        >
          <Text style={styles.label}>Project title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.mediaHeader}>
            <Text style={styles.labelInline}>Project media</Text>
            <Text style={styles.mediaCount}>
              {media.length}/{MAX_MEDIA}
            </Text>
          </View>
          <Text style={styles.mediaHint}>
            First image is the cover. Hold the grip to drag and reorder.
          </Text>
          <ReorderableMediaGrid
            uris={media}
            onChange={setMedia}
            maxItems={MAX_MEDIA}
            onAdd={addMedia}
            videoIndex={media.length > 4 ? 4 : undefined}
            onDraggingChange={setMediaDragging}
          />
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Button title={isEditing ? 'Save Changes' : 'Publish Project'} onPress={save} />
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
  content: { padding: spacing.screen, paddingBottom: spacing.xxl },
  label: { ...typography.label, color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  labelInline: { ...typography.label, color: colors.text },
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
  mediaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  mediaCount: { ...typography.caption, color: colors.textSecondary },
  mediaHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
