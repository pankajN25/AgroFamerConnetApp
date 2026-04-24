// navigation/FarmerTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FarmerDashboardScreen from '@/src/features/screens/FarmerDashboardScreen';
import OrdersScreen from '@/src/features/screens/farmer/ordersPage/OrdersScreen';
import FarmerMarketplaceScreen from '@/src/features/screens/farmer/marketplace/FarmerMarketplaceScreen';
import FarmerProfileScreen from '@/src/features/screens/farmer/profileScreen/FarmerProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Dashboard: { active: 'home',             inactive: 'home-outline' },
  Marketplace:{ active: 'storefront',      inactive: 'storefront-outline' },
  Orders:     { active: 'receipt-text',    inactive: 'receipt-text-outline' },
  Profile:    { active: 'account-circle',  inactive: 'account-circle-outline' },
};

const ACCENT  = '#16A34A';
const INACTIVE = '#94A3B8';

export default function FarmerTabNavigator() {
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(10, insets.bottom + 6);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: tabBarBottom,
          height: (Platform.OS === 'ios' ? 76 : 68) + insets.bottom,
          paddingTop: 0,
          paddingBottom: Math.max(10, insets.bottom),
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderRadius: 28,
          elevation: 16,
          shadowColor: '#064E3B',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
        },
        tabBarItemStyle: { paddingTop: 10 },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name] ?? { active: 'help', inactive: 'help' };
          const iconName = focused ? icons.active : icons.inactive;
          return (
            <View
              style={{
                width: 44,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? 'rgba(22,163,74,0.12)' : 'transparent',
              }}
            >
              <MaterialCommunityIcons name={iconName as any} size={focused ? 25 : 23} color={focused ? ACCENT : INACTIVE} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard"   component={FarmerDashboardScreen}    options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Marketplace" component={FarmerMarketplaceScreen}  options={{ tabBarLabel: 'Market' }} />
      <Tab.Screen name="Orders"      component={OrdersScreen} />
      <Tab.Screen name="Profile"     component={FarmerProfileScreen} />
    </Tab.Navigator>
  );
}
