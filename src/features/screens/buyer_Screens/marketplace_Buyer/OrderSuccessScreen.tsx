// src/features/buyer/screens/OrderSuccessScreen.tsx
import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function OrderSuccessScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
      
      {/* ---------------- SUCCESS ANIMATION/ICON ---------------- */}
      <View className="w-32 h-32 bg-green-50 rounded-full items-center justify-center mb-6 border-4 border-green-100">
        <MaterialCommunityIcons name="check-decagram" size={80} color="#00E600" />
      </View>

      <Text className="text-3xl font-extrabold text-[#111827] mb-2 text-center">
        Order Successful!
      </Text>
      
      <Text className="text-[#6B7280] text-center text-base mb-10 px-4 leading-relaxed">
        Your order has been sent to the farmer. You will receive an update once it is accepted.
      </Text>

      {/* ---------------- NAVIGATION BUTTONS ---------------- */}
      <View className="w-full space-y-4">
        
        {/* 1. View buyer orders */}
        <TouchableOpacity 
          onPress={() => navigation.navigate("Orders")}
          className="w-full bg-[#3B82F6] py-4 rounded-2xl items-center shadow-sm flex-row justify-center mb-3"
        >
          <MaterialCommunityIcons name="receipt" size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">View My Orders</Text>
        </TouchableOpacity>

        {/* 2. Order New Product (Routes back to Marketplace) */}
        <TouchableOpacity 
          onPress={() => navigation.navigate("Browse")}
          className="w-full bg-blue-50 py-4 rounded-2xl items-center border border-blue-100 flex-row justify-center mb-3"
        >
          <MaterialCommunityIcons name="store-search" size={20} color="#3B82F6" />
          <Text className="text-[#3B82F6] font-bold text-lg ml-2">Order New Product</Text>
        </TouchableOpacity>

        {/* 3. Go to Dashboard (Routes Home) */}
        <TouchableOpacity 
          onPress={() => navigation.navigate("Home")}
          className="w-full py-4 rounded-2xl items-center flex-row justify-center"
        >
          <MaterialCommunityIcons name="home-outline" size={20} color="#6B7280" />
          <Text className="text-[#6B7280] font-bold text-lg ml-2">Back to Dashboard</Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}
