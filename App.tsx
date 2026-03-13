import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./navigation/AuthNavigator";
import FarmerStackNavigator from "./navigation/FarmerStackNavigator";

export default function App() {
  return (
    <NavigationContainer>
      <AuthNavigator />
      {/* <FarmerStackNavigator /> */}
    </NavigationContainer>
  );
}


