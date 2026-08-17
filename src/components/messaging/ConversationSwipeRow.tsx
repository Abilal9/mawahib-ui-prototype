import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme';

const ACTION_WIDTH = 80;
const ACTIONS_WIDTH = ACTION_WIDTH * 2;
const OPEN_THRESHOLD = ACTIONS_WIDTH * 0.35;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPressArchive: () => void;
  onPressDelete: () => void;
  onPress: () => void;
  children: React.ReactNode;
};

/**
 * Inbox row swipe: left reveals Archive + Delete. Uses RN Animated + PanResponder
 * (no react-native-reanimated / RNGH Swipeable).
 */
export default function ConversationSwipeRow({
  open,
  onOpenChange,
  onPressArchive,
  onPressDelete,
  onPress,
  children,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(open);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);

  useEffect(() => {
    openRef.current = open;
    if (draggingRef.current) return;
    Animated.spring(translateX, {
      toValue: open ? -ACTIONS_WIDTH : 0,
      useNativeDriver: true,
      friction: 9,
      tension: 80,
    }).start();
  }, [open, translateX]);

  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const snapTo = (nextOpen: boolean) => {
    openRef.current = nextOpen;
    Animated.spring(translateX, {
      toValue: nextOpen ? -ACTIONS_WIDTH : 0,
      useNativeDriver: true,
      friction: 9,
      tension: 80,
    }).start();
    onOpenChangeRef.current(nextOpen);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.15,
        onPanResponderGrant: () => {
          draggingRef.current = true;
          translateX.stopAnimation((value) => {
            startXRef.current = value;
          });
          if (!openRef.current) {
            onOpenChangeRef.current(true);
          }
        },
        onPanResponderMove: (_, g) => {
          const next = Math.min(
            0,
            Math.max(-ACTIONS_WIDTH, startXRef.current + g.dx),
          );
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          draggingRef.current = false;
          const projected = startXRef.current + g.dx;
          const shouldOpen =
            projected < -OPEN_THRESHOLD ||
            (g.vx < -0.45 && projected < -ACTION_WIDTH * 0.2);
          snapTo(shouldOpen);
        },
        onPanResponderTerminate: () => {
          draggingRef.current = false;
          snapTo(openRef.current);
        },
      }),
    [translateX],
  );

  const onContentPress = () => {
    if (openRef.current || open) {
      snapTo(false);
      return;
    }
    onPress();
  };

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.action, styles.archive]}
          onPress={onPressArchive}
          activeOpacity={0.85}
          accessibilityLabel="Archive conversation"
        >
          <Ionicons name="archive-outline" size={22} color={colors.white} />
          <Text style={styles.actionLabel}>Archive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.action, styles.delete]}
          onPress={onPressDelete}
          activeOpacity={0.85}
          accessibilityLabel="Delete conversation"
        >
          <Ionicons name="trash-outline" size={22} color={colors.white} />
          <Text style={styles.actionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.foreground, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onContentPress}
          delayPressIn={50}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  actions: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  action: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  archive: {
    backgroundColor: colors.warning,
  },
  delete: {
    backgroundColor: colors.error,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  foreground: {
    backgroundColor: colors.white,
  },
});
