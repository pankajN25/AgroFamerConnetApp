import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AuthNavigator from "./navigation/AuthNavigator";
import FarmerStackNavigator from "./navigation/FarmerStackNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthNavigator />
        {/* <FarmerStackNavigator /> */}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

