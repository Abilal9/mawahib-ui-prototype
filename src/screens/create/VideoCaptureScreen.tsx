import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, typography } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

/** Unregistered orphan — kept for later story/video capture wiring. */
export default function VideoCaptureScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const [recording, setRecording] = useState(false);

  return (
    <ScreenContainer padded={false} backgroundColor="#000">
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.timer}>{recording ? '00:12' : '00:00'}</Text>
        <TouchableOpacity>
          <Ionicons name="musical-notes-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.viewfinder}>
        <Ionicons name="videocam-outline" size={64} color={colors.white + '40'} />
        <Text style={styles.placeholderText}>Video Preview</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.sideButton} />
        <TouchableOpacity
          style={[styles.recordButton, recording && styles.recordButtonActive]}
          onPress={() => {
            if (recording) navigation.navigate('VideoEdit', {});
            setRecording(!recording);
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.recordInner, recording && styles.recordInnerActive]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideButton}>
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
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.lg,
  },
  timer: { ...typography.bodyMedium, color: colors.white },
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
  },
  sideButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: { borderColor: colors.primary },
  recordInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.error },
  recordInnerActive: { width: 28, height: 28, borderRadius: 6 },
});
