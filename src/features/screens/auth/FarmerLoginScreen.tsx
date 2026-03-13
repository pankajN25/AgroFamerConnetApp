import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, SafeAreaView, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator 
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { authService } from "@/services/farmer/authService";
import { buyerAuthService } from "@/services/buyer/buyerAuthService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeStoredUser } from "@/src/utils/authSession";
// import { authService } from "../api/authService"; // Import the service

const isSuccessfulLoginResponse = (response: any) => {
  if (!response) {
    return false;
  }

  if (response.status === "success" || response.success === true) {
    return true;
  }

  if (response.status === "error" || response.success === false) {
    return false;
  }

  if (Array.isArray(response)) {
    return response.length > 0;
  }

  if (Array.isArray(response.data)) {
    return response.data.length > 0;
  }

  if (response.data && typeof response.data === "object") {
    return true;
  }

  if (typeof response === "object") {
    return Object.keys(response).length > 0;
  }

  return false;
};

const getLoginUserData = (response: any) => {
  if (Array.isArray(response)) {
    return response[0];
  }

  if (Array.isArray(response?.data)) {
    return response.data[0];
  }

  return response?.data ?? response;
};

export default function FarmerLoginScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isBuyer = route.name === "BuyerLogin";
  const roleLabel = isBuyer ? "Buyer" : "Farmer";
  const accentColor = isBuyer ? "#3B82F6" : "#00E600";
  const accentButtonColor = isBuyer ? "#3B82F6" : "#00E600";
  const accentLoadingColor = isBuyer ? "#93C5FD" : "#4ADE80";
  const heroBackground = isBuyer ? "#DBEAFE" : "#DCFCE7";
  const otpBackground = isBuyer ? "#EFF6FF" : "#F0FDF4";
  const otpBorder = isBuyer ? "#BFDBFE" : "#D1FAE5";
  const loginSubtitle = isBuyer
    ? "Login to source produce and manage your orders"
    : "Login to manage your crops and orders";
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const handleLogin = async () => {
    // Basic validation
    if (!identifier.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Please enter both your phone/email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        identifier: identifier.trim(),
        nvcharPassword: password
      };

      console.log("Sending Login Payload:", payload);
      
      const response = isBuyer
        ? await buyerAuthService.loginBuyer(payload)
        : await authService.loginFarmer(payload);
      console.log("Login API Response:", response);
      
      if (isSuccessfulLoginResponse(response)) {
        const userData = normalizeStoredUser(getLoginUserData(response));

        if (!userData?.id) {
          Alert.alert("Login Failed", "Account data is incomplete. Please try again.");
          return;
        }

        await AsyncStorage.setItem(
          isBuyer ? '@buyer_user' : '@farmer_user',
          JSON.stringify(userData)
        );

        Alert.alert("Success", "Logged in successfully!");

        navigation.replace((isBuyer ? "BuyerTabs" : "FarmerTabs") as never);

      } else {
        const errorMessage =
          response?.message ||
          response?.detail ||
          response?.error ||
          "Invalid credentials. Please try again.";
        Alert.alert("Login Failed", errorMessage);
      }

    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        Alert.alert("Login Failed", "Account not found. Please register first.");
      } else if (error.response?.data?.detail || error.response?.data?.message) {
        Alert.alert("Login Failed", error.response.data.detail || error.response.data.message);
      } else {
        Alert.alert("Connection Error", "Could not connect to the server. Please check your network.");
      }
      console.log("Login Error details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F9F4]">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          
          <View className="flex-row items-center px-6 pt-4 pb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
              <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-lg font-bold text-[#111827] pr-8">
              {roleLabel} Login
            </Text>
          </View>

          <View className="flex-1 bg-white mx-4 mt-2 rounded-3xl p-6 shadow-sm mb-6">
            
            <View className="items-center mb-8">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: heroBackground }}
              >
                <MaterialCommunityIcons
                  name={isBuyer ? "storefront" : "sprout"}
                  size={32}
                  color={accentColor}
                />
              </View>
              <Text className="text-2xl font-extrabold text-[#111827] mb-2">Welcome back!</Text>
              <Text className="text-[#6B7280] text-sm">{loginSubtitle}</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Phone or Email</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14 focus:border-[#00E600]">
                <MaterialCommunityIcons name="account-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#111827]"
                  placeholder="Enter phone or email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="default"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="mb-2">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Password</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14 focus:border-[#00E600]">
                <MaterialCommunityIcons name="lock-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#111827]"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity className="self-end mb-6 py-2">
              <Text style={{ color: accentColor }} className="font-semibold text-sm">Forgot Password?</Text>
            </TouchableOpacity>

            {/* Loading Button UI */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="flex-row justify-center items-center h-14 rounded-xl shadow-sm mb-6"
              style={{ backgroundColor: isLoading ? accentLoadingColor : accentButtonColor }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white text-lg font-bold mr-2">Login</Text>
                  <MaterialCommunityIcons name="login" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="px-4 text-gray-400 font-semibold text-xs">OR</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            <TouchableOpacity
              className="flex-row justify-center items-center h-14 rounded-xl mb-6 border"
              style={{ backgroundColor: otpBackground, borderColor: otpBorder }}
            >
              <MaterialCommunityIcons name="message-processing-outline" size={20} color="#111827" />
              <Text className="text-[#111827] text-base font-bold ml-2">Login with OTP</Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-auto pt-4">
              <Text className="text-[#6B7280] text-base">Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate(isBuyer ? "BuyerRegister" : "FarmerRegister")}>
                <Text style={{ color: accentColor }} className="text-base font-bold">Register</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
