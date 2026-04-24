import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import BuyerDashboardScreen from '@/src/features/screens/buyer_Screens/BuyerDashboardScreen';
import BuyerProfileScreen from '@/src/features/screens/buyer_Screens/BuyerProfileScreen';
import BuyerMarketplaceStackNavigator from './BuyerMarketplaceStackNavigator';
import BuyerOrdersScreen from '@/src/features/screens/buyer_Screens/OrderScreen/BuyerOrdersScreen';
import BuyerMessagesStackNavigator from './BuyerMessagesStackNavigator';

const Tab = createBottomTabNavigator();

const TAB_CONFIG: Record<string, { activeIcon: string; inactiveIcon: string; label: string }> = {
  Home:    { activeIcon: 'home',          inactiveIcon: 'home-outline',         label: 'Home' },
  Browse:  { activeIcon: 'store-search',  inactiveIcon: 'store-search-outline', label: 'Browse' },
  Orders:  { activeIcon: 'receipt-text',  inactiveIcon: 'receipt-text-outline', label: 'Orders' },
  Profile: { activeIcon: 'account',       inactiveIcon: 'account-outline',      label: 'Profile' },
};

const HIDDEN_FLOW_ROUTES = new Set([
  'Messages',
  'BuyerCropDetails',
  'BuyerFarmerProfile',
  'BuyerChat',
  'BuyCrop',
  'OrderSuccess',
]);

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index];
  const activeChildRouteName = getFocusedRouteNameFromRoute(activeRoute) ?? activeRoute.name;

  if (HIDDEN_FLOW_ROUTES.has(activeRoute.name) || HIDDEN_FLOW_ROUTES.has(activeChildRouteName)) {
    return null;
  }

  const visibleRoutes = state.routes.filter((route) => TAB_CONFIG[route.name]);

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {visibleRoutes.map((route) => {
          const config = TAB_CONFIG[route.name];
          const routeIndex = state.routes.findIndex((item) => item.key === route.key);
          const isFocused = state.index === routeIndex;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              {isFocused ? (
                // Active tab — pill with icon + label
                <View style={styles.activePill}>
                  <MaterialCommunityIcons
                    name={config.activeIcon as any}
                    size={20}
                    color="#ffffff"
                  />
                  <Text style={styles.activeLabel}>{config.label}</Text>
                </View>
              ) : (
                // Inactive tab — just icon
                <View style={styles.inactiveItem}>
                  <MaterialCommunityIcons
                    name={config.inactiveIcon as any}
                    size={24}
                    color="#9CA3AF"
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
    marginBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D4ED8',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  activeLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  inactiveItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
});

export default function BuyerTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"    component={BuyerDashboardScreen} />
      <Tab.Screen name="Browse"  component={BuyerMarketplaceStackNavigator} />
      <Tab.Screen
        name="Messages"
        component={BuyerMessagesStackNavigator}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen name="Orders"  component={BuyerOrdersScreen} />
      <Tab.Screen name="Profile" component={BuyerProfileScreen} />
    </Tab.Navigator>
  );
}
