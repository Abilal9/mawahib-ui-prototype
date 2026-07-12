import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { currentUser } from '../../data/mock/users';
import { posts } from '../../data/mock/posts';
import { services } from '../../data/mock/services';
import { profileAboutSections } from '../../data/mock/profileSections';
import { ScreenProps } from '../../navigation/types';

const TABS = ['About', 'Portfolio', 'Services', 'Posts'] as const;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = spacing.sm;
const GRID_ITEM = (SCREEN_WIDTH - spacing.screen * 2 - GRID_GAP) / 2;

export default function ProfileScreen({ navigation }: ScreenProps<'Profile'>) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('About');
  const insets = useSafeAreaInsets();
  const user = currentUser;
  const userPosts = posts.filter((p) => p.author.id === user.id);
  const userServices = services.filter((s) => s.provider.id === user.id);
  const portfolioItems = userPosts.slice(0, 4);

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LinearGradient
            colors={['#E60076', '#FF4DA6', '#FFF0F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.wave}
          />
          <View style={[styles.headerBar, { paddingTop: insets.top + spacing.sm }]}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="create-outline" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileCenter}>
            <Image source={toImageSource(user.avatar)} style={styles.avatar} contentFit="cover" />
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}</Text>
              {user.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </View>
            <Text style={styles.jobTitle}>UI/UX Designer</Text>
            {user.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.location}>{user.location}</Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#F5A623" />
                <Text style={styles.statValue}>4.9</Text>
                <Text style={styles.statLabel}>· 47 reviews</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>1.2k</Text>
                <Text style={styles.statLabel}>connections</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.segmentedTabs}>
          {TABS.map((tab, index) => (
            <React.Fragment key={tab}>
              {index > 0 && <View style={styles.tabDivider} />}
              <TouchableOpacity
                style={[styles.segmentTab, activeTab === tab && styles.segmentTabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {activeTab === 'About' && (
          <View style={styles.aboutList}>
            {profileAboutSections.map((section) => (
              <TouchableOpacity key={section.id} style={styles.aboutRow} activeOpacity={0.7}>
                <View style={styles.aboutRowContent}>
                  <Text style={styles.aboutLabel}>{section.label}</Text>
                  <Text style={styles.aboutValue} numberOfLines={2}>
                    {section.value}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'Portfolio' && (
          <View style={styles.tabContent}>
            {portfolioItems.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="images-outline" size={40} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No portfolio yet</Text>
                <Text style={styles.emptyText}>
                  Showcase your best work to attract clients and opportunities.
                </Text>
                <TouchableOpacity style={styles.emptyButton} activeOpacity={0.85}>
                  <Ionicons name="add" size={18} color={colors.white} />
                  <Text style={styles.emptyButtonText}>Add Portfolio</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.portfolioGrid}>
                {portfolioItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.portfolioItem}
                    onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
                  >
                    <Image source={{ uri: item.images[0] }} style={styles.portfolioImage} contentFit="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'Services' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Services</Text>
              <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {userServices.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="briefcase-outline" size={40} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No services listed</Text>
                <Text style={styles.emptyText}>
                  Offer your skills as services and start earning on Mawahib.
                </Text>
                <TouchableOpacity style={styles.emptyButton} activeOpacity={0.85}>
                  <Ionicons name="add" size={18} color={colors.white} />
                  <Text style={styles.emptyButtonText}>Add Service</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.servicesList}>
                {userServices.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.serviceCard}
                    onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: service.images[0] }} style={styles.serviceImage} contentFit="cover" />
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceTitle}>{service.title}</Text>
                      <Text style={styles.serviceMeta}>
                        {service.currency} {service.price.toLocaleString()} · {service.duration}
                      </Text>
                      <View style={styles.serviceRating}>
                        <Ionicons name="star" size={12} color="#F5A623" />
                        <Text style={styles.serviceRatingText}>
                          {service.rating} ({service.reviewCount})
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'Posts' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Posts</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('PostCreate')}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {userPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="grid-outline" size={40} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptyText}>
                  Share your work and updates with the Mawahib community.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('PostCreate')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={18} color={colors.white} />
                  <Text style={styles.emptyButtonText}>Create Post</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.postsGrid}>
                {userPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postItem}
                    onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                  >
                    <Image source={{ uri: post.images[0] }} style={styles.postImage} contentFit="cover" />
                    {post.images.length > 1 && (
                      <View style={styles.multiBadge}>
                        <Ionicons name="copy-outline" size={12} color={colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    paddingBottom: spacing.lg,
  },
  wave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
  },
  profileCenter: {
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.white,
    marginBottom: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    ...typography.h2,
    color: colors.text,
  },
  jobTitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  location: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  segmentedTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screen,
    marginVertical: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segmentTab: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  segmentTabActive: {
    backgroundColor: '#FFF0F7',
  },
  tabDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  segmentText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  aboutList: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aboutRowContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  aboutLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: 4,
  },
  aboutValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tabContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.button,
  },
  emptyButtonText: {
    ...typography.button,
    color: colors.white,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  portfolioItem: {
    width: GRID_ITEM,
    height: GRID_ITEM,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  servicesList: {
    gap: spacing.md,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceImage: {
    width: 96,
    height: 96,
  },
  serviceInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  serviceTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: 4,
  },
  serviceMeta: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: 4,
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceRatingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  postItem: {
    width: (SCREEN_WIDTH - spacing.screen * 2 - GRID_GAP * 2) / 3,
    height: (SCREEN_WIDTH - spacing.screen * 2 - GRID_GAP * 2) / 3,
    borderRadius: radius.button,
    overflow: 'hidden',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  multiBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 2,
  },
});
