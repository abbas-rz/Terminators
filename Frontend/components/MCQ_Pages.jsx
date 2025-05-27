import { Image } from "expo-image";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useRef, useState } from "react"

function MCQ_Pages({question, options, nx_loc}) {
  const router = useRouter();

  const [loaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
    PoppinsBold: require('../assets/fonts/Poppins-Bold.ttf'),
  });

  if (!loaded) {
    return null;
  }

  const [selectedIndexes, setSelectedIndexes] = useState([]);

  const first_ref = useRef(null)
  const second_ref = useRef(null)
  const three_ref = useRef(null)

  const list_ref = [first_ref.current, second_ref.current, three_ref.current]

  const checker = (id) => {
    if (selectedIndexes.includes(id)) {
      return (
        <View style={{ backgroundColor: "#000", width: 17, height: 17, borderRadius: 100 }} />
      );
    }
    return null;
  };

  const selector = (id) => {
    setSelectedIndexes((prev) => {
      if (prev.includes(id)) {
        return prev.filter((index) => index !== id); // Deselect
      } else {
        return [...prev, id]; // Select
      }
    });
  };

  const movement = () => {
    if (selectedIndexes[0] == null) {
      console.log(selectedIndexes[0])
      return
    }
    router.navigate(nx_loc)
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/Logo.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.question}>{question}</Text>
      <View style={styles.options}>
        {options.map((option, id) => (
          <TouchableOpacity style={styles.option} key={id} onPress={() => selector(id)}>
            <View style={styles.optionCircle}>
              {checker(id)}
            </View>
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.Button} onPress={movement}>
        <Text style={styles.buttonText}>{`Let's Go! >`}</Text>
      </TouchableOpacity>
      <Text style={{fontSize: 20}}>You can select multiple options</Text>
    </View>
  );
}

export default MCQ_Pages;

const styles = StyleSheet.create({
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
  }
}
);

