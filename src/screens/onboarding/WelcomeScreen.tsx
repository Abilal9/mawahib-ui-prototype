import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ListRenderItemInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import WelcomeStepIndicator from '../../components/onboarding/WelcomeStepIndicator';
import { WELCOME_STEPS } from '../../constants/welcome';
import { colors, spacing, radius, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';

const HORIZONTAL_PADDING = spacing.xxl;
const ILLUSTRATION_WIDTH = 345;
const ILLUSTRATION_HEIGHT = 237;
const SCREEN_WIDTH = Dimensions.get('window').width;

type WelcomeStep = 1 | 2 | 3;

const STEPS: WelcomeStep[] = [1, 2, 3];

export default function WelcomeScreen({ route, navigation }: ScreenProps<'Welcome'>) {
  const initialStep = (route.params?.step ?? 1) as WelcomeStep;
  const [step, setStep] = useState<WelcomeStep>(initialStep);
  const listRef = useRef<FlatList<WelcomeStep>>(null);
  const isLast = step === 3;

  const goToStep = useCallback((next: WelcomeStep) => {
    setStep(next);
    listRef.current?.scrollToIndex({ index: next - 1, animated: true });
  }, []);

  const handleNext = () => {
    if (isLast) {
      navigation.navigate('AccountType');
      return;
    }
    goToStep((step + 1) as WelcomeStep);
  };

  const handleSkip = () => {
    navigation.navigate('AccountType');
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const next = (Math.max(0, Math.min(2, page)) + 1) as WelcomeStep;
    if (next !== step) setStep(next);
  };

  const renderItem = ({ item }: ListRenderItemInfo<WelcomeStep>) => {
    const content = WELCOME_STEPS[item];
    return (
      <View style={styles.slide}>
        <Image
          source={{ uri: content.image }}
          style={styles.illustration}
          contentFit="cover"
        />
        <View style={styles.textBlock}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer padded={false} backgroundColor={colors.background}>
      <StatusBar style="dark" />
      <View style={styles.page}>
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/arabic-emblem.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <FlatList
          ref={listRef}
          data={STEPS}
          keyExtractor={(item) => String(item)}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces
          onMomentumScrollEnd={onMomentumScrollEnd}
          initialScrollIndex={initialStep - 1}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          style={styles.pager}
        />

        <WelcomeStepIndicator step={step} />

        <View style={styles.footer}>
          <Button
            title={isLast ? 'Get Started' : 'Next'}
            onPress={handleNext}
            fullWidth
            size="md"
          />
          <Button
            title="Skip"
            variant="secondary"
            onPress={handleSkip}
            fullWidth
            size="md"
            style={styles.skipButton}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  logo: {
    position: 'absolute',
    width: 112,
    height: 112,
  },
  pager: {
    flexGrow: 0,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  illustration: {
    width: '100%',
    maxWidth: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_HEIGHT,
    borderRadius: radius.card,
    alignSelf: 'center',
    backgroundColor: colors.borderLight,
    marginBottom: spacing.xxl,
  },
  textBlock: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodySmall,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.xxl,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  skipButton: {
    marginTop: spacing.xl,
  },
});
