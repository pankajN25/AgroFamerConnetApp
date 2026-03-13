// src/navigation/BuyerTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BuyerDashboardScreen from '@/src/features/screens/buyer_Screens/BuyerDashboardScreen';
import BuyerProfileScreen from '@/src/features/screens/buyer_Screens/BuyerProfileScreen';
import BuyerMarketplaceStackNavigator from './BuyerMarketplaceStackNavigator';
import BuyerOrdersScreen from '@/src/features/screens/buyer_Screens/OrderScreen/BuyerOrdersScreen';

// We will build the actual Dashboard next!
// import BuyerDashboardScreen from '../features/buyer/screens/BuyerDashboardScreen';

const Tab = createBottomTabNavigator();

export default function BuyerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Browse') iconName = focused ? 'store-search' : 'store-search-outline';
          else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Profile') iconName = focused ? 'account' : 'account-outline';

          return <MaterialCommunityIcons name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6', // Blue theme for Buyers!
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 5,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      })}
    >
      <Tab.Screen name="Home" component={BuyerDashboardScreen} />
      <Tab.Screen name="Browse" component={BuyerMarketplaceStackNavigator} />
      <Tab.Screen name="Orders" component={BuyerOrdersScreen} />
      <Tab.Screen name="Profile" component={BuyerProfileScreen} />
    </Tab.Navigator>
  );
}
