// src/features/auth/screens/RoleSelectionScreen.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function RoleSelectionScreen() {
  const navigation = useNavigation();
  // State to track the selected role. Defaults to null until the user taps one.
  const [selectedRole, setSelectedRole] = useState<"farmer" | "buyer" | null>(null);

  // Helper function to handle the Continue button
  const handleContinue = () => {
    if (selectedRole === "farmer") {
      navigation.navigate("FarmerLogin" as never);
      console.log("Navigating to Farmer Login...");
    } else if (selectedRole === "buyer") {
      navigation.navigate("BuyerLogin" as never);
      console.log("Navigating to Buyer Login...");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* ---------------- HEADER ---------------- */}
      <View className="flex-row items-center px-6 pt-4 pb-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-[#111827] pr-8">
          Select Your Role
        </Text>
      </View>

      <View className="flex-1 px-6 pt-6">
        {/* ---------------- TITLES ---------------- */}
        <View className="items-center mb-8">
          <Text className="text-2xl font-extrabold text-[#111827] mb-2">
            Welcome to AgroConnect
          </Text>
          <Text className="text-center text-[#6B7280] leading-5 px-4">
            Please choose how you would like to use the platform to get started.
          </Text>
        </View>

        {/* ---------------- FARMER CARD ---------------- */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedRole("farmer")}
          className={`bg-white border-2 rounded-2xl p-6 mb-4 items-center shadow-sm ${
            selectedRole === "farmer" ? "border-[#00E600] bg-green-50/30" : "border-gray-100"
          }`}
        >
          <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
            <MaterialCommunityIcons name="sprout" size={32} color="#00E600" />
          </View>
          <Text className="text-xl font-bold text-[#111827] mb-2">Farmer</Text>
          <Text className="text-center text-[#6B7280] text-sm mb-6 leading-5">
            List your products, manage inventory, and connect directly with local buyers and markets.
          </Text>
          {/* Radio Button */}
          <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              selectedRole === "farmer" ? "border-[#00E600]" : "border-gray-300"
            }`}
          >
            {selectedRole === "farmer" && <View className="w-3 h-3 rounded-full bg-[#00E600]" />}
          </View>
        </TouchableOpacity>

        {/* ---------------- BUYER CARD ---------------- */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedRole("buyer")}
          className={`bg-white border-2 rounded-2xl p-6 items-center shadow-sm ${
            selectedRole === "buyer" ? "border-[#00E600] bg-green-50/30" : "border-gray-100"
          }`}
        >
          <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
            <MaterialCommunityIcons name="shopping" size={30} color="#00E600" />
          </View>
          <Text className="text-xl font-bold text-[#111827] mb-2">Buyer</Text>
          <Text className="text-center text-[#6B7280] text-sm mb-6 leading-5">
            Discover fresh produce, compare prices, and purchase high-quality crops straight from the source.
          </Text>
          {/* Radio Button */}
          <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              selectedRole === "buyer" ? "border-[#00E600]" : "border-gray-300"
            }`}
          >
            {selectedRole === "buyer" && <View className="w-3 h-3 rounded-full bg-[#00E600]" />}
          </View>
        </TouchableOpacity>
      </View>

      {/* ---------------- BOTTOM BUTTON ---------------- */}
      <View className="px-6 pb-8 pt-4">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedRole}
          className={`flex-row justify-center items-center py-4 rounded-xl shadow-sm ${
            selectedRole ? "bg-[#00E600]" : "bg-gray-300"
          }`}
        >
          <Text className={`text-lg font-bold mr-2 ${selectedRole ? "text-white" : "text-gray-500"}`}>
            Continue
          </Text>
          <MaterialCommunityIcons 
            name="arrow-right" 
            size={20} 
            color={selectedRole ? "white" : "#6B7280"} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
