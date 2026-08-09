import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  type PanResponderInstance,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLS = 3;
const GAP = spacing.sm;

function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

type MediaEntry = { id: string; uri: string };

type Props = {
  uris: string[];
  onChange: (uris: string[]) => void;
  maxItems?: number;
  onAdd?: () => void;
  /** Optional index that shows a play overlay (prototype video marker). */
  videoIndex?: number;
  onDraggingChange?: (dragging: boolean) => void;
};

/**
 * Wrap-grid media picker with Expo Go–safe PanResponder reorder.
 * First item is the cover — marked with a primary border + “Cover” badge.
 */
export default function ReorderableMediaGrid({
  uris,
  onChange,
  maxItems = 10,
  onAdd,
  videoIndex,
  onDraggingChange,
}: Props) {
  const [entries, setEntries] = useState<MediaEntry[]>(() =>
    uris.map((uri, i) => ({ id: `media-${i}-${uri.slice(-20)}`, uri }))
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const cellStrideX = useRef(0);
  const cellStrideY = useRef(0);
  const draggingIdRef = useRef<string | null>(null);
  const dragFromIndexRef = useRef(-1);
  const hoverIndexRef = useRef(-1);
  const dragTranslateX = useRef(new Animated.Value(0)).current;
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const panByIdRef = useRef<Record<string, PanResponderInstance>>({});
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onDraggingChangeRef = useRef(onDraggingChange);
  onDraggingChangeRef.current = onDraggingChange;

  // Sync from parent when uris change externally (add/remove outside drag).
  useEffect(() => {
    if (draggingIdRef.current != null) return;

    setEntries((prev) => {
      if (
        prev.length === uris.length &&
        prev.every((e, i) => e.uri === uris[i])
      ) {
        return prev;
      }

      const usedIds = new Set<string>();
      const next: MediaEntry[] = uris.map((uri, i) => {
        const reuse = prev[i];
        if (reuse && reuse.uri === uri && !usedIds.has(reuse.id)) {
          usedIds.add(reuse.id);
          return reuse;
        }
        const byUri = prev.find((e) => e.uri === uri && !usedIds.has(e.id));
        if (byUri) {
          usedIds.add(byUri.id);
          return byUri;
        }
        const id = `media-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
        usedIds.add(id);
        return { id, uri };
      });
      return next;
    });
  }, [uris]);

  const emitChange = useCallback((next: MediaEntry[]) => {
    setEntries(next);
    entriesRef.current = next;
    onChangeRef.current(next.map((e) => e.uri));
  }, []);

  const resetDragVisuals = useCallback(() => {
    draggingIdRef.current = null;
    dragFromIndexRef.current = -1;
    hoverIndexRef.current = -1;
    dragTranslateX.setValue(0);
    dragTranslateY.setValue(0);
    setDraggingId(null);
    setHoverIndex(null);
    onDraggingChangeRef.current?.(false);
  }, [dragTranslateX, dragTranslateY]);

  const activateDrag = useCallback(
    (itemId: string) => {
      const index = entriesRef.current.findIndex((e) => e.id === itemId);
      if (index < 0) return;
      draggingIdRef.current = itemId;
      dragFromIndexRef.current = index;
      hoverIndexRef.current = index;
      dragTranslateX.setValue(0);
      dragTranslateY.setValue(0);
      setDraggingId(itemId);
      setHoverIndex(index);
      onDraggingChangeRef.current?.(true);
    },
    [dragTranslateX, dragTranslateY]
  );

  const updateDragPosition = useCallback(
    (gestureDx: number, gestureDy: number) => {
      const from = dragFromIndexRef.current;
      if (from < 0 || draggingIdRef.current == null) return;

      dragTranslateX.setValue(gestureDx);
      dragTranslateY.setValue(gestureDy);

      const strideX = cellStrideX.current || 1;
      const strideY = cellStrideY.current || 1;
      const fromCol = from % COLS;
      const fromRow = Math.floor(from / COLS);
      const maxIndex = entriesRef.current.length - 1;
      const maxRow = Math.floor(maxIndex / COLS);

      const col = Math.max(0, Math.min(COLS - 1, fromCol + Math.round(gestureDx / strideX)));
      const row = Math.max(0, Math.min(maxRow, fromRow + Math.round(gestureDy / strideY)));
      const target = Math.max(0, Math.min(maxIndex, row * COLS + col));

      if (target !== hoverIndexRef.current) {
        hoverIndexRef.current = target;
        setHoverIndex(target);
      }
    },
    [dragTranslateX, dragTranslateY]
  );

  const commitDrag = useCallback(() => {
    const from = dragFromIndexRef.current;
    const to = hoverIndexRef.current;
    const wasActive = draggingIdRef.current != null;

    if (wasActive && from >= 0 && to >= 0 && from !== to) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const next = reorder(entriesRef.current, from, to);
      emitChange(next);
    }

    resetDragVisuals();
  }, [emitChange, resetDragVisuals]);

  const activateDragRef = useRef(activateDrag);
  const updateDragPositionRef = useRef(updateDragPosition);
  const commitDragRef = useRef(commitDrag);
  const resetDragVisualsRef = useRef(resetDragVisuals);
  activateDragRef.current = activateDrag;
  updateDragPositionRef.current = updateDragPosition;
  commitDragRef.current = commitDrag;
  resetDragVisualsRef.current = resetDragVisuals;

  const getPanResponder = useCallback((itemId: string) => {
    const existing = panByIdRef.current[itemId];
    if (existing) return existing;

    const pan = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        activateDragRef.current(itemId);
      },
      onPanResponderMove: (
        _: GestureResponderEvent,
        gesture: PanResponderGestureState
      ) => {
        if (draggingIdRef.current !== itemId) return;
        updateDragPositionRef.current(gesture.dx, gesture.dy);
      },
      onPanResponderRelease: () => {
        if (draggingIdRef.current === itemId) {
          commitDragRef.current();
        }
      },
      onPanResponderTerminate: () => {
        if (draggingIdRef.current === itemId) {
          commitDragRef.current();
        } else {
          resetDragVisualsRef.current();
        }
      },
    });

    panByIdRef.current[itemId] = pan;
    return pan;
  }, []);

  useEffect(() => {
    const ids = new Set(entries.map((e) => e.id));
    for (const id of Object.keys(panByIdRef.current)) {
      if (!ids.has(id)) {
        delete panByIdRef.current[id];
      }
    }
  }, [entries]);

  const onCellLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0) cellStrideX.current = width + GAP;
    if (height > 0) cellStrideY.current = height + GAP;
  }, []);

  const removeAt = (id: string) => {
    if (draggingIdRef.current != null) return;
    emitChange(entriesRef.current.filter((e) => e.id !== id));
  };

  const isDragging = draggingId != null;

  return (
    <View style={styles.grid}>
      {entries.map((entry, index) => {
        const isCover = index === 0;
        const isActive = draggingId === entry.id;
        const isHoverTarget =
          isDragging && !isActive && hoverIndex === index;
        const panHandlers = getPanResponder(entry.id).panHandlers;

        return (
          <Animated.View
            key={entry.id}
            onLayout={isActive || !isDragging ? onCellLayout : undefined}
            style={[
              styles.slot,
              isCover && styles.slotCover,
              isHoverTarget && styles.slotHover,
              isActive && styles.slotActive,
              isActive
                ? {
                    transform: [
                      { translateX: dragTranslateX },
                      { translateY: dragTranslateY },
                    ],
                    zIndex: 20,
                    elevation: 8,
                  }
                : null,
            ]}
            pointerEvents={isDragging && !isActive ? 'none' : 'auto'}
          >
            <Image source={{ uri: entry.uri }} style={styles.image} contentFit="cover" />

            {videoIndex != null && index === videoIndex ? (
              <View style={styles.playOverlay}>
                <Ionicons name="play" size={18} color={colors.white} />
              </View>
            ) : null}

            {isCover ? (
              <View style={styles.coverBadge} pointerEvents="none">
                <Text style={styles.coverBadgeText}>Cover</Text>
              </View>
            ) : null}

            <View
              {...panHandlers}
              style={styles.dragHandle}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Hold and drag to reorder"
            >
              <Ionicons name="reorder-three" size={16} color={colors.white} />
            </View>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeAt(entry.id)}
              hitSlop={6}
              disabled={isDragging}
            >
              <Ionicons name="close" size={12} color={colors.white} />
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {uris.length < maxItems && onAdd ? (
        <TouchableOpacity
          style={styles.addSlot}
          onPress={onAdd}
          activeOpacity={0.85}
          disabled={isDragging}
        >
          <Ionicons name="add" size={28} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  slot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.button,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotCover: {
    borderColor: colors.primary,
  },
  slotHover: {
    borderColor: colors.primaryLight,
    opacity: 0.85,
  },
  slotActive: {
    borderColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  image: { width: '100%', height: '100%' },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  dragHandle: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
