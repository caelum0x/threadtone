/**
 * On-demand replay of the first-run intro (see src/ui/OnboardingScreen.tsx),
 * reachable from Settings → "Replay intro". The component itself already
 * owns its own close/step chrome, so this route is just a thin modal host —
 * it never touches the persisted onboarding_complete flag's "seen before"
 * meaning; closing just dismisses back to wherever the user came from.
 */
import { useRouter } from 'expo-router';

import { OnboardingScreen } from '../ui/OnboardingScreen';

export default function OnboardingRoute() {
  const router = useRouter();
  return <OnboardingScreen onDone={() => router.back()} />;
}
