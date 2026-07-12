import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { talents, recentSearches } from '../../data/mock/talents';
import { TabScreenProps } from '../../navigation/types';

export default function SearchScreen({ navigation }: TabScreenProps<'SearchTab'>) {
  const [query, setQuery] = useState('');
  const [searches, setSearches] = useState(recentSearches);

  const filtered = query
    ? talents.filter(
        (t) =>
          t.user.name.toLowerCase().includes(query.toLowerCase()) ||
          t.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
      )
    : talents;

  const removeSearch = (term: string) => setSearches(searches.filter((s) => s !== term));

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchField}
            placeholder="Search talents, skills..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!query && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          {searches.map((term) => (
            <TouchableOpacity
              key={term}
              style={styles.recentItem}
              onPress={() => setQuery(term)}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.recentText}>{term}</Text>
              <TouchableOpacity onPress={() => removeSearch(term)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>{query ? 'Results' : 'Top Talents'}</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.talentCard}
            onPress={() => navigation.navigate('Portfolio', { userId: item.user.id })}
            activeOpacity={0.8}
          >
            <Image source={toImageSource(item.user.avatar)} style={styles.talentAvatar} contentFit="cover" />
            <Text style={styles.talentName} numberOfLines={1}>{item.user.name}</Text>
            <Text style={styles.talentCategory}>{item.category}</Text>
            <View style={styles.talentMeta}>
              <Ionicons name="star" size={12} color={colors.warning} />
              <Text style={styles.talentRating}>{item.rating}</Text>
              <Text style={styles.talentRate}>· AED {item.hourlyRate}/hr</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchHeader: { paddingHorizontal: spacing.screen, paddingVertical: spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchField: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm },
  recentSection: { paddingHorizontal: spacing.screen, marginBottom: spacing.lg },
  sectionTitle: { ...typography.label, color: colors.text, marginBottom: spacing.md, paddingHorizontal: spacing.screen },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  recentText: { ...typography.body, color: colors.text, flex: 1 },
  grid: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl },
  gridRow: { gap: spacing.md, marginBottom: spacing.md },
  talentCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  talentAvatar: { width: 64, height: 64, borderRadius: radius.avatar, marginBottom: spacing.sm },
  talentName: { ...typography.label, color: colors.text, fontSize: 13 },
  talentCategory: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  talentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  talentRating: { ...typography.caption, color: colors.text },
  talentRate: { ...typography.caption, color: colors.textSecondary },
});
