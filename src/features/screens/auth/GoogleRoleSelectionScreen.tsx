import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { googleAuthService } from "@/services/googleAuthService";
import { normalizeStoredUser } from "@/src/utils/authSession";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "farmer" | "buyer";

interface GoogleProfile {
  id_token?: string;
  access_token?: string;
  client_id?: string;
  google_email: string;
  google_name: string;
  google_picture?: string;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GoogleRoleSelectionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const profile: GoogleProfile = route.params?.googleProfile ?? {};

  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState(profile.google_name ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [farmingType, setFarmingType] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const accentColor = role === "buyer" ? "#3B82F6" : "#16A34A";
  const accentLight = role === "buyer" ? "#DBEAFE" : "#DCFCE7";

  const handleComplete = async () => {
    if (!role) {
      Alert.alert("Select Role", "Please choose whether you are a Farmer or Buyer.");
      return;
    }
    if (!fullName.trim()) {
      Alert.alert("Required", "Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Required", "Please enter your phone number.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert("Required", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        id_token:              profile.id_token,
        access_token:          profile.access_token,
        client_id:             profile.client_id ?? "",
        role,
        nvcharFullName:        fullName.trim(),
        nvcharPhoneNumber:     phone.trim(),
        nvcharPassword:        password,
        nvcharLocation:        address.trim(),
        nvcharAddress:         address.trim(),
        nvcharFarmingType:     role === "farmer" ? farmingType.trim() : "",
        nvcharDescription:     `Registered via Google`,
      };

      const response = await googleAuthService.googleCompleteRegistration(payload);

      if (response?.status === "success") {
        const data = response.data ?? {};
        const userRecord = data.farmer ?? data.buyer ?? {};
        const userData = normalizeStoredUser(userRecord);

        if (!userData?.id) {
          Alert.alert("Error", "Registration succeeded but account data is incomplete. Please log in manually.");
          navigation.navigate("RoleSelection");
          return;
        }

        const storageKey = role === "farmer" ? "@farmer_user" : "@buyer_user";
        await AsyncStorage.setItem(storageKey, JSON.stringify(userData));

        Alert.alert("Welcome!", `You are now registered as a ${role}.`);
        navigation.replace(role === "farmer" ? "FarmerTabs" : "BuyerTabs");
      } else {
        Alert.alert("Registration Failed", response?.message ?? "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Network error.";
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F9F4" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

          {/* ── Header ── */}
          <View className="flex-row items-center px-5 pt-4 pb-2">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* ── Hero ── */}
          <View className="items-center px-6 pt-2 pb-6">
            <View className="w-20 h-20 rounded-full bg-[#DCFCE7] items-center justify-center mb-4">
              <MaterialCommunityIcons name="google" size={36} color="#16A34A" />
            </View>
            <Text className="text-2xl font-extrabold text-[#111827] mb-1">Almost there!</Text>
            <Text className="text-[#6B7280] text-sm text-center">
              Hi <Text className="font-semibold text-[#111827]">{profile.google_email}</Text>
            </Text>
            <Text className="text-[#6B7280] text-sm text-center mt-1">
              Choose your role and complete your profile.
            </Text>
          </View>

          {/* ── Role Selection ── */}
          <View className="mx-4 mb-5">
            <Text className="text-sm font-bold text-[#374151] mb-3 px-1">I am a…</Text>
            <View className="flex-row gap-3">
              {(["farmer", "buyer"] as Role[]).map((r) => {
                const selected = role === r;
                const color = r === "buyer" ? "#3B82F6" : "#16A34A";
                const bg = r === "buyer" ? "#DBEAFE" : "#DCFCE7";
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    className="flex-1 rounded-2xl p-4 items-center"
                    style={{
                      backgroundColor: selected ? color : "#fff",
                      borderWidth: 2,
                      borderColor: selected ? color : "#E5E7EB",
                    }}
                  >
                    <MaterialCommunityIcons
                      name={r === "farmer" ? "sprout" : "storefront-outline"}
                      size={28}
                      color={selected ? "#fff" : color}
                    />
                    <Text
                      className="text-sm font-bold mt-2 capitalize"
                      style={{ color: selected ? "#fff" : "#374151" }}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Form ── */}
          <View
            className="bg-white mx-4 rounded-3xl p-6"
            style={{ elevation: 4, shadowColor: "#0F172A", shadowOpacity: 0.07, shadowRadius: 12 }}
          >
            {/* Full Name */}
            <FormField
              label="Full Name"
              icon="account-outline"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              accentColor={accentColor}
            />

            {/* Phone */}
            <FormField
              label="Phone Number"
              icon="phone-outline"
              value={phone}
              onChangeText={setPhone}
              placeholder="Your phone number"
              keyboardType="phone-pad"
              accentColor={accentColor}
            />

            {/* Password */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Set Password</Text>
              <View
                className="flex-row items-center bg-white rounded-xl px-4 h-14"
                style={{ borderWidth: 1.5, borderColor: "#E5E7EB" }}
              >
                <MaterialCommunityIcons name="lock-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#111827]"
                  placeholder="Create a password (min 6 chars)"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
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

            {/* Farmer-only: farming type */}
            {role === "farmer" && (
              <FormField
                label="Farming Type (optional)"
                icon="leaf"
                value={farmingType}
                onChangeText={setFarmingType}
                placeholder="e.g. Organic, Mixed, Dairy…"
                accentColor={accentColor}
              />
            )}

            {/* Address (buyer shows it as delivery address) */}
            <FormField
              label={role === "buyer" ? "Delivery Address (optional)" : "Farm Location (optional)"}
              icon="map-marker-outline"
              value={address}
              onChangeText={setAddress}
              placeholder="City, State…"
              accentColor={accentColor}
            />

            {/* Email — read-only from Google */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-[#374151] mb-2">Email (from Google)</Text>
              <View
                className="flex-row items-center bg-[#F9FAFB] rounded-xl px-4 h-14"
                style={{ borderWidth: 1.5, borderColor: "#E5E7EB" }}
              >
                <MaterialCommunityIcons name="email-outline" size={20} color="#9CA3AF" />
                <Text className="flex-1 ml-3 text-base text-[#6B7280]">{profile.google_email}</Text>
                <MaterialCommunityIcons name="lock-check-outline" size={18} color="#9CA3AF" />
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleComplete}
              disabled={isLoading}
              className="flex-row justify-center items-center h-14 rounded-xl"
              style={{ backgroundColor: isLoading ? "#A7F3D0" : (accentColor) }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white text-base font-bold mr-2">Complete Registration</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Reusable form field ───────────────────────────────────────────────────────

function FormField({
  label, icon, value, onChangeText, placeholder, keyboardType, accentColor,
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  accentColor: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-[#374151] mb-2">{label}</Text>
      <View
        className="flex-row items-center bg-white rounded-xl px-4 h-14"
        style={{ borderWidth: 1.5, borderColor: focused ? accentColor : "#E5E7EB" }}
      >
        <MaterialCommunityIcons name={icon as any} size={20} color={focused ? accentColor : "#9CA3AF"} />
        <TextInput
          className="flex-1 ml-3 text-base text-[#111827]"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? "default"}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}
