import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar as RNStatusBar,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 120;

type Props = {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
};

function ZoomablePage({ uri }: { uri: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const lastTap = useRef(0);
  const zoomed = useRef(false);

  const onDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      const next = zoomed.current ? 1 : 2.2;
      zoomed.current = next > 1;
      Animated.spring(scale, {
        toValue: next,
        useNativeDriver: true,
        friction: 7,
      }).start();
    }
    lastTap.current = now;
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      maximumZoomScale={4}
      minimumZoomScale={1}
      centerContent
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bouncesZoom
    >
      <TouchableOpacity activeOpacity={1} onPress={onDoubleTap}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Image source={{ uri }} style={styles.image} contentFit="contain" />
        </Animated.View>
      </TouchableOpacity>
    </ScrollView>
  );
}

/**
 * In-chat image lightbox: Modal overlay (chat stays mounted underneath).
 * Horizontal swipe between conversation images; pinch zoom via ScrollView.
 */
export default function ChatImageLightbox({
  visible,
  images,
  initialIndex,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const listRef = useRef<FlatList<string>>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const safeImages = useMemo(
    () => images.filter((u) => typeof u === 'string' && u.length > 0),
    [images],
  );

  useEffect(() => {
    if (!visible) return;
    const start = Math.min(
      Math.max(0, initialIndex),
      Math.max(0, safeImages.length - 1),
    );
    setIndex(start);
    translateY.setValue(0);
    opacity.setValue(1);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: start, animated: false });
    });
  }, [visible, initialIndex, safeImages.length, opacity, translateY]);

  const resetDismiss = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        translateY.setValue(0);
        opacity.setValue(1);
        onClose();
      }
    });
  }, [onClose, opacity, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx) * 1.2,
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) {
            translateY.setValue(g.dy);
            opacity.setValue(Math.max(0.35, 1 - g.dy / 400));
          }
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > DISMISS_THRESHOLD || g.vy > 1.1) {
            animateClose();
          } else {
            resetDismiss();
          }
        },
      }),
    [animateClose, opacity, resetDismiss, translateY],
  );

  if (!visible || safeImages.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={animateClose}
      statusBarTranslucent
    >
      <StatusBar style="light" />
      <Animated.View
        style={[
          styles.root,
          {
            opacity,
            paddingTop:
              insets.top ||
              (Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0),
          },
        ]}
      >
        <Animated.View
          style={[styles.stage, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={[styles.closeButton, { top: spacing.md }]}
            onPress={animateClose}
            hitSlop={12}
            accessibilityLabel="Close image"
          >
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>

          <FlatList
            ref={listRef}
            data={safeImages}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            horizontal
            pagingEnabled
            getItemLayout={(_, i) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * i,
              index: i,
            })}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                listRef.current?.scrollToOffset({
                  offset: info.index * SCREEN_WIDTH,
                  animated: false,
                });
              }, 16);
            }}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(
              e: NativeSyntheticEvent<NativeScrollEvent>,
            ) => {
              const next = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setIndex(next);
            }}
            renderItem={({ item }) => <ZoomablePage uri={item} />}
          />

          {safeImages.length > 1 ? (
            <View
              style={[styles.footer, { bottom: insets.bottom + spacing.lg }]}
            >
              <View style={styles.dots}>
                {safeImages.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === index && styles.dotActive]}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
  },
  stage: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.screen,
    zIndex: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  pageContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 20,
  },
});
