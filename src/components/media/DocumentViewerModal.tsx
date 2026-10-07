import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';

export interface DocumentViewerSource {
  /** Filename or title shown in the header. */
  title: string;
  /** Short-lived signed URL. */
  uri: string;
  mimeType: string;
}

interface Props {
  /** `null` hides the modal. */
  source: DocumentViewerSource | null;
  onClose: () => void;
}

function isImage(source: DocumentViewerSource): boolean {
  const mime = source.mimeType.toLowerCase();
  if (mime.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|heic)$/i.test(source.title);
}

function isPdf(source: DocumentViewerSource): boolean {
  const mime = source.mimeType.toLowerCase();
  if (mime.includes('pdf')) return true;
  return /\.pdf$/i.test(source.title);
}

/**
 * Signed-URL viewer.
 * Images stay in-app on both platforms.
 * iOS PDFs stay in-app (WebView).
 * Android PDFs open the same short-lived signed URL in the system handler,
 * because WebView PDF rendering is unreliable there. The bucket stays private.
 */
export default function DocumentViewerModal({ source, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const androidPdf = !!source && Platform.OS === 'android' && isPdf(source);

  useEffect(() => {
    if (!source || Platform.OS !== 'android' || !isPdf(source)) return;
    const uri = source.uri;
    void Linking.openURL(uri).finally(() => onCloseRef.current());
  }, [source?.uri, source?.mimeType, source?.title]);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
  }, [source?.uri]);

  const fail = () => {
    setFailed(true);
    setLoading(false);
  };

  return (
    <Modal
      visible={source !== null}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {source?.title ?? ''}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={10}
            accessibilityLabel="Close viewer"
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {source && !failed && !androidPdf ? (
            isImage(source) ? (
              <Image
                source={{ uri: source.uri }}
                style={styles.fill}
                contentFit="contain"
                onLoadEnd={() => setLoading(false)}
                onError={fail}
              />
            ) : (
              <WebView
                source={{ uri: source.uri }}
                style={styles.fill}
                onLoadEnd={() => setLoading(false)}
                onError={fail}
                onHttpError={fail}
                startInLoadingState={false}
              />
            )
          ) : null}

          {loading && !failed ? (
            <View style={styles.overlay} pointerEvents="none">
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : null}

          {failed ? (
            <View style={styles.overlay}>
              <Ionicons
                name="alert-circle-outline"
                size={32}
                color={colors.error}
              />
              <Text style={styles.errorTitle}>Couldn&apos;t open this file</Text>
              <Text style={styles.errorBody}>
                The link may have expired. Close and try again.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: { ...typography.h3, color: colors.text, flex: 1 },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill as object,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  errorTitle: { ...typography.label, color: colors.text, textAlign: 'center' },
  errorBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
