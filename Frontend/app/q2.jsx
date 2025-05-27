import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import MCQ_Pages from "../components/MCQ_Pages.jsx"

export default function q2() {
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
      question={"Do you perform a high amount of physical activity?"}
      options={["Yes", "No", "Irregularly"]}
      nx_loc={"/q3"}
    />
  </>)
}

