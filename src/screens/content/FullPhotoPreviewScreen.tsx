import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing } from '../../theme';
import { ScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FullPhotoPreviewScreen({ route, navigation }: ScreenProps<'FullPhotoPreview'>) {
  const { images, initialIndex = 0 } = route.params;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  return (
    <ScreenContainer padded={false} backgroundColor="#000">
      <StatusBar style="light" />
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color={colors.white} />
      </TouchableOpacity>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: activeIndex * SCREEN_WIDTH, y: 0 }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
      >
        {images.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.image} contentFit="contain" />
        ))}
      </ScrollView>

      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute', top: spacing.xxxl, right: spacing.screen,
    zIndex: 10, width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  image: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  dots: {
    position: 'absolute', bottom: spacing.xxxl, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: colors.white, width: 20 },
});
