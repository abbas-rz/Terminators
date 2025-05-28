import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";

export default function RootLayout() {
  const [loaded] = useFonts({
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="q1" options={{ headerShown: false }} />
      <Stack.Screen name="q2" options={{ headerShown: false }} />
      <Stack.Screen name="q3" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="calTracker" options={{ headerShown: false }} />
      <Stack.Screen name="actCounter" options={{ headerShown: false }} />
      <Stack.Screen name="Options" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>

  )
}
