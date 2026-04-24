import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator, Image
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { authService } from "@/services/farmer/authService";
import { buyerAuthService } from "@/services/buyer/buyerAuthService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeStoredUser } from "@/src/utils/authSession";
import { googleAuthService } from "@/services/googleAuthService";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

// ── Google Sign-In config (called once at module level) ───────────────────────
GoogleSignin.configure({
  webClientId: "83809202447-nc3euu613h7ia0ionu2k78430rfffq52.apps.googleusercontent.com",
});

const BUYER_ACCOUNTS_STORAGE_KEY = "@buyer_accounts";

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

const normalizeIdentifier = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  return trimmed.replace(/\D/g, "");
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

const findLocalBuyerAccount = async (identifier: string, password: string) => {
  const currentBuyerStr = await AsyncStorage.getItem("@buyer_user");
  const accountsStr = await AsyncStorage.getItem(BUYER_ACCOUNTS_STORAGE_KEY);
  const currentBuyer = currentBuyerStr ? JSON.parse(currentBuyerStr) : null;
  const parsedAccounts = accountsStr ? JSON.parse(accountsStr) : [];
  const candidateAccounts = [
    currentBuyer,
    ...(Array.isArray(parsedAccounts) ? parsedAccounts : []),
  ].filter(Boolean);

  if (candidateAccounts.length === 0) {
    return null;
  }

  const normalizedIdentifier = identifier.trim().toLowerCase();

  const matchedAccount = candidateAccounts.find((account: any) => {
    const email = String(account?.nvcharEmail || "").toLowerCase();
    const phone = String(account?.nvcharPhoneNumber || "").toLowerCase();
    const accountPassword = String(account?.nvcharPassword || "");

    return (
      (email === normalizedIdentifier || phone === normalizedIdentifier) &&
      accountPassword === password
    );
  });

  return matchedAccount ? normalizeStoredUser(matchedAccount) : null;
};

export default function FarmerLoginScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isBuyer = route.name === "BuyerLogin";
  const roleLabel = isBuyer ? "Buyer" : "Farmer";
  const accentColor = isBuyer ? "#3B82F6" : "#16A34A";
  const accentButtonColor = isBuyer ? "#3B82F6" : "#16A34A";
  const accentLoadingColor = isBuyer ? "#93C5FD" : "#4ADE80";
  const heroBackground = isBuyer ? "#DBEAFE" : "#DCFCE7";
  const pageBg = isBuyer ? "#F0F9FF" : "#F4F9F4";
  const otpBackground = isBuyer ? "#EFF6FF" : "#F0FDF4";
  const otpBorder = isBuyer ? "#BFDBFE" : "#D1FAE5";
  const loginSubtitle = isBuyer
    ? "Source fresh produce & manage your orders"
    : "Manage your crops, orders & grow your farm";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // ── Google Sign-In ───────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken ?? "";

      if (!idToken) {
        Alert.alert("Google Sign-In Failed", "No token received. Please try again.");
        return;
      }

      const result = await googleAuthService.googleLogin({ id_token: idToken });

      if (result?.status !== "success") {
        Alert.alert("Google Sign-In Failed", result?.message ?? "Authentication failed.");
        return;
      }

      const { auth_type } = result.data ?? {};

      if (auth_type === "farmer_login") {
        const farmer = normalizeStoredUser(result.data?.farmer ?? {});
        if (farmer?.id) {
          await AsyncStorage.setItem("@farmer_user", JSON.stringify(farmer));
          navigation.replace("FarmerTabs" as never);
        } else {
          Alert.alert("Error", "Login succeeded but farmer data is incomplete.");
        }
      } else if (auth_type === "buyer_login") {
        const buyer = normalizeStoredUser(result.data?.buyer ?? {});
        if (buyer?.id) {
          await AsyncStorage.setItem("@buyer_user", JSON.stringify(buyer));
          navigation.replace("BuyerTabs" as never);
        } else {
          Alert.alert("Error", "Login succeeded but buyer data is incomplete.");
        }
      } else if (auth_type === "register") {
        const tokens = await GoogleSignin.getTokens();
        navigation.navigate("GoogleRoleSelection" as never, {
          googleProfile: {
            id_token:     idToken,
            access_token: tokens.accessToken,
            google_email: result.data?.google_email ?? "",
            google_name:  result.data?.google_name  ?? "",
            google_picture: result.data?.google_picture ?? "",
          },
        } as never);
      } else {
        Alert.alert("Error", "Unexpected response from server.");
      }
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — do nothing
      } else if (err.code === statusCodes.IN_PROGRESS) {
        Alert.alert("Please wait", "Sign-in is already in progress.");
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services not available.");
      } else {
        const msg = err?.message ?? "Google Sign-In failed.";
        Alert.alert("Google Sign-In Error", msg);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    // Basic validation
    if (!identifier.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Please enter both your phone/email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        identifier: normalizeIdentifier(identifier),
        nvcharPassword: password
      };

      console.log("Sending Login Payload:", payload);

      if (isBuyer) {
        const localBuyer = await findLocalBuyerAccount(identifier, password);

        if (localBuyer?.id) {
          await AsyncStorage.setItem("@buyer_user", JSON.stringify(localBuyer));
          Alert.alert("Success", "Logged in successfully!");
          navigation.replace("BuyerTabs" as never);
          return;
        }
      }

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
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.response?.data?.error ||
        null;

      if (apiMessage) {
        Alert.alert("Login Failed", apiMessage);
        return;
      }

      if (isBuyer && error.response?.status === 404) {
        const localBuyer = await findLocalBuyerAccount(identifier, password);

        if (localBuyer?.id) {
          await AsyncStorage.setItem("@buyer_user", JSON.stringify(localBuyer));
          Alert.alert("Success", "Logged in successfully!");
          navigation.replace("BuyerTabs" as never);
          return;
        }

        Alert.alert("Login Failed", "Invalid credentials. Please try again.");
        return;
      }

      if (error.response && error.response.status === 404) {
        Alert.alert("Login Failed", "Invalid credentials. Please try again.");
      } else {
        Alert.alert("Connection Error", "Could not connect to the server. Please check your network.");
      }
      console.log("Login Error details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View className="flex-row items-center px-5 pt-4 pb-2">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* ── Hero Banner ── */}
          <View className="items-center px-6 pt-4 pb-8">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-5"
              style={{ backgroundColor: heroBackground }}
            >
              <MaterialCommunityIcons
                name={isBuyer ? "storefront-outline" : "sprout"}
                size={38}
                color={accentColor}
              />
            </View>
            <Text className="text-3xl font-extrabold text-[#111827] mb-2">Welcome back!</Text>
            <Text className="text-[#6B7280] text-sm text-center leading-5 px-4">{loginSubtitle}</Text>
          </View>

          {/* ── Form Card ── */}
          <View
            className="bg-white mx-4 rounded-3xl p-6 mb-6"
            style={{
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 6,
            }}
          >

            {/* Identifier */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Phone or Email</Text>
              <View
                className="flex-row items-center bg-white rounded-xl px-4 h-14"
                style={{
                  borderWidth: 1.5,
                  borderColor: identifierFocused ? accentColor : "#E5E7EB",
                }}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={identifierFocused ? accentColor : "#9CA3AF"}
                />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#111827]"
                  placeholder="Enter phone or email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="default"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  onFocus={() => setIdentifierFocused(true)}
                  onBlur={() => setIdentifierFocused(false)}
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-2">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Password</Text>
              <View
                className="flex-row items-center bg-white rounded-xl px-4 h-14"
                style={{
                  borderWidth: 1.5,
                  borderColor: passwordFocused ? accentColor : "#E5E7EB",
                }}
              >
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={passwordFocused ? accentColor : "#9CA3AF"}
                />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#111827]"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} className="p-1">
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity className="self-end mb-6 py-2">
              <Text style={{ color: accentColor }} className="font-semibold text-sm">Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="flex-row justify-center items-center h-14 rounded-xl mb-5"
              style={{ backgroundColor: isLoading ? accentLoadingColor : accentButtonColor }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white text-base font-bold mr-2">Sign In</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center mb-5">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="px-4 text-gray-400 font-semibold text-xs">OR</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Google Sign-In */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="flex-row justify-center items-center h-14 rounded-xl mb-4 border"
              style={{ backgroundColor: "#fff", borderColor: "#E5E7EB" }}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#374151" size="small" />
              ) : (
                <>
                  <Image
                    source={require("@/assets/images/search.png")}
                    style={{ width: 22, height: 22 }}
                    resizeMode="contain"
                  />
                  <Text className="text-[#374151] text-base font-semibold ml-2">Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* OTP Login */}
            <TouchableOpacity
              className="flex-row justify-center items-center h-14 rounded-xl mb-6 border"
              style={{ backgroundColor: otpBackground, borderColor: otpBorder }}
              onPress={() =>
                navigation.navigate("OtpLogin" as never, {
                  roleHint: isBuyer ? "buyer" : "farmer",
                } as never)
              }
            >
              <MaterialCommunityIcons name="message-processing-outline" size={20} color="#374151" />
              <Text className="text-[#374151] text-base font-semibold ml-2">Login with OTP</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View className="flex-row justify-center">
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
