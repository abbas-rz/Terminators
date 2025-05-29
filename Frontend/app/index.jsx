import { Image } from "expo-image";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { useEffect } from 'react'

const fileUri = FileSystem.documentDirectory + 'auth_conf_for_DESICAL.txt';

export default function Index() {

  const deleteFile = async (fileUri) => {
    try {
      // Check if the file exists before deleting
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
        console.log('File deleted successfully.');
      } else {
        console.log('File does not exist.');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const bottle = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      console.log("FileINfo: ", fileInfo)

      if (fileInfo.exists) {
        const contents = await FileSystem.readAsStringAsync(fileUri);
        console.log('File contents:', contents);
        if (contents == "True") {
          router.push("/Options")
        } else {
          router.push('/q1')
        }
      }
      else {
        setTimeout(() => {
          router.push("/q1")
        }, 300);
      }
    } catch (error) {
      console.log('Error reading file:', error);
    }

  }

//  const readFromFile = async () => {
 //   try {
 //     const contents = await FileSystem.readAsStringAsync(fileUri);
//      console.log('File contents:', contents);
//      return contents
//    } catch (error) {
//      console.error('Error reading file:', error);
 //   }
 // };

  useEffect(() => {
    setTimeout(() => {
      bottle()
    }, 100)
  }, [])
  
  
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
        <Text style={styles.Header}>This Is Your Ticket For a Healthier & Happier Future!</Text>
        <Text style={styles.Regular}>What are you waiting for? Let's Go!</Text>
      </View>
      <TouchableOpacity style={styles.Button} onPress={bottle}>
        <Text style={styles.buttonText}>{`Let's Go! >`}</Text>
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
    flex: 0.19,
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

