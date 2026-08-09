import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
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

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&h=200&fit=crop',
];

export default function PostCreateScreen({ navigation }: ScreenProps<'PostCreate'>) {
  const { createPost } = usePosts();
  const { user, addPostId } = useMyProfile();
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState(PLACEHOLDER_IMAGES);

  const handlePost = () => {
    if (!caption.trim()) return;
    const post = createPost(user, caption.trim(), media);
    addPostId(post.id);
    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <Button title="Post" size="sm" onPress={handlePost} disabled={!caption.trim()} />
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

        <View style={styles.mediaGrid}>
          {media.map((uri, i) => (
            <View key={i} style={styles.mediaSlot}>
              <Image source={{ uri }} style={styles.mediaImage} contentFit="cover" />
              <TouchableOpacity
                style={styles.removeMedia}
                onPress={() => setMedia(media.filter((_, idx) => idx !== i))}
              >
                <Ionicons name="close-circle" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>
          ))}
          {media.length < 10 && (
            <TouchableOpacity
              style={styles.addMedia}
              onPress={() => navigation.navigate('PhotoCapture')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={32} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.charCount}>{caption.length}/2200</Text>
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
  content: { padding: spacing.screen },
  caption: { ...typography.body, color: colors.text, minHeight: 100, textAlignVertical: 'top', marginBottom: spacing.xl },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mediaSlot: { width: '31%', aspectRatio: 1, position: 'relative' },
  mediaImage: { width: '100%', height: '100%', borderRadius: radius.button },
  removeMedia: { position: 'absolute', top: 4, right: 4 },
  addMedia: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '08',
  },
  charCount: { ...typography.caption, color: colors.textSecondary, textAlign: 'right', marginTop: spacing.lg },
});
