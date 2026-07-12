import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { getServiceById } from '../../data/mock/services';
import { ScreenProps } from '../../navigation/types';

export default function ServiceDetailScreen({ route, navigation }: ScreenProps<'ServiceDetail'>) {
  const service = getServiceById(route.params.serviceId);

  if (!service) {
    return (
      <ScreenContainer>
        <Text>Service not found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: service.images[0] }} style={styles.heroImage} contentFit="cover" />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.category}>{service.category}</Text>
          <Text style={styles.title}>{service.title}</Text>

          <TouchableOpacity
            style={styles.providerRow}
            onPress={() => navigation.navigate('UserProfile', { userId: service.provider.id })}
            activeOpacity={0.8}
          >
            <Image source={toImageSource(service.provider.avatar)} style={styles.providerAvatar} contentFit="cover" />
            <View>
              <Text style={styles.providerName}>{service.provider.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={styles.rating}>{service.rating} ({service.reviewCount} reviews)</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <View style={styles.metaCards}>
            <View style={styles.metaCard}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
              <Text style={styles.metaValue}>{service.currency} {service.price.toLocaleString()}</Text>
              <Text style={styles.metaLabel}>Price</Text>
            </View>
            <View style={styles.metaCard}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.metaValue}>{service.duration}</Text>
              <Text style={styles.metaLabel}>Duration</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>About this service</Text>
          <Text style={styles.description}>{service.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={`Book Now · ${service.currency} ${service.price.toLocaleString()}`}
          onPress={() => navigation.navigate('ConfirmPayment', { serviceId: service.id, amount: service.price })}
          fullWidth
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  imageContainer: { height: 240, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute', top: spacing.xl, left: spacing.screen,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: spacing.screen },
  category: { ...typography.caption, color: colors.primary, marginBottom: spacing.xs },
  title: { ...typography.h1, color: colors.text, fontSize: 24, marginBottom: spacing.lg },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  providerAvatar: { width: 44, height: 44, borderRadius: radius.avatar },
  providerName: { ...typography.label, color: colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rating: { ...typography.caption, color: colors.textSecondary },
  metaCards: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  metaCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.lg, alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderLight,
  },
  metaValue: { ...typography.label, color: colors.text, marginTop: spacing.sm },
  metaLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  description: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  footer: {
    padding: spacing.screen, borderTopWidth: 1,
    borderTopColor: colors.borderLight, backgroundColor: colors.white,
  },
});
