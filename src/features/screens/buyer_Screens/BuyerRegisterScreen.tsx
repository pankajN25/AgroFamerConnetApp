// src/features/auth/screens/BuyerRegisterScreen.tsx
import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, SafeAreaView, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator 
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { buyerAuthService, BuyerRegisterPayload } from "@/services/buyer/buyerAuthService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeStoredUser } from "@/src/utils/authSession";

export default function BuyerRegisterScreen() {
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nvcharFullName: "",
    nvcharEmail: "",
    nvcharPhoneNumber: "",
    nvcharPassword: "",
    confirmPassword: "",
    nvcharAddress: "",
    intCityId: "",
    intstateId: "",
    intcountryId: "",
  });

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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

    if (formData.nvcharPassword.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters long");
      return;
    }

    if (formData.nvcharPassword !== formData.confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
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
        intCityId: parseInt(formData.intCityId) || 0,
        intstateId: parseInt(formData.intstateId) || 0,
        intcountryId: parseInt(formData.intcountryId) || 0,
        nvcharProfilePhotoUrl: "default_buyer.png",
        ynPhoneVerified: false
      };

      console.log("Sending Buyer Registration Payload:", payload);

      const response = await buyerAuthService.registerBuyer(payload);
      console.log("Buyer Registration API Response:", response);

      const registeredBuyer = normalizeStoredUser({
        ...(response?.data ?? response ?? {}),
        ...payload,
      });

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
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Could not create account. Please try again.";

      Alert.alert("Registration Failed", errorMessage);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F0F9FF]"> {/* Light blue background */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          
          {/* ---------------- HEADER ---------------- */}
          <View className="flex-row items-center px-6 pt-4 pb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
              <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-lg font-bold text-[#111827] pr-8">
              Create Buyer Account
            </Text>
          </View>

          {/* ---------------- FORM CONTAINER ---------------- */}
          <View className="flex-1 bg-white mx-4 mt-2 rounded-3xl p-6 shadow-sm mb-6">
            
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
                <MaterialCommunityIcons name="storefront" size={32} color="#3B82F6" />
              </View>
              <Text className="text-2xl font-extrabold text-[#111827] mb-2">Join the Marketplace</Text>
              <Text className="text-[#6B7280] text-sm text-center">Connect directly with farmers to source the freshest produce.</Text>
            </View>

            {/* FULL NAME */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Full Name / Company Name <Text className="text-red-500">*</Text></Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14 focus:border-[#3B82F6]">
                <MaterialCommunityIcons name="account-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#111827]"
                  placeholder="e.g. FreshMart Supermarkets"
                  placeholderTextColor="#9CA3AF"
                  value={formData.nvcharFullName}
                  onChangeText={(t) => updateField('nvcharFullName', t)}
                />
              </View>
            </View>

            {/* EMAIL */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Email Address <Text className="text-red-500">*</Text></Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14 focus:border-[#3B82F6]">
                <MaterialCommunityIcons name="email-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#111827]"
                  placeholder="e.g. buyer@freshmart.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.nvcharEmail}
                  onChangeText={(t) => updateField('nvcharEmail', t)}
                />
              </View>
            </View>

            {/* PHONE NUMBER */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Phone Number</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14 focus:border-[#3B82F6]">
                <MaterialCommunityIcons name="phone-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#111827]"
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={formData.nvcharPhoneNumber}
                  onChangeText={(t) => updateField('nvcharPhoneNumber', t)}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Password <Text className="text-red-500">*</Text></Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14 focus:border-[#3B82F6]">
                <MaterialCommunityIcons name="lock-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#111827]"
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={formData.nvcharPassword}
                  onChangeText={(t) => updateField('nvcharPassword', t)}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Confirm Password <Text className="text-red-500">*</Text></Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14 focus:border-[#3B82F6]">
                <MaterialCommunityIcons name="lock-check-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#111827]"
                  placeholder="Re-enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={formData.confirmPassword}
                  onChangeText={(t) => updateField('confirmPassword', t)}
                />
              </View>
            </View>

            {/* ADDRESS */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Delivery Address</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#3B82F6]">
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#111827]"
                  placeholder="Enter your primary delivery address"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                  value={formData.nvcharAddress}
                  onChangeText={(t) => updateField('nvcharAddress', t)}
                />
              </View>
            </View>

            {/* LOCATION IDs (Placeholder for future Dropdowns) */}
            <View className="flex-row space-x-3 mb-8">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#374151] mb-2">City ID</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 h-12 text-[#111827]"
                  placeholder="e.g. 1"
                  keyboardType="numeric"
                  value={formData.intCityId}
                  onChangeText={(t) => updateField('intCityId', t)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#374151] mb-2">State ID</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 h-12 text-[#111827]"
                  placeholder="e.g. 1"
                  keyboardType="numeric"
                  value={formData.intstateId}
                  onChangeText={(t) => updateField('intstateId', t)}
                />
              </View>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className={`flex-row justify-center items-center h-14 rounded-xl shadow-sm mb-6 ${isLoading ? 'bg-blue-300' : 'bg-[#3B82F6]'}`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-bold">Register as Buyer</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-auto pt-4">
              <Text className="text-[#6B7280] text-base">Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("BuyerLogin" as never)}>
                <Text className="text-[#3B82F6] text-base font-bold">Login</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
