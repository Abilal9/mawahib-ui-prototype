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
import { getUserById } from '../../data/mock/users';
import { posts } from '../../data/mock/posts';
import { services } from '../../data/mock/services';
import { talents } from '../../data/mock/talents';
import { profileAboutSections } from '../../data/mock/profileSections';
import { ScreenProps } from '../../navigation/types';

const TABS = ['About', 'Portfolio', 'Services', 'Posts'] as const;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM = (SCREEN_WIDTH - spacing.screen * 2 - spacing.sm) / 2;

export default function UserProfileScreen({ route, navigation }: ScreenProps<'UserProfile'>) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('About');
  const insets = useSafeAreaInsets();
  const user = getUserById(route.params.userId);
  const talent = talents.find((t) => t.user.id === route.params.userId);

  if (!user) {
    return (
      <ScreenContainer>
        <Text>User not found</Text>
      </ScreenContainer>
    );
  }

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
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Chat', { conversationId: 'c1' })}
            >
              <Ionicons name="chatbubble-outline" size={22} color={colors.white} />
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
            <Text style={styles.jobTitle}>
              {user.title ?? talent?.category ?? user.skills?.[0] ?? 'Creative Professional'}
            </Text>
            {user.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.location}>{user.location}</Text>
              </View>
            )}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#F5A623" />
                <Text style={styles.statValue}>{talent?.rating ?? user.rating ?? 4.8}</Text>
                <Text style={styles.statLabel}>
                  · {user.reviewCount ?? 24} reviews
                </Text>
              </View>
              {talent ? (
                <>
                  <View style={styles.statDivider} />
                  <Text style={styles.statValue}>AED {talent.hourlyRate}/hr</Text>
                </>
              ) : null}
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
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Bio</Text>
              <Text style={styles.aboutValue}>{user.bio}</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Skills</Text>
              <Text style={styles.aboutValue}>{user.skills?.join(', ')}</Text>
            </View>
            {profileAboutSections.slice(2).map((section) => (
              <View key={section.id} style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>{section.label}</Text>
                <Text style={styles.aboutValue}>{section.value}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Portfolio' && (
          <View style={styles.tabContent}>
            {portfolioItems.length === 0 ? (
              <Text style={styles.emptyText}>No portfolio items yet.</Text>
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
            {userServices.length === 0 ? (
              <Text style={styles.emptyText}>No services listed yet.</Text>
            ) : (
              userServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
                >
                  <Image source={{ uri: service.images[0] }} style={styles.serviceImage} contentFit="cover" />
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceMeta}>
                      {service.currency} {service.price.toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'Posts' && (
          <View style={styles.tabContent}>
            {userPosts.length === 0 ? (
              <Text style={styles.emptyText}>No posts yet.</Text>
            ) : (
              <View style={styles.postsGrid}>
                {userPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postItem}
                    onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                  >
                    <Image source={{ uri: post.images[0] }} style={styles.postImage} contentFit="cover" />
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
  header: { backgroundColor: colors.white, paddingBottom: spacing.lg },
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
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.white },
  profileCenter: { alignItems: 'center', paddingHorizontal: spacing.screen },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.white,
    marginBottom: spacing.md,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...typography.h2, color: colors.text },
  jobTitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  location: { ...typography.bodySmall, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.md },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  statLabel: { ...typography.bodySmall, color: colors.textSecondary },
  statDivider: { width: 1, height: 16, backgroundColor: colors.border },
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
  segmentTab: { flex: 1, paddingVertical: spacing.sm + 4, alignItems: 'center' },
  segmentTabActive: { backgroundColor: '#FFF0F7' },
  tabDivider: { width: 1, height: 24, backgroundColor: colors.border },
  segmentText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500' },
  segmentTextActive: { color: colors.primary, fontWeight: '600' },
  aboutList: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl, gap: spacing.sm },
  aboutRow: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aboutLabel: { ...typography.label, color: colors.text, marginBottom: 4 },
  aboutValue: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
  tabContent: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xxl },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  portfolioItem: { width: GRID_ITEM, height: GRID_ITEM, borderRadius: radius.card, overflow: 'hidden' },
  portfolioImage: { width: '100%', height: '100%' },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceImage: { width: 96, height: 96 },
  serviceInfo: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  serviceTitle: { ...typography.label, color: colors.text },
  serviceMeta: { ...typography.bodySmall, color: colors.primary, marginTop: 4 },
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  postItem: {
    width: (SCREEN_WIDTH - spacing.screen * 2 - spacing.sm * 2) / 3,
    height: (SCREEN_WIDTH - spacing.screen * 2 - spacing.sm * 2) / 3,
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  postImage: { width: '100%', height: '100%' },
});
