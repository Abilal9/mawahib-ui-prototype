import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SidebarCalendarPreview from './SidebarCalendarPreview';
import { colors, spacing, radius, typography } from '../../theme';
import { toImageSource } from '../../utils/image';
import { currentUser } from '../../data/mock/users';
import { useSidebar } from '../../context/SidebarContext';
import { RootStackParamList } from '../../navigation/types';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.84;

const MENU_ITEMS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: 'Profile' | 'Connections';
}[] = [
  { icon: 'person-outline', label: 'My Profile', route: 'Profile' },
  { icon: 'people-outline', label: 'My Connections', route: 'Connections' },
];

const FOOTER_LINKS: {
  label: string;
  route?: 'Documentation' | 'Settings' | 'ChangeLanguage';
  action?: 'logout';
  danger?: boolean;
}[] = [
  { label: 'Documentation', route: 'Documentation' },
  { label: 'Settings', route: 'Settings' },
  { label: 'Change Language', route: 'ChangeLanguage' },
  { label: 'Log Out', action: 'logout', danger: true },
];

export default function AppSidebar() {
  const { isOpen, close } = useSidebar();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, fadeAnim]);

  const handleNavigate = (
    route:
      | 'Profile'
      | 'Connections'
      | 'Calendar'
      | 'Premium'
      | 'Documentation'
      | 'Settings'
      | 'ChangeLanguage'
  ) => {
    close();
    setTimeout(() => navigation.navigate(route), 200);
  };

  const handleLogout = () => {
    close();
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });
    }, 200);
  };

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={close}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        <Animated.View
          style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: insets.top + spacing.lg,
                paddingBottom: insets.bottom + spacing.xl,
              },
            ]}
            showsVerticalScrollIndicator={false}
            bounces
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.profileHeader}
              onPress={() => handleNavigate('Profile')}
              activeOpacity={0.85}
            >
              <Image
                source={toImageSource(currentUser.avatar)}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{currentUser.name}</Text>
                  {currentUser.isVerified && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                </View>
                <Text style={styles.role}>{currentUser.title ?? 'UI/UX Designer'}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F5A623" />
                  <Text style={styles.ratingText}>
                    {currentUser.rating ?? 4.9} · {currentUser.reviewCount ?? 47} reviews
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}

            <SidebarCalendarPreview onPress={() => handleNavigate('Calendar')} />

            <TouchableOpacity
              style={styles.premiumCard}
              onPress={() => handleNavigate('Premium')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#E60076', '#FF4DA6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumGradient}
              >
                <View style={styles.premiumIcon}>
                  <Ionicons name="diamond" size={22} color={colors.primary} />
                </View>
                <View style={styles.premiumTextWrap}>
                  <Text style={styles.premiumTitle}>Get Premium Features</Text>
                  <Text style={styles.premiumSubtitle}>
                    Unlock visibility, tools, and exclusive benefits
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.footerLinks}>
              {FOOTER_LINKS.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  style={styles.footerLink}
                  onPress={() => {
                    if (link.action === 'logout') handleLogout();
                    else if (link.route) handleNavigate(link.route);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.footerLinkText,
                      link.danger && styles.footerLinkDanger,
                    ]}
                  >
                    {link.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14, 36, 58, 0.45)',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.avatar,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  role: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  premiumCard: {
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  premiumIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTextWrap: {
    flex: 1,
  },
  premiumTitle: {
    ...typography.label,
    color: colors.white,
    marginBottom: 4,
  },
  premiumSubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  footerLinks: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  footerLink: {
    paddingVertical: spacing.sm + 2,
  },
  footerLinkText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLinkDanger: {
    color: colors.error,
    fontWeight: '500',
  },
});
