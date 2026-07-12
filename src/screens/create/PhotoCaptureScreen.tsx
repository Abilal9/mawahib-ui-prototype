import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';

export default function PhotoCaptureScreen({ navigation }: ScreenProps<'PhotoCapture'>) {
  return (
    <ScreenContainer padded={false} backgroundColor="#000">
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="flash-off" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.viewfinder}>
        <Ionicons name="camera-outline" size={64} color={colors.white + '40'} />
        <Text style={styles.placeholderText}>Camera Preview</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton}>
          <View style={styles.galleryThumb} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={() => navigation.navigate('PhotoEdit', {})}
          activeOpacity={0.8}
        >
          <View style={styles.captureInner} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.flipButton}>
          <Ionicons name="camera-reverse-outline" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.lg,
  },
  viewfinder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
    borderRadius: 12,
  },
  placeholderText: { ...typography.body, color: colors.white + '60', marginTop: spacing.md },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  galleryButton: { width: 44, height: 44 },
  galleryThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#333', borderWidth: 2, borderColor: colors.white },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.white },
  flipButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
