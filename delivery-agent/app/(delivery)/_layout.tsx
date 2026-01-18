import { Stack } from 'expo-router';

export default function DeliveryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="active" />
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
