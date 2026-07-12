import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import { services } from '../../data/mock/services';
import { ScreenProps } from '../../navigation/types';

export default function ServicesScreen({ navigation }: ScreenProps<'Services'>) {
  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services</Text>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id })}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.images[0] }} style={styles.image} contentFit="cover" />
            <View style={styles.info}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
              <View style={styles.footer}>
                <Text style={styles.price}>{item.currency} {item.price.toLocaleString()}</Text>
                <View style={styles.rating}>
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text style={styles.ratingText}>{item.rating} ({item.reviewCount})</Text>
                </View>
              </View>
            </View>
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
  list: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.white, borderRadius: radius.card,
    marginBottom: spacing.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.borderLight,
  },
  image: { width: '100%', height: 140 },
  info: { padding: spacing.lg },
  category: { ...typography.caption, color: colors.primary, marginBottom: spacing.xs },
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  description: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  price: { ...typography.label, color: colors.primary },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { ...typography.caption, color: colors.textSecondary },
});
