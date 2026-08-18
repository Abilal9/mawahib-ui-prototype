import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import LocationSelectors from '../../components/ui/LocationSelectors';
import { colors, spacing, radius, typography } from '../../theme';
import { toImageSource } from '../../utils/image';
import { useMyProfile } from '../../context/ProfileContext';
import { ScreenProps } from '../../navigation/types';
import { pickAndUploadImage } from '../../lib/uploadMedia';
import {
  normalizeCountryCode,
  type CountryCode,
} from '../../data/location/geo';

export default function EditProfileScreen({ navigation }: ScreenProps<'EditProfile'>) {
  const insets = useSafeAreaInsets();
  const { user, updateProfileBasics } = useMyProfile();
  const [title, setTitle] = useState(user.title ?? '');
  const [countryCode, setCountryCode] = useState<CountryCode | null>(
    normalizeCountryCode(user.countryCode),
  );
  const [locationCode, setLocationCode] = useState<string | null>(
    user.locationCode ?? null,
  );
  const [avatar, setAvatar] = useState<string | number>(user.avatar);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const pickAvatar = async () => {
    try {
      setUploading(true);
      setUploadProgress(0);
      const uploaded = await pickAndUploadImage('avatar', setUploadProgress);
      if (!uploaded) return;
      setAvatar(uploaded.remoteUrl);
    } catch (err) {
      Alert.alert(
        'Upload failed',
        err instanceof Error ? err.message : 'Could not upload avatar',
      );
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const save = () => {
    updateProfileBasics({
      title: title.trim() || undefined,
      ...(countryCode && locationCode
        ? { countryCode, locationCode }
        : {}),
      avatar,
    });
    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false} safeTop={false} backgroundColor={colors.white}>
      <StatusBar style="dark" />
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => {
              void pickAvatar();
            }}
            disabled={uploading}
          >
            <Image source={toImageSource(avatar)} style={styles.avatar} contentFit="cover" />
            <View style={styles.cameraBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.white} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>
            {uploadProgress != null
              ? `Uploading ${Math.round(uploadProgress * 100)}%`
              : 'Tap photo to upload a new avatar'}
          </Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Product Designer"
            placeholderTextColor={colors.textSecondary}
          />
          <View style={styles.locationBlock}>
            <LocationSelectors
              countryCode={countryCode}
              locationCode={locationCode}
              onCountryChange={setCountryCode}
              onLocationChange={(code) => setLocationCode(code || null)}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Button title="Save" onPress={save} disabled={uploading} />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h3, color: colors.text },
  content: { padding: spacing.screen, alignItems: 'center' },
  avatarWrap: { marginTop: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    alignSelf: 'stretch',
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.text,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  locationBlock: {
    alignSelf: 'stretch',
  },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
