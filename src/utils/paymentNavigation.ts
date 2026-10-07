import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

/** After a successful payment, return to the work request (or Jobs → In Progress). */
export function returnToRequestAfterPayment(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  requestId: string | undefined,
): void {
  if (requestId) {
    // Pops the payment screens off the stack and lands on the existing detail
    // (which refreshes itself on focus).
    navigation.popTo('WorkRequestDetail', { requestId });
    return;
  }
  navigation.navigate('MainTabs', {
    screen: 'JobsTab',
    params: { tab: 'sent', section: 'in-progress' },
  });
}
