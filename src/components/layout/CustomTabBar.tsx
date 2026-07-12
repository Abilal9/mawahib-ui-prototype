import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { useCreateMenu } from '../../context/CreateMenuContext';

const TAB_ICONS = {
  HomeTab: 'home',
  SearchTab: 'search',
  CreateTab: 'add',
  MessagesTab: 'chatbubble',
  JobsTab: 'briefcase',
} as const;

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isOpen: isCreateMenuOpen, toggle: toggleCreateMenu, close: closeCreateMenu } =
    useCreateMenu();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.shadow} />
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isHome = route.name === 'HomeTab';
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

          const iconName = TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? 'home';

          if (isHome) {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                style={styles.homeTab}
                activeOpacity={0.85}
              >
                <View style={styles.homeCutout} />
                <View style={[styles.homeButton, isFocused && styles.homeButtonActive]}>
                  <Ionicons
                    name="home"
                    size={24}
                    color={isFocused ? colors.white : colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            );
          }

          if (isCreate) {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isCreateMenuOpen ? { selected: true } : {}}
                accessibilityLabel="Create"
                onPress={onPress}
                style={styles.createTab}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.createButton,
                    isCreateMenuOpen && styles.createButtonActive,
                  ]}
                >
                  <Ionicons
                    name={isCreateMenuOpen ? 'close' : 'add'}
                    size={26}
                    color={isCreateMenuOpen ? colors.white : colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  (iconName === 'chatbubble'
                    ? isFocused
                      ? 'chatbubble'
                      : 'chatbubble-outline'
                    : iconName === 'briefcase'
                      ? isFocused
                        ? 'briefcase'
                        : 'briefcase-outline'
                      : iconName === 'search'
                        ? isFocused
                          ? 'search'
                          : 'search-outline'
                        : 'home-outline') as keyof typeof Ionicons.glyphMap
                }
                size={24}
                color={isFocused ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 12 },
    }),
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    height: 60,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTab: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  createButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  homeTab: {
    width: 104,
    height: 60,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  homeCutout: {
    position: 'absolute',
    top: 0,
    width: 104,
    height: 60,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  homeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  homeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
});
