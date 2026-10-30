import type { PostAuthDestination } from './postAuthGate';
import { enterAuthenticatedProduct, enterSignedOutAt } from './productTree';
import { hasConsumedProcessStart } from './processStart';
import type { SignedOutStackParamList } from '../navigation/types';

type ResettableNavigation = {
  reset: (state: never) => void;
  getState?: () => { routes?: Array<{ name: string }> } | undefined;
};

function isSignedOutRoute(
  name: string,
): name is keyof SignedOutStackParamList {
  return name !== 'MainTabs';
}

function isSplashNavigator(navigation: ResettableNavigation): boolean {
  const routes = navigation.getState?.()?.routes ?? [];
  return routes.some(
    (route) => route.name === 'Splash1' || route.name === 'Splash2',
  );
}

/**
 * Land post-auth destinations across the signed-out / authenticated trees.
 * MainTabs is never registered on the signed-out stack — tree switch is the
 * only way into the authenticated product.
 *
 * Signed-out destinations always write a durable handoff so a later media-hold
 * remount can restore TurnOnNotifications / ConfirmCode / VerifyAccount.
 */
export function applyPostAuthDestination(
  navigation: ResettableNavigation,
  dest: PostAuthDestination,
): void {
  if (dest.name === 'MainTabs') {
    enterAuthenticatedProduct([{ name: 'MainTabs' }]);
    return;
  }

  if (!isSignedOutRoute(dest.name)) {
    return;
  }

  enterSignedOutAt({
    name: dest.name,
    params: dest.params as object | undefined,
  });

  if (!hasConsumedProcessStart() || isSplashNavigator(navigation)) {
    return;
  }

  navigation.reset({
    index: 0,
    routes: [{ name: dest.name, params: dest.params as never }],
  } as never);
}
