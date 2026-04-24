import React, { useEffect, useRef, useState } from "react";
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
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeStoredUser } from "@/src/utils/authSession";
import { otpAuthService } from "@/services/auth/otpAuthService";

const OTP_LENGTH = 6;

export default function OtpVerifyScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phoneNumber = route.params?.phoneNumber || "";
  const roleHint: "buyer" | "farmer" | undefined = route.params?.roleHint;

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const inputsRef = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const updateDigit = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "");
    const next = [...otpDigits];
    next[index] = digit.slice(-1);
    setOtpDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (otpDigits[index]) return;
    if (index > 0) inputsRef.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otpDigits.join("");
    if (code.length !== OTP_LENGTH) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit code.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await otpAuthService.verifyOtp(phoneNumber, code, roleHint);
      if (res?.status !== "success") {
        Alert.alert("OTP Failed", res?.message || "Invalid OTP.");
        return;
      }

      const data = res?.data || {};
      const role = data.role;
      const user = data.user;

      if (!user) {
        Alert.alert("Not Registered", "You are not registered. Please complete your registration.");
        navigation.navigate("OtpRoleSelection" as never, {
          phoneNumber,
          phoneVerified: true,
        } as never);
        return;
      }

      const normalized = normalizeStoredUser(user);

      if (role === "buyer") {
        await AsyncStorage.setItem("@buyer_user", JSON.stringify(normalized));
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "BuyerTabs" }] }));
      } else if (role === "farmer") {
        await AsyncStorage.setItem("@farmer_user", JSON.stringify(normalized));
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "FarmerTabs" }] }));
      } else if (role === "both") {
        navigation.navigate("OtpRoleSelection" as never, {
          phoneNumber,
          phoneVerified: true,
        } as never);
      } else {
        Alert.alert("Login Failed", "Could not determine account role.");
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail?.message || e?.response?.data?.message || e?.message || "OTP verification failed.";
      Alert.alert("OTP Error", msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setIsResending(true);
    try {
      const res = await otpAuthService.resendOtp(phoneNumber);
      if (res?.status !== "success") {
        Alert.alert("Resend Failed", res?.message || "Could not resend OTP.");
        return;
      }
      setTimer(60);
    } catch (e: any) {
      const msg = e?.response?.data?.detail?.message || e?.response?.data?.message || e?.message || "Resend failed.";
      Alert.alert("Resend Error", msg);
    } finally {
      setIsResending(false);
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
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-[#E0ECFF] items-center justify-center mb-4">
            <MaterialCommunityIcons name="shield-check-outline" size={30} color="#1D4ED8" />
          </View>
          <Text className="text-2xl font-extrabold text-[#111827] mb-2">Verify OTP</Text>
          <Text className="text-[#6B7280] text-sm text-center">
            Enter the 6-digit code sent to {phoneNumber}
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-5" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
          <View className="flex-row justify-between mb-4">
            {otpDigits.map((digit, idx) => (
              <TextInput
                key={`otp-${idx}`}
                ref={(ref) => (inputsRef.current[idx] = ref)}
                value={digit}
                onChangeText={(text) => updateDigit(text, idx)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace") handleBackspace(idx);
                }}
                keyboardType="number-pad"
                maxLength={1}
                className="w-11 h-12 rounded-xl bg-[#F9FAFB] text-center text-lg font-bold text-[#111827]"
                style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
                autoFocus={idx === 0}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={isVerifying}
            className="h-14 rounded-xl items-center justify-center"
            style={{ backgroundColor: isVerifying ? "#93C5FD" : "#1D4ED8" }}
          >
            {isVerifying ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-[#6B7280] text-sm mr-1">Didn&apos;t receive OTP?</Text>
            <TouchableOpacity onPress={handleResend} disabled={timer > 0 || isResending}>
              <Text className="text-[#1D4ED8] font-semibold text-sm">
                {timer > 0 ? `Resend in ${timer}s` : isResending ? "Resending..." : "Resend"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
