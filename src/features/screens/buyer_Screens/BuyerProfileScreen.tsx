import React, { useEffect, useState } from "react";
import { Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { CommonActions, useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { parseStoredUser } from "@/src/utils/authSession";

export default function BuyerProfileScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [buyerData, setBuyerData] = useState({
    nvcharFullName: "Guest Buyer",
    nvcharEmail: "buyer@agroconnect.com",
    nvcharPhoneNumber: "Not added",
    nvcharAddress: "No address available",
    nvcharProfilePhotoUrl: "",
  });

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
        console.log("Error loading buyer profile", error);
      }
    };

    loadBuyerData();
  }, [isFocused, navigation]);

  const avatarUri =
    buyerData.nvcharProfilePhotoUrl?.startsWith("http")
      ? buyerData.nvcharProfilePhotoUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(buyerData.nvcharFullName)}&background=DBEAFE&color=1D4ED8`;

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("@buyer_user");
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "RoleSelection" }],
            })
          );
        },
      },
    ]);
  };

  // --- REUSABLE MENU ITEM COMPONENT ---
  const renderMenuItem = (icon: string, title: string, subtitle?: string, onPress?: () => void, color = "#111827") => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center justify-between p-4 bg-white border-b border-gray-50"
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
          <MaterialCommunityIcons name={icon as any} size={22} color={color === "#111827" ? "#3B82F6" : color} />
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
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      
      {/* ---------------- HEADER ---------------- */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2 bg-[#F8FAFC]">
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
        <Text className="text-2xl font-extrabold text-[#111827]">Profile</Text>
        <TouchableOpacity className="p-2 -mr-2">
          <MaterialCommunityIcons name="bell-outline" size={26} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        
        {/* ---------------- MAIN PROFILE CARD ---------------- */}
        <View className="bg-white mx-6 mt-4 rounded-3xl p-6 shadow-sm border border-blue-50 items-center relative overflow-hidden">
          {/* Subtle background decoration */}
          <View className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full opacity-50" />
          
          <View className="relative mb-4">
            <Image source={{ uri: avatarUri }} className="w-24 h-24 rounded-full border-4 border-blue-50" />
            <TouchableOpacity className="absolute bottom-0 right-0 bg-[#3B82F6] w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-sm">
              <MaterialCommunityIcons name="pencil" size={14} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-extrabold text-[#111827] text-center mb-1">
            {buyerData.nvcharFullName}
          </Text>
          <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-lg mb-6 border border-blue-100">
            <MaterialCommunityIcons name="storefront" size={16} color="#3B82F6" />
            <Text className="text-[#3B82F6] font-bold text-xs ml-1 uppercase tracking-wider">Premium Buyer</Text>
          </View>

          {/* Quick Stats Grid */}
          <View className="flex-row justify-between w-full border-t border-gray-100 pt-5">
            <View className="items-center flex-1 border-r border-gray-100">
              <Text className="text-2xl font-extrabold text-[#111827]">12</Text>
              <Text className="text-xs font-semibold text-[#9CA3AF] mt-1">Total Orders</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-extrabold text-[#111827]">3</Text>
              <Text className="text-xs font-semibold text-[#9CA3AF] mt-1">Saved Farmers</Text>
            </View>
          </View>
        </View>

        {/* ---------------- PERSONAL INFORMATION ---------------- */}
        <View className="mt-6 px-6">
          <Text className="text-xs font-extrabold text-[#9CA3AF] uppercase tracking-wider mb-2 ml-2">Contact Details</Text>
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6 px-4 py-2">
            
            <View className="flex-row items-center py-4 border-b border-gray-50">
              <MaterialCommunityIcons name="email-outline" size={22} color="#9CA3AF" />
              <View className="ml-4 flex-1">
                <Text className="text-xs text-[#9CA3AF] font-semibold">Email Address</Text>
                <Text className="text-[#111827] text-base font-medium mt-0.5">{buyerData.nvcharEmail}</Text>
              </View>
            </View>

            <View className="flex-row items-center py-4 border-b border-gray-50">
              <MaterialCommunityIcons name="phone-outline" size={22} color="#9CA3AF" />
              <View className="ml-4 flex-1">
                <Text className="text-xs text-[#9CA3AF] font-semibold">Phone Number</Text>
                <Text className="text-[#111827] text-base font-medium mt-0.5">{buyerData.nvcharPhoneNumber}</Text>
              </View>
            </View>

            <View className="flex-row items-center py-4">
              <MaterialCommunityIcons name="map-marker-outline" size={22} color="#9CA3AF" />
              <View className="ml-4 flex-1">
                <Text className="text-xs text-[#9CA3AF] font-semibold">Delivery Address</Text>
                <Text className="text-[#111827] text-base font-medium mt-0.5 leading-snug">{buyerData.nvcharAddress}</Text>
              </View>
            </View>

          </View>

          {/* ---------------- SETTINGS & SUPPORT ---------------- */}
          <Text className="text-xs font-extrabold text-[#9CA3AF] uppercase tracking-wider mb-2 ml-2">Preferences</Text>
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6">
            {renderMenuItem("credit-card-outline", "Payment Methods", "Manage saved cards")}
            {renderMenuItem("bell-outline", "Notifications", "Alerts for new crops")}
            {renderMenuItem("shield-check-outline", "Privacy & Security", "Password and permissions")}
          </View>

          <Text className="text-xs font-extrabold text-[#9CA3AF] uppercase tracking-wider mb-2 ml-2">Support</Text>
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6">
            {renderMenuItem("help-circle-outline", "Help Center", "FAQs and troubleshooting")}
            
            {/* LOGOUT BUTTON */}
            {renderMenuItem("logout-variant", "Log Out", "Sign out of this device", handleLogout, "#EF4444")}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
