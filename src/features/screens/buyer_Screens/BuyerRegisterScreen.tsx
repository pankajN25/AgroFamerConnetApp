// src/features/auth/screens/BuyerRegisterScreen.tsx
import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Image,
  KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { buyerAuthService, BuyerRegisterPayload } from "@/services/buyer/buyerAuthService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeStoredUser } from "@/src/utils/authSession";
import * as ImagePicker from "expo-image-picker";

export default function BuyerRegisterScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const prefillPhone = route.params?.prefillPhone || "";
  const phoneVerified = Boolean(route.params?.phoneVerified);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const BUYER_ACCOUNTS_STORAGE_KEY = "@buyer_accounts";

  const [formData, setFormData] = useState({
    nvcharFullName: "",
    nvcharEmail: "",
    nvcharPhoneNumber: "",
    nvcharPassword: "",
    confirmPassword: "",
    nvcharAddress: "",
    cityName: "",
    stateName: "",
    countryName: "",
  });

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  React.useEffect(() => {
    if (prefillPhone) {
      setFormData((prev) => ({ ...prev, nvcharPhoneNumber: prefillPhone }));
    }
  }, [prefillPhone]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!formData.nvcharFullName.trim()) {
      Alert.alert("Validation Error", "Buyer full name is required");
      return;
    }

    if (!formData.nvcharEmail.trim()) {
      Alert.alert("Validation Error", "Buyer email is required");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.nvcharEmail.trim())) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }

    if (formData.nvcharPhoneNumber.trim().length < 10) {
      Alert.alert("Validation Error", "Please enter a valid phone number");
      return;
    }

    if (formData.nvcharPassword.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters long");
      return;
    }

    if (formData.nvcharPassword !== formData.confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return;
    }

    if (!formData.nvcharAddress.trim()) {
      Alert.alert("Validation Error", "Delivery address is required");
      return;
    }

    if (!formData.countryName.trim() || !formData.stateName.trim() || !formData.cityName.trim()) {
      Alert.alert("Validation Error", "Country, state, and city are required");
      return;
    }

    setIsLoading(true);

    try {
      const payload: BuyerRegisterPayload = {
        nvcharFullName: formData.nvcharFullName.trim(),
        nvcharEmail: formData.nvcharEmail.trim().toLowerCase(),
        nvcharPhoneNumber: formData.nvcharPhoneNumber.trim(),
        nvcharPassword: formData.nvcharPassword,
        nvcharAddress: formData.nvcharAddress.trim(),
        nvcharCity: formData.cityName.trim(),
        nvcharState: formData.stateName.trim(),
        nvcharCountry: formData.countryName.trim(),
        nvcharProfilePhotoUrl: "",
        ynPhoneVerified: phoneVerified
      };

      console.log("Sending Buyer Registration Payload:", payload);

      const response = await buyerAuthService.registerBuyer(payload);
      console.log("Buyer Registration API Response:", response);

      const registeredData = response?.data ?? response ?? {};
      const buyerId = registeredData?.id ?? registeredData?.intBuyerId ?? null;

      let finalImageUrl = "";
      if (profileImageUri && buyerId) {
        try {
          const imageRes = await buyerAuthService.uploadBuyerProfilePhoto(profileImageUri, buyerId);
          finalImageUrl = buyerAuthService.extractProfileImageUrl(imageRes);
          if (finalImageUrl) {
            await buyerAuthService.editBuyer({
              id: buyerId,
              nvcharProfilePhotoUrl: finalImageUrl,
            });
          }
        } catch (uploadError) {
          console.log("Buyer profile upload failed", uploadError);
        }
      }

      const registeredBuyer = normalizeStoredUser({
        ...registeredData,
        ...payload,
        id: buyerId ?? registeredData?.id ?? null,
        nvcharProfilePhotoUrl: finalImageUrl || payload.nvcharProfilePhotoUrl,
        cityName: formData.cityName.trim(),
        stateName: formData.stateName.trim(),
        countryName: formData.countryName.trim(),
        avatarUrl: finalImageUrl,
      });

      const existingAccountsStr = await AsyncStorage.getItem(BUYER_ACCOUNTS_STORAGE_KEY);
      const existingAccounts = existingAccountsStr ? JSON.parse(existingAccountsStr) : [];
      const filteredAccounts = Array.isArray(existingAccounts)
        ? existingAccounts.filter(
            (account: any) =>
              String(account?.nvcharEmail || "").toLowerCase() !==
              formData.nvcharEmail.trim().toLowerCase()
          )
        : [];

      await AsyncStorage.setItem(
        BUYER_ACCOUNTS_STORAGE_KEY,
        JSON.stringify([...filteredAccounts, registeredBuyer])
      );

      if (registeredBuyer?.id) {
        await AsyncStorage.setItem("@buyer_user", JSON.stringify(registeredBuyer));
      }

      Alert.alert("Success", "Buyer account created successfully!");

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: registeredBuyer?.id ? "BuyerTabs" : "BuyerLogin" }],
        })
      );

    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail?.[0]?.msg ||
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Could not create account. Please try again.";

      Alert.alert("Registration Failed", errorMessage);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F0F9FF]">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View className="flex-row items-center mb-6 pt-2">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-xl font-bold text-[#111827] pr-10">
              Create Buyer Account
            </Text>
          </View>

          {/* ── Profile Photo + Hero ── */}
          <View className="items-center mb-7">
            <TouchableOpacity
              onPress={pickImage}
              className="w-24 h-24 rounded-full border-2 border-dashed border-[#3B82F6] items-center justify-center bg-blue-50 overflow-hidden mb-3"
            >
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} className="w-full h-full" />
              ) : (
                <>
                  <MaterialCommunityIcons name="camera-plus" size={30} color="#3B82F6" />
                  <Text className="text-[#3B82F6] text-xs font-bold mt-1">PHOTO</Text>
                </>
              )}
            </TouchableOpacity>
            <Text className="text-2xl font-extrabold text-[#111827] mb-1">Join the Marketplace</Text>
            <Text className="text-[#6B7280] text-sm text-center px-4">Connect directly with farmers for fresh produce</Text>
            <Text className="text-[#9CA3AF] text-xs mt-2">Profile Photo (Optional)</Text>
          </View>

          {/* ── Section: Account Info ── */}
          <View className="bg-white rounded-2xl p-4 mb-4" style={{ elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Text className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider mb-4">Account Information</Text>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Full Name / Company Name <Text className="text-red-500">*</Text></Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14">
                <MaterialCommunityIcons name="account-outline" size={20} color="#9CA3AF" />
                <TextInput className="flex-1 ml-3 text-base text-[#111827]" placeholder="e.g. FreshMart Supermarkets" placeholderTextColor="#9CA3AF" value={formData.nvcharFullName} onChangeText={(t) => updateField('nvcharFullName', t)} />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Email Address <Text className="text-red-500">*</Text></Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14">
                <MaterialCommunityIcons name="email-outline" size={20} color="#9CA3AF" />
                <TextInput className="flex-1 ml-3 text-base text-[#111827]" placeholder="e.g. buyer@freshmart.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" value={formData.nvcharEmail} onChangeText={(t) => updateField('nvcharEmail', t)} />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Phone Number <Text className="text-red-500">*</Text></Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14">
                <MaterialCommunityIcons name="phone-outline" size={20} color="#9CA3AF" />
                <TextInput className="flex-1 ml-3 text-base text-[#111827]" placeholder="+91 00000 00000" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" value={formData.nvcharPhoneNumber} onChangeText={(t) => updateField('nvcharPhoneNumber', t)} />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Password <Text className="text-red-500">*</Text></Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14">
                <MaterialCommunityIcons name="lock-outline" size={20} color="#9CA3AF" />
                <TextInput className="flex-1 ml-3 text-base text-[#111827]" placeholder="Create a password (min 6 chars)" placeholderTextColor="#9CA3AF" secureTextEntry={!showPassword} value={formData.nvcharPassword} onChangeText={(t) => updateField('nvcharPassword', t)} />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} className="p-1">
                  <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-1">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Confirm Password <Text className="text-red-500">*</Text></Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14">
                <MaterialCommunityIcons name="lock-check-outline" size={20} color="#9CA3AF" />
                <TextInput className="flex-1 ml-3 text-base text-[#111827]" placeholder="Re-enter your password" placeholderTextColor="#9CA3AF" secureTextEntry={!showConfirmPassword} value={formData.confirmPassword} onChangeText={(t) => updateField('confirmPassword', t)} />
                <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} className="p-1">
                  <MaterialCommunityIcons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Section: Address & Location ── */}
          <View className="bg-white rounded-2xl p-4 mb-6" style={{ elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Text className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider mb-4">Delivery Location</Text>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Delivery Address <Text className="text-red-500">*</Text></Text>
              <View className="flex-row items-start bg-white border border-gray-200 rounded-xl px-4 py-3">
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#9CA3AF" style={{ marginTop: 2 }} />
                <TextInput className="flex-1 ml-3 text-base text-[#111827]" placeholder="Enter your primary delivery address" placeholderTextColor="#9CA3AF" multiline numberOfLines={2} textAlignVertical="top" value={formData.nvcharAddress} onChangeText={(t) => updateField('nvcharAddress', t)} />
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#374151] mb-2">Country <Text className="text-red-500">*</Text></Text>
                <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 h-12">
                  <MaterialCommunityIcons name="earth" size={18} color="#9CA3AF" />
                  <TextInput className="flex-1 ml-2 text-sm text-[#111827]" placeholder="e.g. India" placeholderTextColor="#9CA3AF" value={formData.countryName} onChangeText={(t) => updateField('countryName', t)} />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#374151] mb-2">State <Text className="text-red-500">*</Text></Text>
                <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 h-12">
                  <MaterialCommunityIcons name="map-outline" size={18} color="#9CA3AF" />
                  <TextInput className="flex-1 ml-2 text-sm text-[#111827]" placeholder="e.g. Maharashtra" placeholderTextColor="#9CA3AF" value={formData.stateName} onChangeText={(t) => updateField('stateName', t)} />
                </View>
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-[#374151] mb-2">City <Text className="text-red-500">*</Text></Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-12">
                <MaterialCommunityIcons name="city-variant-outline" size={18} color="#9CA3AF" />
                <TextInput className="flex-1 ml-3 text-sm text-[#111827]" placeholder="e.g. Pune" placeholderTextColor="#9CA3AF" value={formData.cityName} onChangeText={(t) => updateField('cityName', t)} />
              </View>
            </View>
          </View>

          {/* ── Register Button ── */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            className="flex-row justify-center items-center h-14 rounded-xl mb-5"
            style={{ backgroundColor: isLoading ? "#93C5FD" : "#3B82F6" }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white text-base font-bold mr-2">Create Buyer Account</Text>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          {/* ── Login Link ── */}
          <View className="flex-row justify-center pb-6">
            <Text className="text-[#6B7280] text-base">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("BuyerLogin" as never)}>
              <Text className="text-[#3B82F6] text-base font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
