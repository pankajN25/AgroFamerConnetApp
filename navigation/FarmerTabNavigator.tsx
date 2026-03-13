// src/navigation/FarmerTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Text, View } from 'react-native';
import FarmerDashboardScreen from '@/src/features/screens/FarmerDashboardScreen';
import OrdersScreen from '@/src/features/screens/farmer/ordersPage/OrdersScreen';
import FarmerMarketplaceScreen from '@/src/features/screens/farmer/marketplace/FarmerMarketplaceScreen';
import FarmerProfileScreen from '@/src/features/screens/farmer/profileScreen/FarmerProfileScreen';

const Tab = createBottomTabNavigator();

export default function FarmerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#00E600',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          height: 74,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 16 : 12,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderRadius: 26,
          elevation: 10,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 18,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName: any = 'help';
          if (route.name === 'Dashboard') iconName = 'view-grid';
          else if (route.name === 'Marketplace') iconName = 'storefront-outline';
          else if (route.name === 'Orders') iconName = 'receipt';
          else if (route.name === 'Profile') iconName = 'account-outline';
          
          return (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? 'rgba(0, 230, 0, 0.14)' : 'transparent',
              }}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={focused ? 24 : 22}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={FarmerDashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Marketplace"
        component={FarmerMarketplaceScreen}
        options={{ tabBarLabel: 'Market' }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
      />
      <Tab.Screen
        name="Profile"
        component={FarmerProfileScreen}
      />
    </Tab.Navigator>
  );
}
