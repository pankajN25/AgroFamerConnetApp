import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { buyerCropService } from "@/services/buyer/buyerCropService";
import { buyerAuthService } from "@/services/buyer/buyerAuthService";

const FALLBACK_CROP = {
  id: 1,
  nvcharCropName: "Organic Hass Avocados",
  floatPricePerKg: 4.5,
  floatQuantity: 1200,
  dtHarvestDate: "Oct 24, 2026",
  nvcharDescription:
    "Freshly harvested organic Hass avocados from the Highlands. These avocados are known for their creamy texture and rich flavor.",
  nvcharLocation: "California, USA",
  intFarmerId: 1,
  nvcharCropImageUrl:
    "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80",
};

export default function CropDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const crop = route.params?.crop || FALLBACK_CROP;
  const [farmerData, setFarmerData] = useState({
    nvcharFullName: `Farmer #${crop.intFarmerId}`,
    nvcharPhoneNumber: "Phone not available",
    nvcharEmail: "Email not available",
    nvcharLocation: crop.nvcharLocation || "Location not available",
    nvcharProfilePhotoUrl: "",
    nvcharFarmingType: "Verified Farmer",
  });
  const [isFarmerLoading, setIsFarmerLoading] = useState(true);

  let imageUrl = buyerCropService.resolveCropImageUrl(crop.nvcharCropImageUrl);
  if (!imageUrl) {
    imageUrl = FALLBACK_CROP.nvcharCropImageUrl;
  }

  const farmerAvatar =
    farmerData.nvcharProfilePhotoUrl?.startsWith("http")
      ? farmerData.nvcharProfilePhotoUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(farmerData.nvcharFullName)}&background=DCFCE7&color=166534`;

  useEffect(() => {
    const loadFarmerData = async () => {
      if (!crop.intFarmerId) {
        setIsFarmerLoading(false);
        return;
      }

      try {
        const response = await buyerAuthService.getFarmerById(Number(crop.intFarmerId));
        const farmerRecord =
          response?.data?.[0] ||
          response?.data ||
          (Array.isArray(response) ? response[0] : response);

        if (farmerRecord) {
          setFarmerData((prev) => ({
            ...prev,
            nvcharFullName: farmerRecord.nvcharFullName || prev.nvcharFullName,
            nvcharPhoneNumber: farmerRecord.nvcharPhoneNumber || prev.nvcharPhoneNumber,
            nvcharEmail: farmerRecord.nvcharEmail || prev.nvcharEmail,
            nvcharLocation:
              farmerRecord.nvcharLocation ||
              [farmerRecord.cityName, farmerRecord.stateName].filter(Boolean).join(", ") ||
              farmerRecord.nvcharAddress ||
              prev.nvcharLocation,
            nvcharProfilePhotoUrl:
              farmerRecord.nvcharProfilePhotoUrl ||
              farmerRecord.avatarUrl ||
              prev.nvcharProfilePhotoUrl,
            nvcharFarmingType: farmerRecord.nvcharFarmingType || prev.nvcharFarmingType,
          }));
        }
      } catch (error) {
        console.log("Error loading farmer details", error);
      } finally {
        setIsFarmerLoading(false);
      }
    };

    loadFarmerData();
  }, [crop.intFarmerId, crop.nvcharLocation]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("BuyerMarketplaceHome");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100 z-10">
        <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#111827]">Crop Details</Text>
        <TouchableOpacity className="p-2 -mr-2">
          <MaterialCommunityIcons name="share-variant" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="w-full h-64 bg-gray-200">
          <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
        </View>

        <View className="px-6 pt-5 bg-white">
          <View className="flex-row justify-between items-start mb-2">
            <View className="bg-green-100 px-2.5 py-1 rounded-md self-start">
              <Text className="text-[#00E600] font-extrabold text-[10px] tracking-widest uppercase">
                IN STOCK
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[#00E600] font-extrabold text-2xl">Rs. {crop.floatPricePerKg}</Text>
              <Text className="text-[#9CA3AF] text-xs font-semibold -mt-1">per kg</Text>
            </View>
          </View>

          <Text className="text-2xl font-extrabold text-[#111827] mb-6">{crop.nvcharCropName}</Text>

          <View className="flex-row justify-between mb-6 space-x-4">
            <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <Text className="text-[#9CA3AF] text-xs font-semibold mb-1">Quantity Available</Text>
              <Text className="text-[#111827] text-base font-extrabold">{crop.floatQuantity} kg</Text>
            </View>
            <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <Text className="text-[#9CA3AF] text-xs font-semibold mb-1">Harvest Date</Text>
              <Text className="text-[#111827] text-base font-extrabold">{crop.dtHarvestDate}</Text>
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-lg font-extrabold text-[#111827] mb-3">Description</Text>
            <Text className="text-[#4B5563] leading-relaxed">
              {crop.nvcharDescription || "No description provided for this crop."}
            </Text>
          </View>

          <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-6">
            <Text className="text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-widest mb-4">
              Farmer Information
            </Text>
            {isFarmerLoading ? (
              <View className="py-6 items-center justify-center">
                <ActivityIndicator color="#00E600" />
              </View>
            ) : (
              <View className="flex-row items-center">
                <Image source={{ uri: farmerAvatar }} className="w-14 h-14 rounded-full border border-gray-100" />
                <View className="flex-1 ml-3 justify-center">
                  <Text className="text-lg font-bold text-[#111827]">{farmerData.nvcharFullName}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <MaterialCommunityIcons name="map-marker" size={12} color="#9CA3AF" />
                    <Text className="text-[#6B7280] text-xs ml-1">{farmerData.nvcharLocation}</Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <MaterialCommunityIcons name="sprout" size={12} color="#16A34A" />
                    <Text className="text-[#16A34A] text-xs font-semibold ml-1">{farmerData.nvcharFarmingType}</Text>
                  </View>
                </View>
                <View className="bg-green-50 px-2 py-1 rounded-lg flex-row items-center border border-green-100">
                  <MaterialCommunityIcons name="account-check-outline" size={14} color="#00E600" />
                  <Text className="text-[#00E600] font-bold text-xs ml-1">Active</Text>
                </View>
              </View>
            )}

            {!isFarmerLoading && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons name="phone-outline" size={16} color="#6B7280" />
                  <Text className="text-[#374151] text-sm ml-2">{farmerData.nvcharPhoneNumber}</Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="email-outline" size={16} color="#6B7280" />
                  <Text className="text-[#374151] text-sm ml-2 flex-1" numberOfLines={1}>
                    {farmerData.nvcharEmail}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 w-full bg-white px-6 py-4 border-t border-gray-100 flex-row space-x-3 pb-8">
        <TouchableOpacity
          className="flex-1 border-2 border-[#00E600] py-3 rounded-2xl items-center justify-center flex-row bg-white"
          onPress={() => console.log("Message Farmer")}
        >
          <MaterialCommunityIcons name="message-processing" size={20} color="#00E600" />
          <Text className="text-[#00E600] font-bold text-lg ml-2">Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-[#00E600] py-3 rounded-2xl items-center justify-center flex-row shadow-sm"
          onPress={() => navigation.navigate("BuyCrop", { crop })}
        >
          <MaterialCommunityIcons name="cart" size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">Buy Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
