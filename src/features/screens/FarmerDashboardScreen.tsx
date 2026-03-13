// src/features/farmer/screens/FarmerDashboardScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function FarmerDashboardScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [farmer, setFarmer] = useState({
    nvcharFullName: "Farmer Name",
    nvcharLocation: "Location Indicator",
    nvcharProfilePhotoUrl: "",
  });

  useEffect(() => {
    const loadFarmer = async () => {
      try {
        const userStr = await AsyncStorage.getItem("@farmer_user");
        if (!userStr) {
          return;
        }

        const user = JSON.parse(userStr);
        setFarmer({
          nvcharFullName: user?.nvcharFullName || "Farmer Name",
          nvcharLocation:
            user?.nvcharLocation ||
            [user?.cityName, user?.stateName].filter(Boolean).join(", ") ||
            "Location Indicator",
          nvcharProfilePhotoUrl:
            user?.nvcharProfilePhotoUrl || user?.avatarUrl || "",
        });
      } catch (error) {
        console.log("Error loading farmer dashboard data", error);
      }
    };

    loadFarmer();
  }, [isFocused]);
  const openAddCrop = () => {
    const parentNavigation = navigation.getParent();

    if (parentNavigation) {
      parentNavigation.navigate("AddCrop");
      return;
    }

    navigation.navigate("AddCrop");
  };

  const openMyCrops = () => {
    const parentNavigation = navigation.getParent();

    if (parentNavigation) {
      parentNavigation.navigate("MyCrops");
      return;
    }

    navigation.navigate("MyCrops");
  };

  const openOrders = () => {
    const parentNavigation = navigation.getParent();

    if (parentNavigation) {
      parentNavigation.navigate("OrdersScreen");
      return;
    }

    navigation.navigate("Orders");
  };

  const openMessages = () => {
    const parentNavigation = navigation.getParent();

    if (parentNavigation) {
      parentNavigation.navigate("Messages");
      return;
    }

    navigation.navigate("Messages");
  };

  const openNotifications = () => {
    const parentNavigation = navigation.getParent();

    if (parentNavigation) {
      parentNavigation.navigate("Notifications");
      return;
    }

    navigation.navigate("Notifications");
  };
  const openweather = () =>{
    const parentNavigation = navigation.getParent();

    if (parentNavigation) {
      parentNavigation.navigate("Weather");
      return;
    }
  }
  

  return (
    <SafeAreaView className="flex-1 bg-[#F4F9F4]">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* ---------------- HEADER ---------------- */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4 bg-white shadow-sm rounded-b-3xl">
          <View className="flex-row items-center">
            {/* Profile Avatar */}
            <Image 
              source={{ uri: farmer.nvcharProfilePhotoUrl || "https://i.pravatar.cc/150?img=11" }}
              className="w-12 h-12 rounded-full border-2 border-[#00E600]"
            />
            <View className="ml-3">
              <Text className="text-lg font-bold text-[#111827]">{farmer.nvcharFullName}</Text>
              <View className="flex-row items-center mt-0.5">
                <MaterialCommunityIcons name="map-marker" size={14} color="#9CA3AF" />
                <Text className="text-[#6B7280] text-xs ml-1">{farmer.nvcharLocation}</Text>
              </View>
            </View>
          </View>
          
          {/* Notification Bell */}
          <TouchableOpacity
            onPress={openNotifications}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center relative"
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#374151" />
            <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#00E600] rounded-full border-2 border-white" />
          </TouchableOpacity>
        </View>

        {/* ---------------- QUICK ACTIONS GRID ---------------- */}
        <View className="px-6 pt-6 flex-row flex-wrap justify-between">
          
          <TouchableOpacity
            onPress={openAddCrop}
            className="bg-white rounded-2xl w-[48%] mb-4 p-5 items-center justify-center shadow-sm border border-gray-100"
          >
            <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-3">
              <MaterialCommunityIcons name="plus" size={28} color="#00E600" />
            </View>
            <Text className="text-[#111827] font-bold">Add Crop</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openMyCrops} className="bg-white rounded-2xl w-[48%] mb-4 p-5 items-center justify-center shadow-sm border border-gray-100">
            <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-3">

              <MaterialCommunityIcons name="sprout" size={28} color="#00E600" />
            </View>
            <Text className="text-[#111827] font-bold">My Crops</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openOrders}
            className="bg-white rounded-2xl w-[48%] mb-4 p-5 items-center justify-center shadow-sm border border-gray-100"
          >
            <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-3">
              <MaterialCommunityIcons name="cart-outline" size={24} color="#00E600" />
            </View>
            <Text className="text-[#111827] font-bold">Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openMessages}
            className="bg-white rounded-2xl w-[48%] mb-4 p-5 items-center justify-center shadow-sm border border-gray-100"
          >
            <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-3">
              <MaterialCommunityIcons name="message-text-outline" size={24} color="#00E600" />
            </View>
            <Text className="text-[#111827] font-bold">Messages</Text>
          </TouchableOpacity>

        </View>

        {/* ---------------- DAILY INSIGHTS ---------------- */}
        <Text className="px-6 text-lg font-bold text-[#111827] mt-2 mb-4">Daily Insights</Text>

        {/* Weather Card */}
        <View className="bg-[#00E600] rounded-3xl p-5 mx-6 mb-4 shadow-sm">
          <TouchableOpacity onPress={openweather} className="flex-row items-center mb-4">
            <Text className="text-white text-sm font-medium mb-2">Weather Forecast</Text>
          {/* </TouchableOpacity> */}
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-white text-5xl font-extrabold">--°C</Text>
              <Text className="text-white text-sm mt-1">Partly Cloudy • Precip --%</Text>
            </View>
            <MaterialCommunityIcons name="weather-partly-cloudy" size={60} color="white" />
          </View>
          
          <View className="flex-row justify-between items-center pt-3 border-t border-white/30">
            <Text className="text-white text-xs">Humidity: --%</Text>
            <Text className="text-white text-xs">Wind: -- km/h</Text>
          </View>
          </TouchableOpacity>
        </View>

        {/* Market Price Trend Card */}
        <View className="bg-white rounded-3xl p-5 mx-6 mb-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-3">
              <MaterialCommunityIcons name="trending-up" size={24} color="#6B7280" />
            </View>
            <View>
              <Text className="text-[#9CA3AF] text-xs font-semibold">Market Price Trend</Text>
              <Text className="text-[#111827] font-bold text-base">Top Selling Crop</Text>
            </View>
          </View>
          
          <View className="flex-row justify-between items-end">
            <View className="flex-row items-baseline">
              <Text className="text-[#00E600] text-2xl font-extrabold">$---.--</Text>
              <Text className="text-[#9CA3AF] text-xs ml-1">/ unit</Text>
            </View>
            <Text className="text-[#00E600] text-xs font-bold bg-green-50 px-2 py-1 rounded-md">
              ▲ --%
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
