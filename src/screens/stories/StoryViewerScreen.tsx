import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { toImageSource } from '../../utils/image';
import { colors, spacing, typography } from '../../theme';
import { getStoryById } from '../../data/mock/stories';
import { ScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StoryViewerScreen({ route, navigation }: ScreenProps<'StoryViewer'>) {
  const story = getStoryById(route.params.storyId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!story) return;
    const duration = story.items[currentIndex]?.duration ?? 5000;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          if (currentIndex < story.items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          }
          navigation.goBack();
          return 1;
        }
        return p + 0.02;
      });
    }, duration / 50);
    return () => clearInterval(interval);
  }, [currentIndex, story, navigation]);

  if (!story) {
    return (
      <ScreenContainer>
        <Text>Story not found</Text>
      </ScreenContainer>
    );
  }

  const currentItem = story.items[currentIndex];

  return (
    <ScreenContainer padded={false} backgroundColor="#000">
      <StatusBar style="light" />
      <Image source={{ uri: currentItem.url }} style={styles.storyImage} contentFit="cover" />

      <View style={styles.overlay}>
        <View style={styles.progressBars}>
          {story.items.map((_, i) => (
            <View key={i} style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: i < currentIndex ? '100%' : i === currentIndex ? `${progress * 100}%` : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.userRow}>
          <Image source={toImageSource(story.user.avatar)} style={styles.avatar} contentFit="cover" />
          <Text style={styles.userName}>{story.user.name}</Text>
          <Text style={styles.timeAgo}>2h ago</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.tapLeft}
        onPress={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
      />
      <TouchableOpacity
        style={styles.tapRight}
        onPress={() => {
          if (currentIndex < story.items.length - 1) setCurrentIndex(currentIndex + 1);
          else navigation.goBack();
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  storyImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, position: 'absolute' },
  overlay: { flex: 1, paddingTop: spacing.xl },
  progressBars: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.sm },
  progressBarBg: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.white, borderRadius: 2 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.md, gap: spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  userName: { ...typography.label, color: colors.white },
  timeAgo: { ...typography.caption, color: colors.white + '80' },
  closeButton: { marginLeft: 'auto' },
  tapLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%' },
  tapRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '70%' },
});
