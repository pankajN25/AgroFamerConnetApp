// src/features/farmer/screens/CropDetailsScreen.tsx
import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { cropService } from "@/services/farmer/cropService";

const formatHarvestDate = (value?: string) => {
  if (!value) {
    return "Not set";
  }

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function CropDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  
  // Extract the crop data passed from the MyCropsScreen
  const { crop } = route.params as { crop: any };
  const cropImageUrl =
    crop?._resolvedImageUrl ||
    cropService.resolveCropImageUrl(
      crop?.nvcharCropImageUrl || crop?.nvcharImageUrl || crop?.imageUrl
    );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* ---------------- IMAGE SECTION ---------------- */}
        <View className="relative w-full h-80 bg-gray-200">
          {cropImageUrl ? (
            <Image 
              source={{ uri: cropImageUrl }} 
              className="w-full h-full" 
              resizeMode="cover" 
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-[#F4F9F4]">
              <MaterialCommunityIcons name="sprout" size={80} color="#10B981" />
            </View>
          )}

          {/* Floating Back Button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="absolute top-4 left-4 w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-sm mt-2"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* ---------------- DETAILS SECTION ---------------- */}
        <View className="px-6 pt-6 bg-white -mt-6 rounded-t-3xl shadow-sm border-t border-gray-100">
          
          {/* Title & Badges */}
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-extrabold text-[#111827] flex-1 mr-4">
              {crop.nvcharCropName}
            </Text>
            <View className={`px-3 py-1.5 rounded-lg ${crop.nvcharStatus === 'SOLD' ? 'bg-gray-100' : 'bg-green-50'}`}>
              <Text className={`text-xs font-bold ${crop.nvcharStatus === 'SOLD' ? 'text-gray-500' : 'text-[#10B981]'}`}>
                {crop.nvcharStatus || "ACTIVE"}
              </Text>
            </View>
          </View>

          {/* Organic Tag (If true) */}
          {crop.ynOrganic && (
            <View className="flex-row items-center mb-4">
              <MaterialCommunityIcons name="leaf" size={16} color="#10B981" />
              <Text className="text-[#10B981] font-bold text-sm ml-1">Certified Organic</Text>
            </View>
          )}

          {/* Price & Quantity Cards */}
          <View className="flex-row justify-between mb-6 mt-4 space-x-4">
            <View className="flex-1 bg-[#F4F9F4] p-4 rounded-2xl border border-green-100">
              <Text className="text-[#6B7280] text-sm font-semibold mb-1">Price per kg</Text>
              <Text className="text-[#10B981] text-2xl font-extrabold">₹{crop.floatPricePerKg}</Text>
            </View>
            <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <Text className="text-[#6B7280] text-sm font-semibold mb-1">Available Stock</Text>
              <Text className="text-[#111827] text-2xl font-extrabold">{crop.floatQuantity} <Text className="text-base font-normal text-gray-400">kg</Text></Text>
            </View>
          </View>

          {/* Location & Harvest Date */}
          <View className="mb-6 space-y-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-3">
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#6B7280" />
              </View>
              <View>
                <Text className="text-[#9CA3AF] text-xs font-semibold">Farm Location</Text>
                <Text className="text-[#111827] font-semibold">{crop.nvcharLocation}</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-3">
                <MaterialCommunityIcons name="calendar-check-outline" size={20} color="#6B7280" />
              </View>
              <View>
                <Text className="text-[#9CA3AF] text-xs font-semibold">Harvest Date</Text>
                <Text className="text-[#111827] font-semibold">{formatHarvestDate(crop.dtHarvestDate)}</Text>
              </View>
            </View>
          </View>

          {/* Description Box */}
          <View className="mb-8">
            <Text className="text-lg font-bold text-[#111827] mb-2">Description</Text>
            <Text className="text-[#4B5563] leading-relaxed">
              {crop.nvcharDescription || "No description provided for this crop."}
            </Text>
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            className="bg-white border-2 border-green-100 flex-row justify-center items-center h-14 rounded-xl shadow-sm mb-4"
            onPress={() =>
              navigation.navigate("AddCrop", {
                mode: "edit",
                crop: {
                  ...crop,
                  _resolvedImageUrl: cropImageUrl,
                },
              })
            }
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#10B981" />
            <Text className="text-[#10B981] text-lg font-bold ml-2">Edit Crop Details</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
