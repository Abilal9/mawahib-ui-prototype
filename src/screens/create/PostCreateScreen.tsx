import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import { usePosts } from '../../context/PostsContext';
import { useMyProfile } from '../../context/ProfileContext';
import { pickAndUploadImage } from '../../lib/uploadMedia';
import { MAX_POST_IMAGES } from '../../constants/posts';

type LocalMedia = { uri: string; mediaAssetId: string };

export default function PostCreateScreen({ navigation }: ScreenProps<'PostCreate'>) {
  const { createPost } = usePosts();
  const { addPostId } = useMyProfile();
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<LocalMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const postingRef = useRef(false);

  const canPost =
    (caption.trim().length > 0 || media.length > 0) && !uploading && !posting;

  const handleAddMedia = async () => {
    if (media.length >= MAX_POST_IMAGES) {
      Alert.alert('Image limit', `You can add up to ${MAX_POST_IMAGES} images per post.`);
      return;
    }
    setUploading(true);
    try {
      const uploaded = await pickAndUploadImage('post');
      if (!uploaded) return;
      setMedia((prev) => {
        if (prev.length >= MAX_POST_IMAGES) {
          Alert.alert(
            'Image limit',
            `You can add up to ${MAX_POST_IMAGES} images per post.`,
          );
          return prev;
        }
        return [...prev, { uri: uploaded.uri, mediaAssetId: uploaded.mediaAssetId }];
      });
    } catch (e) {
      Alert.alert(
        'Upload failed',
        e instanceof Error ? e.message : 'Could not upload image',
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePost = async () => {
    if (!canPost || postingRef.current) return;
    postingRef.current = true;
    setPosting(true);
    try {
      const post = await createPost({
        text: caption.trim() || undefined,
        mediaAssetIds: media.map((m) => m.mediaAssetId),
      });
      addPostId(post.id);
      navigation.goBack();
    } catch (e) {
      Alert.alert(
        'Could not create post',
        e instanceof Error ? e.message : 'Please try again',
      );
    } finally {
      postingRef.current = false;
      setPosting(false);
    }
  };

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <Button
          title={posting ? '…' : 'Post'}
          size="sm"
          onPress={() => void handlePost()}
          disabled={!canPost}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.caption}
          placeholder="Write a caption..."
          placeholderTextColor={colors.textSecondary}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={2200}
        />

        <View style={styles.mediaSection}>
          <View style={styles.counterChip} pointerEvents="none">
            <Text style={styles.counterText}>
              {media.length}/{MAX_POST_IMAGES}
            </Text>
          </View>
          <View style={styles.mediaGrid}>
            {media.map((item) => (
              <View key={item.mediaAssetId} style={styles.mediaSlot}>
                <Image source={{ uri: item.uri }} style={styles.mediaImage} contentFit="cover" />
                <TouchableOpacity
                  style={styles.removeMedia}
                  onPress={() =>
                    setMedia((prev) =>
                      prev.filter((m) => m.mediaAssetId !== item.mediaAssetId),
                    )
                  }
                >
                  <Ionicons name="close-circle" size={22} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            {media.length < MAX_POST_IMAGES ? (
              <TouchableOpacity
                style={styles.addMedia}
                onPress={() => void handleAddMedia()}
                activeOpacity={0.8}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Ionicons name="add" size={32} color={colors.primary} />
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cancelBtn: { ...typography.body, color: colors.textSecondary },
  headerTitle: { ...typography.h3, color: colors.text },
  content: { padding: spacing.screen, gap: spacing.lg },
  caption: {
    ...typography.body,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  mediaSection: {
    position: 'relative',
    minHeight: 100,
  },
  counterChip: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    backgroundColor: 'rgba(14, 36, 58, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  counterText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: 28,
  },
  mediaSlot: {
    width: 100,
    height: 100,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  mediaImage: { width: '100%', height: '100%' },
  removeMedia: { position: 'absolute', top: 4, right: 4 },
  addMedia: {
    width: 100,
    height: 100,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
