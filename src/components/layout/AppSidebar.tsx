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
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SidebarCalendarPreview from './SidebarCalendarPreview';
import { colors, spacing, radius, typography } from '../../theme';
import { toImageSource } from '../../utils/image';
import { useSidebar } from '../../context/SidebarContext';
import { useMyProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/types';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.82;

const PRIMARY_LINKS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: 'Profile' | 'Connections';
}[] = [
  { icon: 'person-outline', label: 'My Profile', route: 'Profile' },
  { icon: 'people-outline', label: 'My Connections', route: 'Connections' },
];

const FOOTER_LINKS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: 'Documentation' | 'Settings' | 'ChangeLanguage';
  action?: 'logout';
  danger?: boolean;
  trailing?: string;
}[] = [
  { icon: 'book-outline', label: 'Documentation', route: 'Documentation' },
  { icon: 'settings-outline', label: 'Settings', route: 'Settings' },
  {
    icon: 'globe-outline',
    label: 'Change Language',
    route: 'ChangeLanguage',
    trailing: 'العربية',
  },
  { icon: 'log-out-outline', label: 'Logout', action: 'logout', danger: true },
];

export default function AppSidebar() {
  const { isOpen, close } = useSidebar();
  const { user, resetToSeed } = useMyProfile();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen, slideAnim, fadeAnim]);

  const handleNavigate = (
    route:
      | 'Profile'
      | 'Connections'
      | 'Reviews'
      | 'Calendar'
      | 'Premium'
      | 'Documentation'
      | 'Settings'
      | 'ChangeLanguage'
  ) => {
    close();
    setTimeout(() => {
      if (route === 'Reviews') {
        navigation.navigate('Reviews', { userId: user.id });
      } else {
        navigation.navigate(route);
      }
    }, 200);
  };

  const handleLogout = () => {
    close();
    signOut();
    resetToSeed();
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });
    }, 200);
  };

  const rating = user.rating ?? 5;
  const reviews = user.reviewCount ?? 106;

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={close}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <View
            style={[
              styles.content,
              {
                paddingTop: insets.top + spacing.lg,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
          >
            {/* Profile header — Figma: avatar + name/verified + role + rating */}
            <TouchableOpacity
              style={styles.profileHeader}
              onPress={() => handleNavigate('Profile')}
              activeOpacity={0.85}
            >
              <Image
                source={toImageSource(user.avatar)}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {user.name}
                  </Text>
                  {user.isVerified ? (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={10} color={colors.white} />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.role} numberOfLines={1}>
                  {user.title ?? 'Event Photographer'}
                </Text>
                <TouchableOpacity
                  style={styles.ratingRow}
                  onPress={() => handleNavigate('Reviews')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="star" size={14} color="#F5A623" />
                  <Text style={styles.ratingValue}>
                    {rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)}
                  </Text>
                  <Text style={styles.reviewsLink}>{reviews} reviews</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Primary nav */}
            <View style={styles.primaryLinks}>
              {PRIMARY_LINKS.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.primaryLink}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={20} color={colors.textTertiary} />
                  <Text style={styles.primaryLinkLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.footerSpacer} />

            {/* Calendar + Premium sit above Documentation */}
            <View style={styles.bottomBlock}>
              <SidebarCalendarPreview onPress={() => handleNavigate('Calendar')} />

              <View style={styles.premiumCard}>
                <View style={styles.premiumTop}>
                  <View style={styles.crownWrap}>
                    <Ionicons name="diamond-outline" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.premiumTitle}>Get Premium Features</Text>
                </View>
                <TouchableOpacity
                  style={styles.upgradeBtn}
                  onPress={() => handleNavigate('Premium')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.upgradeText}>Upgrade Plan</Text>
                </TouchableOpacity>
              </View>

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
                    <Ionicons
                      name={link.icon}
                      size={18}
                      color={link.danger ? colors.error : colors.textTertiary}
                    />
                    <Text
                      style={[styles.footerLinkText, link.danger && styles.footerLinkDanger]}
                    >
                      {link.label}
                    </Text>
                    {link.trailing ? (
                      <View style={styles.trailing}>
                        <Text style={styles.trailingText}>{link.trailing}</Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
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
    backgroundColor: 'rgba(14, 36, 58, 0.4)',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  role: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  reviewsLink: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  primaryLinks: {
    gap: spacing.sm,
    marginBottom: 0,
  },
  primaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 4,
  },
  primaryLinkLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  bottomBlock: {
    gap: spacing.md,
  },
  premiumCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: 0,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  premiumTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  crownWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: {
    ...typography.label,
    color: colors.text,
    flex: 1,
    fontSize: 13,
  },
  upgradeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeText: {
    ...typography.button,
    color: colors.white,
    fontSize: 14,
  },
  footerSpacer: {
    flex: 1,
    minHeight: spacing.sm,
  },
  footerLinks: {
    gap: 2,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  footerLinkText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  footerLinkDanger: {
    color: colors.error,
    fontWeight: '500',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trailingText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
});
