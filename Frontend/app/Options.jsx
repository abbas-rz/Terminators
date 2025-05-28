import { Image } from "expo-image";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect } from 'react'

export default function Options() {
  const router = useRouter();

  const [loaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
    PoppinsBold: require('../assets/fonts/Poppins-Bold.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <View
      style={styles.container}
    >
      <Image
        source={require("../assets/images/Logo.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <TouchableOpacity style={styles.Button} onPress={() => {router.navigate("/calTracker")}}>
        <Text style={styles.buttonText}>{`Calorie Tracker >`}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#fff',
    gap: 40,
  },
  image: {
    flex: 0.12,
    width: '100%', 
    backgroundColor: '#fff',
  },
  TextContainer: {
    padding: 25,
    gap: 15
  },
  Header: {
    fontSize: 35,
    textAlign: "center",
    lineHeight: 64,
    fontFamily: "PoppinsBold"
  },
  Regular: {
    fontSize: 30,
    fontWeight: 800,
    textAlign: "center",
    lineHeight: 49,
    color: "rgba(0,0,0,0.7)",
    fontFamily: "Poppins"
  },
  Button: {
    backgroundColor: "#069F39",
    paddingVertical: 20,
    paddingHorizontal: 45,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: 'center',
  },
  buttonText: {
    color: "#fff",
    fontSize: 30,
    fontFamily: "PoppinsBold"
  }
});

