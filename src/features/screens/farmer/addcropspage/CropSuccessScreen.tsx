// src/features/farmer/screens/CropSuccessScreen.tsx
import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function CropSuccessScreen() {
  const navigation = useNavigation<any>();

  const goToDashboard = () => {
    navigation.navigate("FarmerTabsBase", {
      screen: "Dashboard",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F9F4] justify-center items-center px-6">
      
      {/* SUCCESS ICON & TEXT */}
      <View className="items-center mb-12">
        <View className="w-32 h-32 bg-green-100 rounded-full items-center justify-center mb-6 shadow-sm border-4 border-white">
          <MaterialCommunityIcons name="check-decagram" size={80} color="#10B981" />
        </View>
        <Text className="text-3xl font-extrabold text-[#111827] mb-2 text-center">
          Crop Published!
        </Text>
        <Text className="text-[#6B7280] text-center text-base px-4">
          Your crop is now live on the marketplace and visible to buyers.
        </Text>
      </View>

      {/* ACTION BUTTONS */}
      <View className="w-full space-y-4">
        
        {/* 1. View My Crops (Primary Action) */}
        <TouchableOpacity
          onPress={goToDashboard}
          className="bg-[#10B981] flex-row justify-center items-center h-14 rounded-xl shadow-sm mb-3"
        >
          <MaterialCommunityIcons name="format-list-bulleted" size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">Back to Dashboard</Text>
        </TouchableOpacity>

        {/* 2. Add Another Crop (Secondary Action) */}
        <TouchableOpacity
          onPress={() => navigation.replace("AddCrop" as never)}
          className="bg-white border-2 border-green-100 flex-row justify-center items-center h-14 rounded-xl mb-3 shadow-sm"
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#10B981" />
          <Text className="text-[#10B981] text-lg font-bold ml-2">Add Another Crop</Text>
        </TouchableOpacity>

        {/* 3. Back to Dashboard (Tertiary Action) */}
        <TouchableOpacity
          onPress={goToDashboard}
          className="flex-row justify-center items-center h-14 rounded-xl"
        >
          <MaterialCommunityIcons name="view-grid-outline" size={24} color="#6B7280" />
          <Text className="text-[#6B7280] text-lg font-bold ml-2">Back to Dashboard</Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}
