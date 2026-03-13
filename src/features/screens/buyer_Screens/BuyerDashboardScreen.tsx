import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buyerCropService } from "@/services/buyer/buyerCropService";
import { parseStoredUser } from "@/src/utils/authSession";

export default function BuyerDashboardScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [buyerData, setBuyerData] = useState({
    nvcharFullName: "Guest Buyer",
    nvcharEmail: "buyer@agroconnect.com",
    nvcharPhoneNumber: "Add phone number",
    nvcharAddress: "Select Location",
    nvcharProfilePhotoUrl: "",
  });
  const [postedCrops, setPostedCrops] = useState<any[]>([]);
  const [isCropsLoading, setIsCropsLoading] = useState(true);

  useEffect(() => {
    const loadBuyerData = async () => {
      try {
        const user = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));

        if (!user?.id) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "BuyerLogin" }],
            })
          );
          return;
        }

        setBuyerData((prev) => ({
          ...prev,
          nvcharFullName: user.nvcharFullName || prev.nvcharFullName,
          nvcharEmail: user.nvcharEmail || prev.nvcharEmail,
          nvcharPhoneNumber: user.nvcharPhoneNumber || prev.nvcharPhoneNumber,
          nvcharAddress: user.nvcharAddress || prev.nvcharAddress,
          nvcharProfilePhotoUrl: user.nvcharProfilePhotoUrl || prev.nvcharProfilePhotoUrl,
        }));
      } catch (error) {
        console.log("Error loading buyer session", error);
      }
    };

    const loadPostedCrops = async () => {
      setIsCropsLoading(true);
      try {
        const response = await buyerCropService.getCrops();
        const crops = buyerCropService
          .extractCropList(response)
          .filter((crop: any) => crop.nvcharStatus !== "SOLD" && crop.ynDeleted !== true)
          .slice(0, 5);
        setPostedCrops(crops);
      } catch (error) {
        console.log("Error loading posted crops", error);
        setPostedCrops([]);
      } finally {
        setIsCropsLoading(false);
      }
    };

    loadBuyerData();
    loadPostedCrops();
  }, [isFocused, navigation]);

  const firstName = buyerData.nvcharFullName.split(" ")[0] || "Buyer";
  const avatarUri = buyerData.nvcharProfilePhotoUrl?.startsWith("http")
    ? buyerData.nvcharProfilePhotoUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(buyerData.nvcharFullName)}&background=DBEAFE&color=1D4ED8`;

  const QuickActionCard = ({ title, icon, imageSrc, onPress }: any) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="w-[48%] h-36 rounded-2xl overflow-hidden mb-4 relative shadow-sm"
    >
      {imageSrc ? (
        <Image source={{ uri: imageSrc }} className="absolute w-full h-full" resizeMode="cover" />
      ) : (
        <View className="absolute w-full h-full bg-[#0F172A]" />
      )}
      <View className="absolute w-full h-full bg-black/40 p-4 justify-end">
        <MaterialCommunityIcons name={icon} size={24} color="#10B981" className="mb-1" />
        <Text className="text-white font-extrabold text-base leading-tight">{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPostedCropCard = (crop: any) => {
    let imageUrl = buyerCropService.resolveCropImageUrl(crop.nvcharCropImageUrl);
    if (!imageUrl) {
      imageUrl = "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80";
    }

    return (
      <TouchableOpacity
        key={String(crop.id)}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("Browse", {
            screen: "BuyerCropDetails",
            params: { crop },
          })
        }
        className="bg-white rounded-3xl p-4 mb-4 shadow-sm border border-gray-100 flex-row items-center"
      >
        <Image source={{ uri: imageUrl }} className="w-20 h-20 rounded-2xl bg-gray-100" resizeMode="cover" />

        <View className="flex-1 ml-4 justify-center">
          <View className="flex-row justify-between items-start">
            <Text className="text-base font-bold text-[#111827] flex-1 mr-2" numberOfLines={1}>
              {crop.nvcharCropName}
            </Text>
            <Text className="text-[#10B981] font-bold text-sm">
              Rs. {crop.floatPricePerKg}
              <Text className="text-[10px] text-gray-500">/kg</Text>
            </Text>
          </View>

          <Text className="text-[#6B7280] text-xs mt-0.5 mb-2" numberOfLines={1}>
            {crop.nvcharLocation || "Farm location"}
          </Text>

          <View className="flex-row justify-between items-center mt-1">
            <View className="px-2 py-1 rounded-md bg-green-50">
              <Text className="text-[10px] font-bold text-[#10B981]">
                {crop.nvcharStatus || "ACTIVE"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Browse", {
                  screen: "BuyerCropDetails",
                  params: { crop },
                })
              }
              className="bg-[#00E600] w-8 h-8 rounded-full items-center justify-center shadow-sm"
            >
              <MaterialCommunityIcons name="cart-plus" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <View className="flex-row items-center">
            <Image source={{ uri: avatarUri }} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
            <View className="ml-3">
              <Text className="text-[#6B7280] text-xs font-medium">Welcome back,</Text>
              <Text className="text-[#111827] font-extrabold text-base" numberOfLines={1}>
                {firstName}
              </Text>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="map-marker" size={14} color="#10B981" />
                <Text className="text-[#111827] font-bold text-sm ml-1 truncate max-w-[150px]" numberOfLines={1}>
                  {buyerData.nvcharAddress}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
            <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
            <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-white" />
          </TouchableOpacity>
        </View>

        <View className="px-6 mt-6 mb-6">
          <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 h-14 shadow-sm">
            <MaterialCommunityIcons name="magnify" size={24} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-[#111827]"
              placeholder="Search for fresh crops, seeds..."
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View className="px-6 mb-2">
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-xl font-bold text-[#111827]">Quick Actions</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Browse")}>
              <Text className="text-[#10B981] font-bold text-xs uppercase tracking-wider">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between">
            <QuickActionCard
              title={"Browse\nCrops"}
              icon="sprout"
            //   imageSrc="https://images.unsplash.com/photo-1628102491629-77858ab215b2?auto=format&fit=crop&w=400&q=80"
              onPress={() => navigation.navigate("Browse")}
            />
            <QuickActionCard
              title={"Nearby\nFarmers"}
              icon="account-group"
            //   imageSrc="https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&w=400&q=80"
            />
            <QuickActionCard
              title={"My\nOrders"}
              icon="receipt"
            //   imageSrc="https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80"
              onPress={() => navigation.navigate("Orders")}
            />
            <QuickActionCard
              title={"Farmer\nMessages"}
              icon="message-processing"
            //   imageSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80"
            />
          </View>
        </View>

        <View className="px-6 mt-4">
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-xl font-bold text-[#111827]">Farmer Posted Crops</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Browse")}>
              <Text className="text-[#10B981] font-bold text-xs uppercase tracking-wider">Marketplace</Text>
            </TouchableOpacity>
          </View>

          {isCropsLoading ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator size="large" color="#10B981" />
            </View>
          ) : postedCrops.length === 0 ? (
            <View className="bg-white rounded-3xl p-6 border border-gray-100 items-center">
              <MaterialCommunityIcons name="sprout-outline" size={44} color="#D1D5DB" />
              <Text className="text-[#6B7280] font-bold mt-3">No farmer posted crops yet.</Text>
            </View>
          ) : (
            postedCrops.map(renderPostedCropCard)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
