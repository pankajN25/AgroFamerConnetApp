// src/features/farmer/screens/FarmerProfileScreen.tsx
import React, { useState, useEffect } from "react";
import { 
  View, Text, TouchableOpacity, SafeAreaView, 
  ScrollView, Image, Alert 
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FarmerProfileScreen() {
  const navigation = useNavigation<any>();

  const getRootNavigation = () => {
    let currentNavigation: any = navigation;

    while (currentNavigation?.getParent?.()) {
      currentNavigation = currentNavigation.getParent();
    }

    return currentNavigation;
  };

  const performLogout = async () => {
    await AsyncStorage.multiRemove(["@farmer_user"]);

    const rootNavigation = getRootNavigation();
    const resetAction = CommonActions.reset({
      index: 0,
      routes: [{ name: "FarmerLogin" }],
    });

    rootNavigation.dispatch(resetAction);
    navigation.dispatch(resetAction);
  };
  
  // We will load the real user data here, but provide a beautiful fallback
  const [userData, setUserData] = useState({
    nvcharFullName: "Pankaj Narwade",
    nvcharPhoneNumber: "+91 9096232578",
    nvcharEmail: "pankaj@agroconnect.com",
    nvcharLocation: "Pune, Maharashtra",
    nvcharFarmingType: "Certified Organic",
    rating: 4.8,
    totalCrops: 12,
    completedOrders: 45,
    avatarUrl: "https://i.pravatar.cc/150?img=11" // Placeholder
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('@farmer_user');
        if (userStr) {
          const parsedUser = JSON.parse(userStr);
          // Merge the real logged-in data with our UI structure
          setUserData(prev => ({
            ...prev,
            nvcharFullName: parsedUser.nvcharFullName || prev.nvcharFullName,
            nvcharPhoneNumber: parsedUser.nvcharPhoneNumber || prev.nvcharPhoneNumber,
            nvcharEmail: parsedUser.nvcharEmail || prev.nvcharEmail,
            nvcharLocation:
              parsedUser.nvcharLocation ||
              [parsedUser.cityName, parsedUser.stateName].filter(Boolean).join(", ") ||
              prev.nvcharLocation,
            nvcharFarmingType: parsedUser.nvcharFarmingType || prev.nvcharFarmingType,
            avatarUrl:
              parsedUser.nvcharProfilePhotoUrl ||
              parsedUser.avatarUrl ||
              prev.avatarUrl,
          }));
        }
      } catch (error) {
        console.log("Error loading user data", error);
      }
    };
    loadUserData();
  }, []);

  // --- LOGOUT LOGIC ---
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            try {
              await performLogout();
            } catch (error) {
              console.log("Logout failed", error);
              Alert.alert("Logout Failed", "Unable to log out right now. Please try again.");
            }
          }
        }
      ]
    );
  };

  // --- REUSABLE MENU ITEM COMPONENT ---
  const renderMenuItem = (icon: string, title: string, subtitle?: string, onPress?: () => void, color = "#111827") => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center justify-between p-4 bg-white border-b border-gray-50"
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
          <MaterialCommunityIcons name={icon as any} size={22} color={color === "#111827" ? "#10B981" : color} />
        </View>
        <View>
          <Text className="text-base font-bold" style={{ color }}>{title}</Text>
          {subtitle && <Text className="text-xs text-[#9CA3AF] mt-0.5">{subtitle}</Text>}
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      
      {/* ---------------- HEADER ---------------- */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2 bg-[#F9FAFB]">
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
        <Text className="text-2xl font-extrabold text-[#111827]">Profile</Text>
        <TouchableOpacity className="p-2 -mr-2">
          <MaterialCommunityIcons name="cog-outline" size={26} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* ---------------- PROFILE CARD ---------------- */}
        <View className="bg-white mx-6 mt-4 rounded-3xl p-6 shadow-sm border border-gray-100 items-center">
          
          <View className="relative mb-4">
            <Image source={{ uri: userData.avatarUrl }} className="w-24 h-24 rounded-full border-4 border-green-50" />
            <TouchableOpacity className="absolute bottom-0 right-0 bg-[#10B981] w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-sm">
              <MaterialCommunityIcons name="camera-plus" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-extrabold text-[#111827] mb-1">{userData.nvcharFullName}</Text>
          <Text className="text-[#6B7280] font-medium mb-3">{userData.nvcharLocation}</Text>

          <View className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-lg mb-6 border border-green-100">
            <MaterialCommunityIcons name="check-decagram" size={16} color="#10B981" />
            <Text className="text-[#10B981] font-bold text-xs ml-1 uppercase tracking-wider">{userData.nvcharFarmingType}</Text>
          </View>

          {/* Quick Stats Grid */}
          <View className="flex-row justify-between w-full border-t border-gray-100 pt-5">
            <View className="items-center flex-1 border-r border-gray-100">
              <Text className="text-2xl font-extrabold text-[#111827]">{userData.rating}</Text>
              <View className="flex-row items-center mt-1">
                <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                <Text className="text-xs font-semibold text-[#9CA3AF] ml-1">Rating</Text>
              </View>
            </View>
            <View className="items-center flex-1 border-r border-gray-100">
              <Text className="text-2xl font-extrabold text-[#111827]">{userData.completedOrders}</Text>
              <Text className="text-xs font-semibold text-[#9CA3AF] mt-1">Orders Sold</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-extrabold text-[#111827]">{userData.totalCrops}</Text>
              <Text className="text-xs font-semibold text-[#9CA3AF] mt-1">Active Crops</Text>
            </View>
          </View>

        </View>

        {/* ---------------- MENU SECTIONS ---------------- */}
        <View className="mt-6 px-6">
          <Text className="text-xs font-extrabold text-[#9CA3AF] uppercase tracking-wider mb-2 ml-2">Business</Text>
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6">
            {renderMenuItem("sprout", "My Crops", "Manage your inventory", () => navigation.navigate("MyCrops" as never))}
            {renderMenuItem("storefront-outline", "My Market Page", "See how buyers view you")}
            {renderMenuItem("chart-bar", "Earnings & Analytics", "View your revenue reports")}
          </View>

          <Text className="text-xs font-extrabold text-[#9CA3AF] uppercase tracking-wider mb-2 ml-2">Account</Text>
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6">
            {renderMenuItem("account-edit-outline", "Personal Information", "Update phone, email, and address")}
            {renderMenuItem("translate", "Language Settings", "Marathi, Hindi, English")}
            {renderMenuItem("shield-check-outline", "Privacy & Security", "Password and app permissions")}
          </View>

          <Text className="text-xs font-extrabold text-[#9CA3AF] uppercase tracking-wider mb-2 ml-2">Support</Text>
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6">
            {renderMenuItem("help-circle-outline", "Help Center", "FAQs and troubleshooting")}
            {renderMenuItem("ticket-confirmation-outline", "Support Tickets", "Check your open queries")}
            
            {/* LOGOUT BUTTON */}
            {renderMenuItem("logout-variant", "Log Out", "Sign out of this device", handleLogout, "#EF4444")}
          </View>
        </View>

        <Text className="text-center text-gray-400 text-xs mb-8">AgroConnect App v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}
