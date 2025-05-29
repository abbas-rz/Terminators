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
const fileUri3 = FileSystem.documentDirectory + 'kcalGoal.txt'
const BASE_URL = "http://desicalapi.serveo.net"

export default function calTracker() {
  const [kcal_goal, setKcalG] = useState(0)
  const [uuid, setUUID] = useState()

  const setGoal = async () => {
    console.log("setting....")
    if (kcal_goal) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        console.log("FileINfo: ", fileInfo)

        if (fileInfo.exists) {
          const contents = await FileSystem.readAsStringAsync(fileUri);
          console.log('File contents:', contents);
          setUUID(contents)
        }
        else {
          setTimeout(() => {
          }, 300);
        }
        const res = await fetch(`${BASE_URL}/kcal_goal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid, kcal_goal }),
        });

        const data = await res.json

        writeToFile(kcal_goal, fileUri3)

        console.log(data)
        router.push("/actCounter")
      } catch (error) {
        console.log('Error reading file:', error);
      }
    }
  }

  const writeToFile = async (value, file) => {
    console.log("Writing, ", value)
    try {
      await FileSystem.writeAsStringAsync(file, value);
      console.log('File written');
    } catch (error) {
      console.error('Error writing file:', error);
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
        <Text style={styles.Header}>CALORIE TRACKING</Text>
      </View>
      <TextInput
        label="Calorie Goals"
        value={kcal_goal}
        onChangeText={(kcalG) => setKcalG(kcalG)}
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
        type="numeric"
        keyboardType="numeric"
      />
      <View style={{alignItems: "center", justifyContent: 'center', flexDirection: "row", gap: 20}}>
        <TouchableOpacity style={styles.Button} onPress={() => setGoal()}>
          <Text style={styles.buttonText}>{`Next >`}</Text>
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

