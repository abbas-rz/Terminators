import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput } from "react-native-paper";

export default function BLD_comp({ Title, Foods, setFoods }) {
  const updateFood = (index, key, value) => {
    const updated = [...Foods];
    updated[index][key] = value;
    setFoods(updated);
  };

  const addFood = () => {
    setFoods([...Foods, { food_item: '', weight: '' }]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{Title}</Text>
      <View>
        {Foods.map((info, id) => (
          <View key={id} style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              label="Food.."
              value={info.food_name}
              onChangeText={(text) => updateFood(id, 'food_item', text)}
              mode="flat"
              underlineColor="#000"
              activeUnderlineColor="#000"
              style={styles.inputFood}
            />
            <TextInput
              label="Gms.."
              value={info.gms}
              onChangeText={(text) => updateFood(id, 'weight', text)}
              mode="flat"
              underlineColor="#000"
              activeUnderlineColor="#000"
              style={styles.inputGms}
              keyboardType="numeric"
            />
          </View>
        ))}
      </View>
      <TouchableOpacity onPress={addFood} style={styles.plusContainer}>
        <Text style={styles.plus}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 10,
  },
    inputFood: {
    backgroundColor: '#eee',
    width: '65%',
    fontSize: 16
  },
  inputGms: {
    backgroundColor: '#eee',
    width: '32%',
    fontSize: 16
  },
  input: {
    backgroundColor: "#eee",
    width: "60%",
    color: "#000",
    fontSize: 16,
    marginVertical: 5,
  },
  plusContainer: {
    alignItems: "center",
    justifyContent: 'center',
    wdith: 90,
    height: 90,
  },
  plus: {
    fontSize: 22,
    fontWeight: "bold",
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 50,
    paddingHorizontal: 20,
  }
});

