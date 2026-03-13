// src/navigation/FarmerStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import the Tabs and the Overlay Screens
import FarmerTabNavigator from './FarmerTabNavigator';
import AddCropScreen from '@/src/features/screens/farmer/addcropspage/AddCropScreen';
import CropSuccessScreen from '@/src/features/screens/farmer/addcropspage/CropSuccessScreen';
import MyCropsScreen from '@/src/features/screens/farmer/addcropspage/MyCropsScreen';
import CropDetailsScreen from '@/src/features/screens/farmer/addcropspage/CropDetailsScreen';
import OrdersScreen from '@/src/features/screens/farmer/ordersPage/OrdersScreen';
import OrderDetailsScreen from '@/src/features/screens/farmer/ordersPage/OrderDetailsScreen';
import MessagesScreen from '@/src/features/screens/farmer/messagScreen/MessagesScreen';
import ChatDetailScreen from '@/src/features/screens/farmer/messagScreen/ChatDetailScreen';
import WeatherScreen from '@/src/features/screens/farmer/WeatherScreen';
import FarmerMarketplaceScreen from '@/src/features/screens/farmer/marketplace/FarmerMarketplaceScreen';
import NotificationsScreen from '@/src/features/screens/farmer/notification/NotificationsScreen';
import FarmerProfileScreen from '@/src/features/screens/farmer/profileScreen/FarmerProfileScreen';

const Stack = createNativeStackNavigator();

export default function FarmerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* 1. The Home Base (This contains your Bottom Tabs) */}
      <Stack.Screen name="FarmerTabsBase" component={FarmerTabNavigator} />
      
      {/* 2. Dashboard Action Screens (These slide over the tabs) */}
      <Stack.Screen name="AddCrop" component={AddCropScreen} />
      <Stack.Screen name="CropSuccess" component={CropSuccessScreen} />
      
      {/* We will add these here as we build them! */}
      <Stack.Screen name="MyCrops" component={MyCropsScreen} />
      <Stack.Screen name="CropDetails" component={CropDetailsScreen} />
      <Stack.Screen name="OrdersScreen" component={OrdersScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="Marketplace" component={FarmerMarketplaceScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ProfileScreen" component={FarmerProfileScreen} />

      
    </Stack.Navigator>
  );
}
