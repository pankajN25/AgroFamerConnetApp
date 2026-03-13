import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BuyerMarketplaceScreen from "@/src/features/screens/buyer_Screens/marketplace_Buyer/BuyerMarketplaceScreen";
import CropDetailsScreen from "@/src/features/screens/buyer_Screens/marketplace_Buyer/CropDetailsScreen";
import BuyCropScreen from "@/src/features/screens/buyer_Screens/marketplace_Buyer/BuyCropScreen";
import OrderSuccessScreen from "@/src/features/screens/buyer_Screens/marketplace_Buyer/OrderSuccessScreen";

const Stack = createNativeStackNavigator();

export default function BuyerMarketplaceStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BuyerMarketplaceHome" component={BuyerMarketplaceScreen} />
      <Stack.Screen name="BuyerCropDetails" component={CropDetailsScreen} />
      <Stack.Screen name="BuyCrop" component={BuyCropScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
    </Stack.Navigator>
  );
}
