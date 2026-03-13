// src/navigation/AuthNavigator.tsx
import FarmerLoginScreen from "@/src/features/screens/auth/FarmerLoginScreen";
import RoleSelectionScreen from "@/src/features/screens/auth/RoleSelectionScreen";
import SplashScreen from "@/src/features/screens/auth/SplashScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FarmerRegisterScreen from "@/src/features/screens/FarmerRegisterScreen";
import FarmerDashboardScreen from "@/src/features/screens/FarmerDashboardScreen";
import FarmerStackNavigator from "./FarmerStackNavigator";
import BuyerRegisterScreen from "@/src/features/screens/buyer_Screens/BuyerRegisterScreen";
import BuyerTabNavigator from "./buyer/BuyerTabNavigator";


const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* The first screen in the stack is the default starting screen */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="FarmerLogin" component={FarmerLoginScreen} />
      <Stack.Screen name="BuyerLogin" component={FarmerLoginScreen} />
      <Stack.Screen name="FarmerRegister" component={FarmerRegisterScreen} />
      <Stack.Screen name="BuyerRegister" component={BuyerRegisterScreen} />
      <Stack.Screen name="FarmerTabs" component={FarmerStackNavigator} />
      <Stack.Screen name="BuyerTabs" component={BuyerTabNavigator} />
      <Stack.Screen name="FarmerDashboard" component={FarmerDashboardScreen} />

     
    </Stack.Navigator>
  );
}
