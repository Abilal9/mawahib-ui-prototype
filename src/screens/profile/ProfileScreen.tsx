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
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { currentUser } from '../../data/mock/users';
import { posts } from '../../data/mock/posts';
import { services } from '../../data/mock/services';
import { TabScreenProps } from '../../navigation/types';

const TABS = ['Posts', 'Portfolio', 'Services', 'About'] as const;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM = (SCREEN_WIDTH - spacing.screen * 2 - spacing.sm * 2) / 3;

export default function ProfileScreen({ navigation }: TabScreenProps<'ProfileTab'>) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Posts');
  const user = currentUser;

  const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: user.coverImage }}
            style={styles.cover}
            contentFit="cover"
          />
          <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Image source={toImageSource(user.avatar)} style={styles.avatar} contentFit="cover" />
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            {user.isVerified && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
          </View>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
          {user.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.location}>{user.location}</Text>
            </View>
          )}

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCount(user.posts)}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCount(user.followers)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCount(user.following)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'Posts' && (
          <View style={styles.grid}>
            {posts.filter((p) => p.author.id === user.id).concat(posts).slice(0, 6).map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.gridItem}
                onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
              >
                <Image source={{ uri: post.images[0] }} style={styles.gridImage} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'Portfolio' && (
          <View style={styles.grid}>
            {posts.slice(0, 6).map((post) => (
              <TouchableOpacity key={post.id} style={styles.gridItem}>
                <Image source={{ uri: post.images[0] }} style={styles.gridImage} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'Services' && (
          <View style={styles.servicesList}>
            {services.filter((s) => s.provider.id === user.id).map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
                activeOpacity={0.8}
              >
                <Image source={{ uri: service.images[0] }} style={styles.serviceImage} contentFit="cover" />
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.servicePrice}>{service.currency} {service.price.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'About' && (
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>Skills</Text>
            <View style={styles.skills}>
              {user.skills?.map((skill) => (
                <View key={skill} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  coverContainer: { height: 160, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  settingsButton: {
    position: 'absolute', top: spacing.lg, right: spacing.screen,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { paddingHorizontal: spacing.screen, marginTop: -40 },
  avatar: {
    width: 80, height: 80, borderRadius: radius.avatar,
    borderWidth: 3, borderColor: colors.white,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  name: { ...typography.h2, color: colors.text },
  username: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  bio: { ...typography.body, color: colors.text, marginTop: spacing.md, lineHeight: 22 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  location: { ...typography.bodySmall, color: colors.textSecondary },
  stats: { flexDirection: 'row', marginTop: spacing.xl, gap: spacing.xxl },
  stat: { alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.lg },
  editButton: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.button,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  editButtonText: { ...typography.label, color: colors.white },
  shareButton: {
    width: 44, height: 44, borderRadius: radius.button,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontFamily: typography.label.fontFamily },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.screen, gap: spacing.sm },
  gridItem: { width: GRID_ITEM, height: GRID_ITEM, borderRadius: radius.button, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  servicesList: { padding: spacing.screen, gap: spacing.md },
  serviceCard: {
    flexDirection: 'row', backgroundColor: colors.white,
    borderRadius: radius.card, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.borderLight,
  },
  serviceImage: { width: 80, height: 80 },
  serviceInfo: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  serviceTitle: { ...typography.label, color: colors.text },
  servicePrice: { ...typography.bodySmall, color: colors.primary, marginTop: spacing.xs },
  aboutSection: { padding: spacing.screen },
  aboutTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillTag: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: colors.primary + '12',
  },
  skillText: { ...typography.bodySmall, color: colors.primary },
});
