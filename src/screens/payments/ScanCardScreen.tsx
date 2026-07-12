import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';

export default function ScanCardScreen({ navigation }: ScreenProps<'ScanCard'>) {
  return (
    <ScreenContainer padded={false} backgroundColor="#000">
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Card</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.scanArea}>
        <View style={styles.cardFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <Ionicons name="card-outline" size={48} color={colors.white + '30'} />
        </View>
        <Text style={styles.instruction}>Position your card within the frame</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.manualButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.manualText}>Enter card details manually</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingVertical: spacing.lg,
  },
  headerTitle: { ...typography.h3, color: colors.white },
  scanArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardFrame: {
    width: 300, height: 190, borderRadius: radius.card,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderColor: colors.primary, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderColor: colors.primary, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderColor: colors.primary, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderColor: colors.primary, borderBottomRightRadius: 8 },
  instruction: { ...typography.body, color: colors.white + '80', marginTop: spacing.xxl, textAlign: 'center' },
  footer: { padding: spacing.screen, paddingBottom: spacing.xxxl },
  manualButton: { alignItems: 'center', paddingVertical: spacing.lg },
  manualText: { ...typography.bodyMedium, color: colors.primary },
});
