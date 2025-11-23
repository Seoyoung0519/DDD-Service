import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="Drawer_1" options={{ headerShown: false }} />
        <Stack.Screen name="Drawer_2" options={{ headerShown: false }} />
        <Stack.Screen name="Drawer_3" options={{ headerShown: false }} />
        <Stack.Screen name="DaedokPick" options={{ headerShown: false }} />
        <Stack.Screen name="SearchScreen_1" options={{ headerShown: false }} />
        <Stack.Screen name="SearchScreen_2" options={{ headerShown: false }} />
        <Stack.Screen name="SearchResult" options={{ headerShown: false }} />
        <Stack.Screen name="BookDetailScreen" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding_2" options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding_3" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

