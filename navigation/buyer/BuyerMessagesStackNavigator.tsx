import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BuyerMessagesScreen from "@/src/features/screens/buyer_Screens/messages/BuyerMessagesScreen";
import BuyerChatScreen from "@/src/features/screens/buyer_Screens/marketplace_Buyer/BuyerChatScreen";

const Stack = createNativeStackNavigator();

export default function BuyerMessagesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BuyerMessagesHome" component={BuyerMessagesScreen} />
      <Stack.Screen name="BuyerChat" component={BuyerChatScreen} />
    </Stack.Navigator>
  );
}
