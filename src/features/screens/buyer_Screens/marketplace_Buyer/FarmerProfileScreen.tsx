import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { buyerAuthService } from "@/services/buyer/buyerAuthService";
import { buyerCropService } from "@/services/buyer/buyerCropService";

const FALLBACK_AVATAR = "https://ui-avatars.com/api/?name=Farmer&background=DCFCE7&color=166534&size=160";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80";

const normalizePhone = (value?: string | null) => {
  if (!value) return "";
  return String(value).replace(/\D/g, "");
};

const formatWhatsAppNumber = (value?: string | null) => {
  const digits = normalizePhone(value);
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
};

export default function FarmerProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const farmerId = route.params?.farmerId || route.params?.farmer?.id;
  const initialFarmer = route.params?.farmer || null;

  const [farmer, setFarmer] = useState<any>(initialFarmer);
  const [crops, setCrops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!farmerId) {
        setIsLoading(false);
        return;
      }
      try {
        const farmerRes = await buyerAuthService.getFarmerById(Number(farmerId));
        if (farmerRes?.data) setFarmer(farmerRes.data);

        const cropRes = await buyerCropService.getCrops();
        const list = buyerCropService.extractCropList(cropRes);
        const filtered = list.filter((c: any) => Number(c.intFarmerId) === Number(farmerId));
        setCrops(filtered);
      } catch (e) {
        console.log("Error loading farmer profile", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [farmerId]);

  const profileImage =
    buyerAuthService.resolveProfileImageUrl(farmer?.nvcharProfilePhotoUrl) || FALLBACK_AVATAR;

  const isVerified = Boolean(
    farmer?.ynPhoneVerified ?? farmer?.ynVerified ?? farmer?.ynIsVerified ?? farmer?.isVerified
  );

  const location = useMemo(() => {
    const parts = [
      farmer?.nvcharAddress,
      farmer?.nvcharCity,
      farmer?.nvcharState,
      farmer?.nvcharCountry,
    ].filter(Boolean);
    return parts.join(", ");
  }, [farmer]);

  const ratingValue = Number(
    farmer?.floatRating ?? farmer?.decRating ?? farmer?.rating ?? NaN
  );
  const hasRating = Number.isFinite(ratingValue);

  const phoneRaw = farmer?.nvcharPhoneNumber || farmer?.nvcharMobileNumber || "";
  const phoneHidden = farmer?.ynHidePhoneNumber === true || farmer?.ynShowPhoneNumber === false;
  const phoneVisible = Boolean(phoneRaw) && !phoneHidden;

  const handleCall = () => {
    if (!phoneVisible) return;
    const digits = normalizePhone(phoneRaw);
    if (!digits) return;
    Linking.openURL(`tel:${digits}`);
  };

  const handleWhatsApp = () => {
    if (!phoneVisible) return;
    const wa = formatWhatsAppNumber(phoneRaw);
    if (!wa) return;
    Linking.openURL(`https://wa.me/${wa}`);
  };

  const handleMessage = () => {
    navigation.navigate("BuyerChat", {
      counterpartyId: farmerId,
      counterpartyName: farmer?.nvcharFullName || `Farmer #${farmerId}`,
      counterpartyAvatar: profileImage,
      currentUserType: "buyer",
    });
  };

  if (!farmerId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-[#6B7280]">Farmer not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F4F7FB]">
      {/* Header */}
      <View className="bg-white flex-row items-center px-4 py-4" style={{ borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1 mr-3">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-[#111827] flex-1">Farmer Profile</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
          <Text className="text-[#9CA3AF] text-sm mt-3 font-semibold">Loading profile...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Profile Card */}
          <View className="mx-5 mt-5 bg-white rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#F3F4F6" }}>
            <View className="flex-row items-center">
              <Image source={{ uri: profileImage }} className="w-20 h-20 rounded-full" />
              <View className="flex-1 ml-4">
                <View className="flex-row items-center">
                  <Text className="text-[#111827] font-extrabold text-lg flex-1" numberOfLines={1}>
                    {farmer?.nvcharFullName || `Farmer #${farmerId}`}
                  </Text>
                  <View
                    className="px-2 py-1 rounded-lg"
                    style={{ backgroundColor: isVerified ? "#ECFDF5" : "#F3F4F6" }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: isVerified ? "#10B981" : "#6B7280" }}
                    >
                      {isVerified ? "Verified" : "Not Verified"}
                    </Text>
                  </View>
                </View>
                {location ? (
                  <View className="flex-row items-center mt-1">
                    <MaterialCommunityIcons name="map-marker-outline" size={14} color="#9CA3AF" />
                    <Text className="text-[#9CA3AF] text-xs ml-1" numberOfLines={1}>
                      {location}
                    </Text>
                  </View>
                ) : null}
                {hasRating ? (
                  <View className="flex-row items-center mt-1">
                    <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                    <Text className="text-[#6B7280] text-xs ml-1">
                      {ratingValue.toFixed(1)} rating
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Contact</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="phone-outline" size={16} color="#9CA3AF" />
                  <Text className="text-[#6B7280] text-sm ml-2">
                    {phoneVisible ? phoneRaw : "Phone hidden by farmer"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity
                onPress={handleCall}
                disabled={!phoneVisible}
                className="flex-1 py-2.5 rounded-xl items-center"
                style={{
                  backgroundColor: phoneVisible ? "#ECFDF5" : "#F3F4F6",
                  borderWidth: 1,
                  borderColor: phoneVisible ? "#BBF7D0" : "#E5E7EB",
                }}
              >
                <Text className="text-xs font-bold" style={{ color: phoneVisible ? "#10B981" : "#9CA3AF" }}>
                  Call Farmer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleWhatsApp}
                disabled={!phoneVisible}
                className="flex-1 py-2.5 rounded-xl items-center"
                style={{
                  backgroundColor: phoneVisible ? "#DCFCE7" : "#F3F4F6",
                  borderWidth: 1,
                  borderColor: phoneVisible ? "#86EFAC" : "#E5E7EB",
                }}
              >
                <Text className="text-xs font-bold" style={{ color: phoneVisible ? "#16A34A" : "#9CA3AF" }}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleMessage}
                className="flex-1 py-2.5 rounded-xl items-center"
                style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" }}
              >
                <Text className="text-xs font-bold text-[#2563EB]">Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Farmer Listings */}
          <View className="mx-5 mt-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-extrabold text-[#111827]">Other Listings</Text>
              <Text className="text-xs text-[#9CA3AF]">{crops.length} items</Text>
            </View>

            {crops.length === 0 ? (
              <View className="bg-white rounded-2xl p-5 items-center" style={{ borderWidth: 1, borderColor: "#F3F4F6" }}>
                <MaterialCommunityIcons name="sprout-outline" size={32} color="#D1D5DB" />
                <Text className="text-[#9CA3AF] text-sm mt-2">No other crops listed yet.</Text>
              </View>
            ) : (
              <View className="gap-3">
                {crops.map((item: any) => {
                  const cropImage =
                    buyerCropService.resolveCropImageUrl(item.nvcharCropImageUrl) || FALLBACK_IMAGE;
                  return (
                    <TouchableOpacity
                      key={String(item.id)}
                      onPress={() => navigation.navigate("BuyerCropDetails", { crop: item })}
                      activeOpacity={0.85}
                      className="bg-white rounded-2xl p-3 flex-row items-center"
                      style={{ borderWidth: 1, borderColor: "#F3F4F6" }}
                    >
                      <Image source={{ uri: cropImage }} className="w-16 h-16 rounded-xl" />
                      <View className="flex-1 ml-3">
                        <Text className="text-[#111827] font-bold text-base" numberOfLines={1}>
                          {item.nvcharCropName}
                        </Text>
                        <Text className="text-[#9CA3AF] text-xs mt-1">
                          {item.floatQuantity} kg available
                        </Text>
                      </View>
                      <Text className="text-[#16A34A] font-extrabold text-base">Rs {item.floatPricePerKg}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
