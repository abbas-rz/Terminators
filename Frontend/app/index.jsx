import { Image } from "expo-image";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useFonts } from 'expo-font';

export default function Index() {
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
      <View style={styles.TextContainer}>
        <Text style={styles.Header}>This Is Your Ticket For a Healthier & Happier Future!</Text>
        <Text style={styles.Regular}>What are you waiting for? Let's Go!</Text>
      </View>
      <TouchableOpacity style={styles.Button}>
        <Text style={styles.buttonText}>Let's Go!</Text>
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
    flex: 0.13,
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
    padding: 20,

  }
});

