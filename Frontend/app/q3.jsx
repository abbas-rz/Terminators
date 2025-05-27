import { Image } from "expo-image";
import { Text, StyleSheet, View, TouchableOpacity, TextInput } from "react-native";
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useRef, useState } from "react"

function q3() {
  const router = useRouter();

  const [loaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
    PoppinsBold: require('../assets/fonts/Poppins-Bold.ttf'),
  });

  if (!loaded) {
    return null;
  }

  const [text, setText] = useState("")

  const movement = () => {
    if (text == "") {
      return
    }
    router.navigate("/auth")
  }
  
  const handleInputChange = (input) => {
    setText(input);
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/Logo.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.question}>Where do you see yourself in terms of fitness in the next 6 months?</Text>
       <TextInput
        style={styles.input}
        onChangeText={handleInputChange}
        value={text}
        placeholder="..."
        multiline
        numberOfLines={4}
      />
      <TouchableOpacity style={styles.Button} onPress={movement}>
        <Text style={styles.buttonText}>{`Let's Go! >`}</Text>
      </TouchableOpacity>

    </View>
  );
}

export default q3;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 10,
    width: "90%",
    borderRadius: 19,
    height: "10%",
    paddingBottom: 20,
    marginVertical: 20,
    marginBottom: 30
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#fff"
  },
  image: {
    flex: 0.15,
    width: '100%',
    backgroundColor: '#fff',
    marginBottom: 30
  },
  question: {
    fontSize: 35,
    textAlign: "center",
    lineHeight: 64,
    fontFamily: "PoppinsBold"
  },
  options: {
    marginTop: 40,
    gap: 20,
    alignItems: "start"
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20
  },
  optionCircle: {
    width: 40,
    height: 40,
    borderColor: "#000",
    borderWidth: 4,
    marginRight: 10,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 30,
    fontFamily: "Poppins",
  },
  Button: {
    marginVertical: 40,
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
  },
  textInput: {
    padding: 10,
  },
}
);


