import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme';
import { useCreateMenu } from '../../context/CreateMenuContext';
import Button from '../ui/Button';
import { SignedOutStackParamList } from '../../navigation/types';

const TAB_BAR_HEIGHT = 60;

/**
 * Guest Create affordance. Does not open authenticated create flows
 * and does not call authenticated mutation APIs.
 */
export default function GuestCreateMenu() {
  const { isOpen, close } = useCreateMenu();
  const navigation =
    useNavigation<NativeStackNavigationProp<SignedOutStackParamList>>();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOpen ? 1 : 0,
      duration: isOpen ? 200 : 160,
      useNativeDriver: true,
    }).start();
  }, [isOpen, fadeAnim]);

  const goSignIn = () => {
    close();
    navigation.navigate('SignIn');
  };

  const goCreateAccount = () => {
    close();
    navigation.navigate('Welcome', { step: 1 });
  };

  const tabBarPadding = Math.max(insets.bottom, 8);
  const tabBarTotalHeight = TAB_BAR_HEIGHT + tabBarPadding;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.modalRoot} pointerEvents="box-none">
        <Pressable
          style={[styles.dismissArea, { bottom: tabBarTotalHeight }]}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close create menu"
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.backdropFill, { opacity: fadeAnim }]}
          />
        </Pressable>
        <Animated.View
          style={[
            styles.cardWrap,
            { bottom: tabBarTotalHeight + spacing.lg, opacity: fadeAnim },
          ]}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Sign in to create</Text>
            <Text style={styles.body}>
              Create a post, story, or job after you sign in or create an account.
            </Text>
            <Button title="Sign In" fullWidth onPress={goSignIn} />
            <Button
              title="Create Account"
              variant="ghost"
              fullWidth
              onPress={goCreateAccount}
              style={styles.secondary}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  dismissArea: {
    ...StyleSheet.absoluteFill,
    top: 0,
  },
  backdropFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  cardWrap: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#0E243A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  secondary: {
    marginTop: spacing.xs,
  },
});
