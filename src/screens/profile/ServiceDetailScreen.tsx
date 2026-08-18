import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import CurrencyIcon from '../../components/ui/CurrencyIcon';
import { toImageSource } from '../../utils/image';
import { stripCurrencyGlyphs } from '../../utils/currency';
import { colors, spacing, radius, typography } from '../../theme';
import { catalogService } from '../../services';
import { useMyProfile } from '../../context/ProfileContext';
import { openUserProfile } from '../../utils/openUserProfile';
import { ScreenProps } from '../../navigation/types';
import { useVisitorProfessionalProfile } from '../../hooks/useVisitorProfessionalProfile';
import { useVisitorUser } from '../../hooks/useVisitorUser';

/**
 * Service detail with three data paths:
 * - Own profile service (`userId` omitted): edit/delete via ProfileContext.
 * - Visitor profile service (`userId` set): Apply → RequestService wizard (pending job).
 * - Catalog fallback: explore listing with Book Now → ConfirmPayment.
 *
 * Currency icons use the service owner's location (visitor/catalog) or the signed-in user (own).
 */
export default function ServiceDetailScreen({ route, navigation }: ScreenProps<'ServiceDetail'>) {
  const catalogListing = catalogService.getServiceById(route.params.serviceId);
  const ownerUserId = route.params.userId;
  const isVisitorView = Boolean(ownerUserId);
  const { user: me, content, removeService } = useMyProfile();
  const visitorUser = useVisitorUser(isVisitorView ? ownerUserId : undefined);
  const owner = visitorUser.user ?? undefined;
  const visitor = useVisitorProfessionalProfile(
    isVisitorView ? ownerUserId : undefined,
  );

  // Prefer profile-shaped services (packages/addons); fall back to catalog below if missing.
  const profileOffering = isVisitorView
    ? visitor.services.find((s) => s.id === route.params.serviceId)
    : content.services.find((s) => s.id === route.params.serviceId);

  const currencyLocation = isVisitorView ? owner?.location : me.location;
  const objectCurrency =
    (isVisitorView ? owner?.defaultCurrency : me.defaultCurrency) === 'AED' ||
    (isVisitorView ? owner?.defaultCurrency : me.defaultCurrency) === 'SAR'
      ? ((isVisitorView ? owner?.defaultCurrency : me.defaultCurrency) as
          | 'SAR'
          | 'AED')
      : catalogListing?.currency === 'AED' || catalogListing?.currency === 'SAR'
        ? catalogListing.currency
        : null;

  const [activePackage, setActivePackage] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isVisitorView && visitor.loading) {
    return (
      <ScreenContainer>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Loading…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!catalogListing && !profileOffering) {
    return (
      <ScreenContainer>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Service not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.missingBack}>
            <Text style={styles.missingBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const pkg = profileOffering?.packages[activePackage];

  if (profileOffering) {
    return (
      <ScreenContainer padded={false}>
        <StatusBar style="dark" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[2]}
          contentContainerStyle={{
            paddingBottom: isVisitorView ? spacing.xxxl + 72 : spacing.xxxl,
          }}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: profileOffering.images[0] }}
              style={styles.heroImage}
              contentFit="cover"
            />
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{profileOffering.title}</Text>
              {!isVisitorView ? (
                <View style={styles.ownerActions}>
                  <TouchableOpacity
                    hitSlop={8}
                    onPress={() =>
                      navigation.navigate('AddProfileService', {
                        serviceId: profileOffering.id,
                      })
                    }
                  >
                    <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity hitSlop={8} onPress={() => setDeleteOpen(true)}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
            <Text style={styles.description}>{profileOffering.description}</Text>
          </View>

          <View style={styles.stickyTabsShell}>
            <View style={styles.packageTabs}>
              {profileOffering.packages.map((item, index) => (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.packageTab, activePackage === index && styles.packageTabActive]}
                  onPress={() => setActivePackage(index)}
                >
                  <Text
                    style={[
                      styles.packageTabText,
                      activePackage === index && styles.packageTabTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.content}>
            {pkg ? (
              <View style={styles.packageCard}>
                <View style={styles.packageCardHeader}>
                  <Text style={styles.packageCardName}>{pkg.name}</Text>
                  <View style={styles.packageCardPriceRow}>
                    <CurrencyIcon
                      size={18}
                      color={colors.primary}
                      currency={objectCurrency}
                      location={objectCurrency ? null : currencyLocation}
                    />
                    <Text style={styles.packageCardPrice}>
                      {stripCurrencyGlyphs(pkg.priceLabel)}
                    </Text>
                  </View>
                </View>
                <View style={styles.deliveryRow}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={styles.delivery}>{pkg.delivery}</Text>
                </View>
                {pkg.includes.map((line) => (
                  <View key={line} style={styles.includeRow}>
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                    <Text style={styles.includeText}>{line}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {profileOffering.addons?.length ? (
              <>
                <Text style={styles.sectionTitle}>Add-ons:</Text>
                {profileOffering.addons.map((addon) => (
                  <View key={addon.id} style={styles.addonRow}>
                    <Text style={styles.addonTitle}>{addon.title}</Text>
                    <View style={styles.addonPriceRow}>
                      <CurrencyIcon
                        size={14}
                        color={colors.primary}
                        currency={objectCurrency}
                        location={objectCurrency ? null : currencyLocation}
                      />
                      <Text style={styles.addonPrice}>
                        {stripCurrencyGlyphs(addon.priceLabel)}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            ) : null}
          </View>
        </ScrollView>

        {isVisitorView ? (
          <View style={styles.footer}>
            <Button
              title="Apply"
              fullWidth
              onPress={() =>
                navigation.navigate('RequestService', {
                  userId: ownerUserId!,
                  serviceId: profileOffering.id,
                  packageName: pkg?.name,
                })
              }
            />
          </View>
        ) : null}

        <Modal
          visible={deleteOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setDeleteOpen(false)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Delete service?</Text>
              <Text style={styles.modalBody}>
                Are you sure you want to delete “{profileOffering.title}”? This can’t be undone.
              </Text>
              <TouchableOpacity
                style={styles.modalDangerBtn}
                onPress={() => {
                  setDeleteOpen(false);
                  void removeService(profileOffering.id).then(() =>
                    navigation.goBack(),
                  );
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalDangerText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeleteOpen(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </ScreenContainer>
    );
  }

  const service = catalogListing!;
  const providerLocation = service.provider.location;

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
            onPress={() => openUserProfile(navigation, service.provider.id, me.id)}
            activeOpacity={0.8}
          >
            <Image source={toImageSource(service.provider.avatar)} style={styles.providerAvatar} contentFit="cover" />
            <View>
              <Text style={styles.providerName}>{service.provider.name}</Text>
              <TouchableOpacity
                style={styles.ratingRow}
                onPress={() =>
                  navigation.navigate('Reviews', { userId: service.provider.id })
                }
                activeOpacity={0.8}
              >
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={styles.rating}>
                  {service.rating} ({service.reviewCount} reviews)
                </Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <View style={styles.metaCards}>
            <View style={styles.metaCard}>
              <View style={styles.metaPriceRow}>
                <CurrencyIcon size={18} color={colors.primary} currency={objectCurrency} location={objectCurrency ? null : providerLocation} />
                <Text style={styles.metaValueInline}>{service.price.toLocaleString()}</Text>
              </View>
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
          title="Book Now"
          onPress={() =>
            navigation.navigate('ConfirmPayment', {
              serviceId: service.id,
              amount: service.price,
            })
          }
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  ownerActions: { flexDirection: 'row', gap: spacing.md, paddingTop: 4 },
  stickyTabsShell: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.sm,
  },
  packageTabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  packageTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  packageTabActive: {
    backgroundColor: '#FCE7F3',
  },
  packageTabText: { ...typography.caption, color: colors.text, fontWeight: '500' },
  packageTabTextActive: { color: colors.primary, fontWeight: '600' },
  packageCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  packageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  packageCardName: { ...typography.h3, color: colors.primary },
  packageCardPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  packageCardPrice: { ...typography.h3, color: colors.primary },
  addonPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  delivery: { ...typography.caption, color: colors.textSecondary },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  includeText: { ...typography.bodySmall, color: colors.text },
  addonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  addonTitle: { ...typography.bodySmall, color: colors.text, flex: 1 },
  addonPrice: { ...typography.label, color: colors.primary },
  category: { ...typography.caption, color: colors.primary, marginBottom: spacing.xs },
  title: { ...typography.h1, color: colors.text, fontSize: 24, flex: 1 },
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
  metaPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  metaValueInline: { ...typography.label, color: colors.text },
  metaValue: { ...typography.label, color: colors.text, marginTop: spacing.sm },
  metaLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md, marginTop: spacing.md },
  description: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  footer: {
    padding: spacing.screen, borderTopWidth: 1,
    borderTopColor: colors.borderLight, backgroundColor: colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
  },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  modalBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalDangerBtn: {
    backgroundColor: colors.error,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalDangerText: { ...typography.button, color: colors.white },
  modalCancelBtn: {
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: { ...typography.button, color: colors.text },
  missingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  missingText: { ...typography.body, color: colors.text, textAlign: 'center' },
  missingBack: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  missingBackText: { ...typography.button, color: colors.white },
});
