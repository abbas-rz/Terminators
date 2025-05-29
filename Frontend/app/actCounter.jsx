import { View, StyleSheet, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useState, useEffect, useRef } from 'react'
import BLD_comp from "../components/BLD.jsx"
import * as FileSystem from 'expo-file-system';

const fileUri3 = FileSystem.documentDirectory + 'kcalGoal.txt'

const actCounter = () => {
  const [sentDataLog, setSentDataLog] = useState({
    breakfast: {},
    lunch: {},
    dinner: {}
  });

  const baseURL = "http://desicalapi.serveo.net"

  const [breakfast, setBreakfast] = useState([{ food_item: "", weight: "" }]);
  const [lunch, setLunch] = useState([{ food_item: "", weight: "" }]);
  const [dinner, setDinner] = useState([{ food_item: "", weight: "" }]);
  const [limit, setLimit] = useState(0)
  
  // Ref to track if this is the initial load
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const read = async () => {
      const contents = await FileSystem.readAsStringAsync(fileUri3);
      console.log('File contents:', contents);
      const limitValue = parseInt(contents);
      setLimit(limitValue);
      setInitialLimit(limitValue);
    }
    try {
      read()
    } catch (e) {
      console.log(e)
    }
  }, [])

  // Helper function to create a unique key for food items
  const createItemKey = (food_item, weight) => {
    return `${food_item.trim()}_${weight.trim()}`;
  };

  // Helper function to calculate calories difference and update log
  const processChangesForMeal = async (mealName, currentMealData, mealLog) => {
    const currentItems = {};
    const changes = { toAdd: [], toRemove: [] };
    
    // Create map of current valid items
    currentMealData.forEach(item => {
      if (item.food_item.trim() !== "" && item.weight.trim() !== "") {
        const key = createItemKey(item.food_item, item.weight);
        currentItems[key] = item;
      }
    });

    // Find items to remove (in log but not in current)
    Object.keys(mealLog).forEach(key => {
      if (!currentItems[key]) {
        changes.toRemove.push({
          key,
          calories: mealLog[key].calories
        });
      }
    });

    // Find items to add (in current but not in log)
    Object.keys(currentItems).forEach(key => {
      if (!mealLog[key]) {
        changes.toAdd.push({
          key,
          item: currentItems[key]
        });
      }
    });

    return changes;
  };

  const sendData = async () => {
    try {
      const meals = { breakfast, lunch, dinner };
      let totalCalorieChange = 0;
      const newLog = { ...sentDataLog };

      for (const [mealName, mealData] of Object.entries(meals)) {
        const mealLog = newLog[mealName];
        const changes = await processChangesForMeal(mealName, mealData, mealLog);

        // Remove calories for items no longer present
        changes.toRemove.forEach(({ key, calories }) => {
          totalCalorieChange += calories; // Add back the calories
          delete newLog[mealName][key];
          console.log(`Removed ${key} from ${mealName}, added back ${calories} calories`);
        });

        // Add new items and get their calories
        if (changes.toAdd.length > 0) {
          const itemsToSend = changes.toAdd.map(({ item }) => item);
          
          console.log(`Sending new items for ${mealName}:`, itemsToSend);
          
          const response = await fetch(`${baseURL}/nutrition`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ mealData: itemsToSend }),
          });
          
          const result = await response.json();
          console.log(`POST ${mealName} result:`, result);
          
          // Extract and convert calories
          const caloriesStr = result.calories;
          const caloriesNum = parseInt(caloriesStr.replace("kcal", "").trim());
          
          // Update log with new items and their calories
          changes.toAdd.forEach(({ key, item }) => {
            const itemCalories = Math.round(caloriesNum / changes.toAdd.length); // Distribute calories evenly
            newLog[mealName][key] = {
              food_item: item.food_item,
              weight: item.weight,
              calories: itemCalories
            };
          });
          
          totalCalorieChange -= caloriesNum; // Subtract the new calories
          console.log(`Added new items to ${mealName}, subtracted ${caloriesNum} calories`);
        }
      }

      // Update the log state
      setSentDataLog(newLog);
      
      // Update limit only if there were changes
      if (totalCalorieChange !== 0) {
        setLimit(prevLimit => prevLimit + totalCalorieChange);
        console.log(`Total calorie change: ${totalCalorieChange}`);
      }

    } catch (err) {
      console.error("Failed to send data:", err);
    }
  };

  useEffect(() => {
    // Skip the initial render
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      sendData();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [breakfast, lunch, dinner]);

  // Manual calculate button
  const handleManualCalculate = () => {
    sendData();
  };

  // Reset function to clear all data and restore initial limit
  const resetAll = () => {
    setBreakfast([{ food_item: "", weight: "" }]);
    setLunch([{ food_item: "", weight: "" }]);
    setDinner([{ food_item: "", weight: "" }]);
    setSentDataLog({
      breakfast: {},
      lunch: {},
      dinner: {}
    });
    setLimit(initialLimit);
  };

  // Debug function to show current log
  const showLog = () => {
    console.log("Current sent data log:", sentDataLog);
    console.log("Current limit:", limit);
    console.log("Initial limit:", initialLimit);
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
          <View style={{flexDirection: "row", marginBottom: 20, justifyContent: "space-between", marginTop: 40}}>
            <Text style={styles.Header}>Calorie Tracker</Text>
            {
              limit >= 0 ? (
                <Text style={styles.SecondHeader}>Kcal Limit: {limit}</Text>
              ) : (
                <Text style={styles.OopsHeader}>Kcal Limit: {limit}</Text>
              )
            }
          </View>
          <BLD_comp Title={"Breakfast"} Foods={breakfast} setFoods={setBreakfast} />
          <BLD_comp Title={"Lunch"} Foods={lunch} setFoods={setLunch} />
          <BLD_comp Title={"Dinner"} Foods={dinner} setFoods={setDinner} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 10
  },
  Header: {
    fontSize: 38,
    textAlign: "center",
    lineHeight: 54,
    fontFamily: "PoppinsBold",
    width: "50%",
    textAlign: "left"
  },
  SecondHeader: {
    fontSize: 30,
    textAlign: "center",
    lineHeight: 64,
    fontFamily: "PoppinsBold",
    color: "#069F39",
    width: "45%",
    textAlign: "right",
    lineHeight: 49
  },
  OopsHeader: {
    fontSize: 30,
    textAlign: "center",
    lineHeight: 64,
    fontFamily: "PoppinsBold",
    color: "#fe3030",
    width: "45%",
    textAlign: "right",
    lineHeight: 49
  },
  Button: {
    backgroundColor: "#069F39",
    paddingVertical: 15,
    paddingHorizontal: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: 'center',
    marginTop: 20
  },
  buttonText: {
    color: "#fff",
    fontSize: 30,
    fontFamily: "PoppinsBold"
  }
});


export default actCounter;
