import { useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SplashScreen } from '@/components/SplashScreen';

export default function RootLayout() {
  useFrameworkReady();
  const [showSplash, setShowSplash] = useState(true);
  const hasCompletedSplash = useRef(false);

  const handleComplete = () => {
    // Prevent multiple calls to setShowSplash
    if (!hasCompletedSplash.current) {
      hasCompletedSplash.current = true;
      setShowSplash(false);
    }
  };

  // Only show splash if we haven't completed it yet
  if (showSplash && !hasCompletedSplash.current) {
    return <SplashScreen onComplete={handleComplete} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(delivery)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
