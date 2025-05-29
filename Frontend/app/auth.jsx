import { Image } from "expo-image";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useState } from "react"
import { TextInput } from "react-native-paper"
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

const fileUri2 = FileSystem.documentDirectory + 'auth_conf_for_DESICAL.txt';
const fileUri = FileSystem.documentDirectory + 'uuid_for_DESICAL.txt';
const BASE_URL = "http://desicalapi.serveo.net"

export default function auth() {

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")

  const writeToFile = async (value, file) => {
    console.log("Writing, ", value)
    try {
      await FileSystem.writeAsStringAsync(file, value);
      console.log('File written');
    } catch (error) {
      console.error('Error writing file:', error);
    }
  }

  async function registerUser() {
    console.log("Starting...");

    if (name && email && password) {
      try {
        const res = await fetch(`${BASE_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (res.ok) {
          console.log("✅ Registered:", data);
          writeToFile("True", fileUri2)
          writeToFile(data.user_id, fileUri)
          router.push("/Options")
        } else {
          console.error("❌ Registration error:", data);
        }
      } catch (error) {
        console.error("❌ Fetch error:", error);
      }
    } else {
      console.warn("Please fill in all fields.");
    }
  }

  const loginUser = async () => {
    if (name && email && password) {
      try {
        const res = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (res.ok) {
          console.log("✅ Registered:", data);
          writeToFile(data.user_id, fileUri)
          writeToFile("True", fileUri2)
          router.push("/Options")
        } else {
          console.error("❌ Registration error:", data);
        }
      } catch (error) {
        console.error("❌ Fetch error:", error);
      }
    } else {
      console.warn("Please fill in all fields.");
    }
  }

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
      <View style={styles.TextContainer}>
        <Text style={styles.Header}>AUTHENTICATION</Text>
      </View>
      <TextInput
        label="Name"
        value={name}
        onChangeText={(name) => setName(name)}
        mode="flat"
        theme={1}
        outlineColor="#fff"
        activeOutlineColor="#F15550"
        underlineColor="#000"
        activeUnderlineColor="#000"
        style={{
          backgroundColor: "#eee",
          width: "80%",
          color: "#000",
          fontSize: 20,
          marginVertical: 5,
        }}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={(email) => setEmail(email)}
        mode="flat"
        theme={1}
        outlineColor="#fff"
        activeOutlineColor="#F15550"
        underlineColor="#000"
        activeUnderlineColor="#000"
        style={{
          backgroundColor: "#eee",
          width: "80%",
          color: "#000",
          fontSize: 20,
          marginVertical: 5,
        }}
        inputMode={"email"}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={(password) => setPassword(password)}
        mode="flat"
        theme={1}
        outlineColor="#fff"
        activeOutlineColor="#F15550"
        underlineColor="#000"
        activeUnderlineColor="#000"
        style={{
          backgroundColor: "#eee",
          width: "80%",
          color: "#000",
          fontSize: 20,
          marginVertical: 5,
        }}
      />
      <View style={{alignItems: "center", justifyContent: 'center', flexDirection: "row", gap: 20}}>
        <TouchableOpacity style={styles.Button} onPress={() => loginUser()}>
          <Text style={styles.buttonText}>{`Sign In >`}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.Button} onPress={() => registerUser()}>
          <Text style={styles.buttonText}>{`Sign Up >`}</Text>
        </TouchableOpacity>

      </View>
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
  input: {
    borderColor: "#000",
    backgroundColor: "#ededed",
    paddingHorizontal: 10,
    width: "90%",
    borderRadius: 19,
    height: "10%",
    paddingBottom: 20,
  },
  image: {
    flex: 0.19,
    width: '80%', 
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
    paddingVertical: 15,
    paddingHorizontal: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: 'center',
    marginBottom: 50,
    marginTop: 20
  },
  buttonText: {
    color: "#fff",
    fontSize: 30,
    fontFamily: "PoppinsBold"
  }
});

