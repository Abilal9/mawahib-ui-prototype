import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import { posts } from '../../data/mock/posts';
import { ScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - spacing.screen * 2 - spacing.sm) / 2;

export default function PortfolioScreen({ navigation }: ScreenProps<'Portfolio'>) {
  const portfolioItems = posts.flatMap((p) => p.images.map((img, i) => ({ id: `${p.id}-${i}`, uri: img })));

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={portfolioItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('FullPhotoPreview', { images: [item.uri], initialIndex: 0 })}
            activeOpacity={0.9}
          >
            <Image source={{ uri: item.uri }} style={styles.image} contentFit="cover" />
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingVertical: spacing.md,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.text },
  grid: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl },
  row: { gap: spacing.sm, marginBottom: spacing.sm },
  item: { width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: radius.card, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
