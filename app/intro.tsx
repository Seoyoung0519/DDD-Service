import { useLocalSearchParams } from 'expo-router';

import { ServiceIntroScreen } from '@/src/components/intro/ServiceIntroScreen';

export default function IntroRoute() {
  const params = useLocalSearchParams<{ from?: string | string[] }>();
  const from = Array.isArray(params.from) ? params.from[0] : params.from;

  return <ServiceIntroScreen exitMode={from === 'settings' ? 'back' : 'login'} />;
}
