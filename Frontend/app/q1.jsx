import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import MCQ_Pages from "../components/MCQ_Pages.jsx"

export default function q1() {
  const router = useRouter();

  const [loaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
    PoppinsBold: require('../assets/fonts/Poppins-Bold.ttf'),
  });

  if (!loaded) {
    return null;
  }
  return(<>
    <MCQ_Pages
      question={"What is (are) your goal(s) in terms of health?"}
      options={["Weight Loss", "Gaining Muscle", "Overall Fitness"]}
      nx_loc={"/q2"}
    />
  </>)
}
