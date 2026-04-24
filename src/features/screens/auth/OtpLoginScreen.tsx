import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { otpAuthService } from "@/services/auth/otpAuthService";

export default function OtpLoginScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const roleHint: "buyer" | "farmer" | undefined = route.params?.roleHint;

  const [phoneNumber, setPhoneNumber] = useState(route.params?.phoneNumber || "");
  const [isSending, setIsSending] = useState(false);

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Phone Required", "Please enter your mobile number.");
      return;
    }
    if (phoneNumber.replace(/\D/g, "").length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number.");
      return;
    }

    setIsSending(true);
    try {
      const res = await otpAuthService.sendOtp(phoneNumber.trim());
      if (res?.status !== "success") {
        Alert.alert("OTP Failed", res?.message || "Unable to send OTP.");
        return;
      }
      navigation.navigate("OtpVerify" as never, {
        phoneNumber: phoneNumber.trim(),
        roleHint,
      } as never);
    } catch (e: any) {
      const msg = e?.response?.data?.detail?.message || e?.response?.data?.message || e?.message || "Failed to send OTP.";
      Alert.alert("OTP Error", msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <View className="px-5 pt-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 pt-6">
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-[#E0ECFF] items-center justify-center mb-4">
            <MaterialCommunityIcons name="message-processing-outline" size={30} color="#1D4ED8" />
          </View>
          <Text className="text-2xl font-extrabold text-[#111827] mb-2">Login with OTP</Text>
          <Text className="text-[#6B7280] text-sm text-center">
            We will send a 6-digit code to verify your phone number.
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-5" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
          <Text className="text-sm font-semibold text-[#374151] mb-2">Mobile Number</Text>
          <View className="flex-row items-center bg-[#F9FAFB] border border-gray-200 rounded-xl px-4 h-14">
            <MaterialCommunityIcons name="phone-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-[#111827]"
              placeholder="+91 00000 00000"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <TouchableOpacity
            onPress={handleSendOtp}
            disabled={isSending}
            className="mt-5 h-14 rounded-xl items-center justify-center"
            style={{ backgroundColor: isSending ? "#93C5FD" : "#1D4ED8" }}
          >
            {isSending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
