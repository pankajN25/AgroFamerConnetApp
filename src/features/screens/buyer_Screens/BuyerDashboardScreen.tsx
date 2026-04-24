import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buyerCropService } from "@/services/buyer/buyerCropService";
import { buyerAuthService } from "@/services/buyer/buyerAuthService";
import { parseStoredUser } from "@/src/utils/authSession";

export default function BuyerDashboardScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [buyerData, setBuyerData] = useState<any>(null);
  const [crops, setCrops] = useState<any[]>([]);
  const [isCropsLoading, setIsCropsLoading] = useState(true);

  useEffect(() => {
    const loadBuyerData = async () => {
      try {
        const user = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));
        if (!user?.id) {
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "BuyerLogin" }] }));
          return;
        }
        setBuyerData(user);
      } catch (e) {
        console.log("Error loading buyer session", e);
      }
    };

    const loadCrops = async () => {
      setIsCropsLoading(true);
      try {
        const response = await buyerCropService.getCrops();
        const list = buyerCropService
          .extractCropList(response)
          .filter((c: any) => c.nvcharStatus !== "SOLD" && !c.ynDeleted)
          .slice(0, 6);
        setCrops(list);
      } catch (e) {
        setCrops([]);
      } finally {
        setIsCropsLoading(false);
      }
    };

    loadBuyerData();
    loadCrops();
  }, [isFocused, navigation]);

  const firstName = buyerData?.nvcharFullName?.split(" ")[0] || "Buyer";
  const rawProfilePhoto = buyerData?.nvcharProfilePhotoUrl || "";
  const isLocalPhoto = rawProfilePhoto.startsWith("file:") || rawProfilePhoto.startsWith("content:");
  const resolvedProfilePhoto = isLocalPhoto
    ? rawProfilePhoto
    : buyerAuthService.resolveProfileImageUrl(rawProfilePhoto);
  const resolvedAvatarUrl = buyerAuthService.resolveProfileImageUrl(buyerData?.avatarUrl || "");

  const avatarUri = resolvedProfilePhoto ||
    resolvedAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(buyerData?.nvcharFullName || "B")}&background=3B82F6&color=ffffff&size=128`;

  const goToMarketplaceHome = () =>
    navigation.navigate("Browse", { screen: "BuyerMarketplaceHome" });

  const goToCropDetails = (crop: any) =>
    navigation.navigate("Browse", { screen: "BuyerCropDetails", params: { crop } });

  const quickActions = [
    { icon: "sprout", label: "Browse Crops", color: "#10B981", bg: "#ECFDF5", onPress: goToMarketplaceHome },
    { icon: "receipt-text-outline", label: "My Orders", color: "#3B82F6", bg: "#EFF6FF", onPress: () => navigation.navigate("Orders") },
    { icon: "account-group-outline", label: "Farmers", color: "#8B5CF6", bg: "#F5F3FF", onPress: goToMarketplaceHome },
    { icon: "chat-processing-outline", label: "Messages", color: "#1D4ED8", bg: "#EFF6FF", onPress: () => navigation.navigate("Messages") },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F4F7FB]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>

        {/* ── Header ── */}
        <View className="px-5 pt-5 pb-4 bg-white">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Image
                source={{ uri: avatarUri }}
                className="w-12 h-12 rounded-full"
                style={{ borderWidth: 2, borderColor: "#DBEAFE" }}
              />
              <View className="ml-3 flex-1">
                <Text className="text-[#6B7280] text-xs font-medium">Good day,</Text>
                <Text className="text-[#111827] font-extrabold text-lg leading-tight" numberOfLines={1}>
                  {firstName} 👋
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "#F3F4F6" }}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color="#374151" />
              <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero Banner ── */}
        <View className="mx-5 mt-5 rounded-2xl overflow-hidden" style={{ backgroundColor: "#1D4ED8" }}>
          <View className="p-5">
            <Text className="text-white text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">
              Fresh from the Farm
            </Text>
            <Text className="text-white text-xl font-extrabold leading-snug mb-3">
              Buy directly from{"\n"}local farmers
            </Text>
            <TouchableOpacity
              onPress={goToMarketplaceHome}
              className="self-start flex-row items-center rounded-xl px-4 py-2.5"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <Text className="text-white font-bold text-sm mr-1">Shop Now</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <View className="absolute right-4 bottom-0 opacity-20">
            <MaterialCommunityIcons name="leaf" size={100} color="white" />
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View className="px-5 mt-6">
          <Text className="text-[#111827] font-extrabold text-base mb-3">Quick Actions</Text>
          <View className="flex-row justify-between">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={action.onPress}
                activeOpacity={0.7}
                className="items-center"
                style={{ width: "22%" }}
              >
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                  style={{ backgroundColor: action.bg }}
                >
                  <MaterialCommunityIcons name={action.icon as any} size={26} color={action.color} />
                </View>
                <Text className="text-[#374151] text-xs font-semibold text-center leading-tight">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View className="px-5 mt-6 flex-row gap-3">
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#DBEAFE" }}
          >
            <MaterialCommunityIcons name="basket-outline" size={22} color="#3B82F6" />
            <Text className="text-2xl font-extrabold text-[#1D4ED8] mt-1">0</Text>
            <Text className="text-xs font-semibold text-[#6B7280] mt-0.5">Total Orders</Text>
          </View>
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#BBF7D0" }}
          >
            <MaterialCommunityIcons name="sprout-outline" size={22} color="#10B981" />
            <Text className="text-2xl font-extrabold text-[#065F46] mt-1">{crops.length}</Text>
            <Text className="text-xs font-semibold text-[#6B7280] mt-0.5">Available Crops</Text>
          </View>
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA" }}
          >
            <MaterialCommunityIcons name="star-outline" size={22} color="#F59E0B" />
            <Text className="text-2xl font-extrabold text-[#92400E] mt-1">4.8</Text>
            <Text className="text-xs font-semibold text-[#6B7280] mt-0.5">Avg Rating</Text>
          </View>
        </View>

        {/* ── Fresh Crops ── */}
        <View className="mt-6 px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[#111827] font-extrabold text-base">Fresh Crops Available</Text>
            <TouchableOpacity onPress={goToMarketplaceHome}>
              <Text className="text-[#3B82F6] text-xs font-bold">See All</Text>
            </TouchableOpacity>
          </View>

          {isCropsLoading ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : crops.length === 0 ? (
            <View
              className="rounded-2xl p-8 items-center"
              style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#F3F4F6" }}
            >
              <MaterialCommunityIcons name="sprout-outline" size={44} color="#D1D5DB" />
              <Text className="text-[#9CA3AF] font-semibold mt-3 text-sm">No crops listed yet.</Text>
            </View>
          ) : (
            crops.map((crop) => {
              const imageUrl =
                buyerCropService.resolveCropImageUrl(crop.nvcharCropImageUrl) ||
                "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=300&q=80";
              return (
                <TouchableOpacity
                  key={String(crop.id)}
                  activeOpacity={0.8}
                  onPress={() => goToCropDetails(crop)}
                  className="bg-white rounded-2xl mb-3 overflow-hidden flex-row"
                  style={{ borderWidth: 1, borderColor: "#F3F4F6" }}
                >
                  <Image source={{ uri: imageUrl }} className="w-24 h-24" resizeMode="cover" />
                  <View className="flex-1 p-3 justify-between">
                    <View>
                      <Text className="text-[#111827] font-bold text-base" numberOfLines={1}>
                        {crop.nvcharCropName}
                      </Text>
                      <View className="flex-row items-center mt-0.5">
                        <MaterialCommunityIcons name="map-marker-outline" size={12} color="#9CA3AF" />
                        <Text className="text-[#9CA3AF] text-xs ml-1" numberOfLines={1}>
                          {crop.nvcharLocation || "Farm location"}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between mt-1">
                      <Text className="text-[#10B981] font-extrabold text-base">
                        ₹{crop.floatPricePerKg}
                        <Text className="text-[#9CA3AF] text-xs font-normal">/kg</Text>
                      </Text>
                      <TouchableOpacity
                        onPress={() => goToCropDetails(crop)}
                        className="flex-row items-center rounded-lg px-3 py-1.5"
                        style={{ backgroundColor: "#EFF6FF" }}
                      >
                        <MaterialCommunityIcons name="cart-outline" size={14} color="#3B82F6" />
                        <Text className="text-[#3B82F6] text-xs font-bold ml-1">Buy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
