import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme';
import { useCreateMenu } from '../../context/CreateMenuContext';
import { useMessagingUnread } from '../../context/MessagingUnreadContext';

type TabIconName = keyof typeof Ionicons.glyphMap;

const ICON_SIZE = 24;
const CREATE_ICON_SIZE = 28;

const TAB_ICONS: Record<
  string,
  { active: TabIconName; inactive: TabIconName }
> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  SearchTab: { active: 'search', inactive: 'search-outline' },
  MessagesTab: { active: 'chatbubble', inactive: 'chatbubble-outline' },
  JobsTab: { active: 'briefcase', inactive: 'briefcase-outline' },
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isOpen: isCreateMenuOpen, toggle: toggleCreateMenu, close: closeCreateMenu } =
    useCreateMenu();
  const { unreadCount: messagesUnread } = useMessagingUnread();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: bottomPad }]}
    >
      <View style={styles.glassShell}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 55 : 80}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sheen} pointerEvents="none" />
        <View style={styles.glassBorder} pointerEvents="none" />

        <View style={styles.bar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const isCreate = route.name === 'CreateTab';

            const onPress = () => {
              if (isCreate) {
                toggleCreateMenu();
                return;
              }

              if (isCreateMenuOpen) {
                closeCreateMenu();
              }

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            if (isCreate) {
              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isCreateMenuOpen ? { selected: true } : {}}
                  accessibilityLabel="Create"
                  onPress={onPress}
                  style={styles.tab}
                  activeOpacity={0.85}
                >
                  {isCreateMenuOpen ? (
                    <View style={styles.highlight} pointerEvents="none" />
                  ) : null}
                  <Ionicons
                    name={isCreateMenuOpen ? 'close' : 'add'}
                    size={CREATE_ICON_SIZE}
                    color={isCreateMenuOpen ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            }

            const icons = TAB_ICONS[route.name] ?? {
              active: 'ellipse' as TabIconName,
              inactive: 'ellipse-outline' as TabIconName,
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : { selected: false }}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                style={styles.tab}
                activeOpacity={0.7}
              >
                {isFocused ? <View style={styles.highlight} pointerEvents="none" /> : null}
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={isFocused ? icons.active : icons.inactive}
                    size={ICON_SIZE}
                    color={isFocused ? colors.primary : colors.textSecondary}
                  />
                  {route.name === 'MessagesTab' && messagesUnread > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {messagesUnread > 9 ? '9+' : String(messagesUnread)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
  },
  glassShell: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      ios: 'rgba(255,255,255,0.28)',
      default: 'rgba(255,255,255,0.72)',
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#0E243A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
  },
  sheen: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: 'rgba(255,255,255,0.65)',
    backgroundColor: 'transparent',
  },
  glassBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 60,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'transparent',
  },
  tab: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: ICON_SIZE + 8,
    height: ICON_SIZE + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  /** Behind the icon only — same slot size active/inactive */
  highlight: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(230, 0, 118, 0.14)',
  },
});
