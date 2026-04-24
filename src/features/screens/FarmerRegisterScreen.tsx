import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { authService, FarmerRegisterPayload } from "@/services/farmer/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  showToggle?: boolean;
  onToggleSecure?: () => void;
  keyboard?: "default" | "phone-pad" | "email-address";
  required?: boolean;
  icon?: string;
};

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  secure = false,
  showToggle = false,
  onToggleSecure,
  keyboard = "default",
  required = false,
  icon,
}: InputFieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-[#111827] mb-2">
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14">
        {icon ? (
          <MaterialCommunityIcons name={icon as any} size={20} color="#9CA3AF" />
        ) : null}
        <TextInput
          className={`flex-1 text-base text-[#111827] ${icon ? "ml-3" : ""}`}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          keyboardType={keyboard}
          autoCapitalize={keyboard === "email-address" ? "none" : "sentences"}
        />
        {showToggle && onToggleSecure ? (
          <TouchableOpacity onPress={onToggleSecure} className="p-1">
            <MaterialCommunityIcons
              name={secure ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function FarmerRegisterScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const prefillPhone = route.params?.prefillPhone || "";
  const phoneVerified = Boolean(route.params?.phoneVerified);

  const [formData, setFormData] = useState({
    nvcharFullName: "",
    nvcharPhoneNumber: "",
    nvcharEmail: "",
    nvcharPassword: "",
    confirmPassword: "",
    nvcharFarmingType: "",
    nvcharPreferredLanguage: "",
    nvcharDescription: "",
    countryName: "",
    stateName: "",
    cityName: "",
  });

  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const updateField = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  React.useEffect(() => {
    if (prefillPhone) {
      setFormData((prev) => ({ ...prev, nvcharPhoneNumber: prefillPhone }));
    }
  }, [prefillPhone]);

  const handleRegister = async () => {
    const requiredFields = [
      { key: "nvcharFullName", label: "Full Name" },
      { key: "nvcharPhoneNumber", label: "Phone Number" },
      { key: "nvcharEmail", label: "Email Address" },
      { key: "nvcharPassword", label: "Password" },
      { key: "confirmPassword", label: "Confirm Password" },
      { key: "countryName", label: "Country" },
      { key: "stateName", label: "State" },
      { key: "cityName", label: "City / Village" },
      { key: "nvcharFarmingType", label: "Farming Type" },
      { key: "nvcharPreferredLanguage", label: "Preferred Language" },
    ] as const;

    const missingField = requiredFields.find(
      ({ key }) => !formData[key as keyof typeof formData].trim()
    );

    if (missingField) {
      Alert.alert("Validation Error", `${missingField.label} is required.`);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.nvcharEmail.trim())) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return;
    }

    if (formData.nvcharPhoneNumber.trim().length < 10) {
      Alert.alert("Validation Error", "Please enter a valid phone number.");
      return;
    }

    if (formData.nvcharPassword.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters.");
      return;
    }

    if (formData.nvcharPassword !== formData.confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: FarmerRegisterPayload = {
        nvcharFullName: formData.nvcharFullName.trim(),
        nvcharPhoneNumber: formData.nvcharPhoneNumber.trim(),
        nvcharEmail: formData.nvcharEmail.trim().toLowerCase(),
        nvcharPassword: formData.nvcharPassword,
        nvcharProfilePhotoUrl: "",
        intcountryId: formData.countryName.trim(),
        intstateId: formData.stateName.trim(),
        intCityId: formData.cityName.trim(),
        nvcharFarmingType: formData.nvcharFarmingType.trim(),
        nvcharPreferredLanguage: formData.nvcharPreferredLanguage.trim(),
        ynPhoneVerified: phoneVerified,
        nvcharDescription: formData.nvcharDescription.trim(),
      };

      const registerResponse = await authService.registerFarmer(payload);
      const registeredData = registerResponse?.data ?? registerResponse ?? {};
      const userId = registeredData?.id ?? registeredData?.intFarmerId ?? null;

      let finalImageUrl = "";
      if (profileImageUri && userId) {
        try {
          const imageRes = await authService.uploadProfilePicture(profileImageUri, userId);
          finalImageUrl = authService.extractProfileImageUrl(imageRes);

          if (finalImageUrl) {
            await authService.editFarmer({
              ...payload,
              id: userId,
              nvcharProfilePhotoUrl: finalImageUrl,
            });
          }
        } catch (uploadError) {
          console.log("Profile photo upload failed", uploadError);
        }
      }

      const registeredUser = {
        ...registeredData,
        ...payload,
        id: userId ?? registeredData?.id ?? null,
        nvcharProfilePhotoUrl: finalImageUrl || payload.nvcharProfilePhotoUrl,
        nvcharLocation: [formData.cityName.trim(), formData.stateName.trim()].filter(Boolean).join(", "),
        avatarUrl: finalImageUrl,
      };

      await AsyncStorage.setItem("@farmer_user", JSON.stringify(registeredUser));

      Alert.alert("Success", "Farmer registered successfully.");
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "FarmerTabs" }],
        })
      );
    } catch (error) {
      Alert.alert("Registration Failed", "Check your backend connection.");
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F9F4]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ── */}
          <View className="flex-row items-center mb-6 pt-2">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-xl font-bold text-[#111827] pr-10">
              Create Farmer Account
            </Text>
          </View>

          {/* ── Profile Photo ── */}
          <View className="items-center mb-7">
            <TouchableOpacity
              onPress={pickImage}
              className="w-24 h-24 rounded-full border-2 border-dashed border-[#16A34A] items-center justify-center bg-green-50 overflow-hidden"
            >
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} className="w-full h-full" />
              ) : (
                <>
                  <MaterialCommunityIcons name="camera-plus" size={30} color="#16A34A" />
                  <Text className="text-[#16A34A] text-xs font-bold mt-1">PHOTO</Text>
                </>
              )}
            </TouchableOpacity>
            <Text className="text-[#6B7280] text-xs mt-2">Profile Photo (Optional)</Text>
          </View>

          {/* ── Section: Personal Info ── */}
          <View className="bg-white rounded-2xl p-4 mb-4" style={{ elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Text className="text-xs font-bold text-[#16A34A] uppercase tracking-wider mb-4">Personal Information</Text>
            <InputField required label="Full Name" placeholder="Enter your full name" value={formData.nvcharFullName} onChangeText={(t) => updateField("nvcharFullName", t)} icon="account-outline" />
            <InputField required label="Phone Number" placeholder="+91 00000 00000" keyboard="phone-pad" value={formData.nvcharPhoneNumber} onChangeText={(t) => updateField("nvcharPhoneNumber", t)} icon="phone-outline" />
            <InputField required label="Email Address" placeholder="example@farm.com" keyboard="email-address" value={formData.nvcharEmail} onChangeText={(t) => updateField("nvcharEmail", t)} icon="email-outline" />
            <InputField
              required
              label="Password"
              placeholder="Create a password (min 6 chars)"
              secure={!showPassword}
              showToggle
              onToggleSecure={() => setShowPassword(v => !v)}
              value={formData.nvcharPassword}
              onChangeText={(t) => updateField("nvcharPassword", t)}
              icon="lock-outline"
            />
            <InputField
              required
              label="Confirm Password"
              placeholder="Re-enter your password"
              secure={!showConfirmPassword}
              showToggle
              onToggleSecure={() => setShowConfirmPassword(v => !v)}
              value={formData.confirmPassword}
              onChangeText={(t) => updateField("confirmPassword", t)}
              icon="lock-check-outline"
            />
          </View>

          {/* ── Section: Location ── */}
          <View className="bg-white rounded-2xl p-4 mb-4" style={{ elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Text className="text-xs font-bold text-[#16A34A] uppercase tracking-wider mb-4">Location</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <InputField required label="Country" placeholder="e.g. India" value={formData.countryName} onChangeText={(t) => updateField("countryName", t)} icon="earth" />
              </View>
              <View className="flex-1">
                <InputField required label="State" placeholder="e.g. Maharashtra" value={formData.stateName} onChangeText={(t) => updateField("stateName", t)} icon="map-outline" />
              </View>
            </View>
            <InputField required label="City / Village" placeholder="e.g. Pune" value={formData.cityName} onChangeText={(t) => updateField("cityName", t)} icon="city-variant-outline" />
          </View>

          {/* ── Section: Farm Details ── */}
          <View className="bg-white rounded-2xl p-4 mb-6" style={{ elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Text className="text-xs font-bold text-[#16A34A] uppercase tracking-wider mb-4">Farm Details</Text>
            <InputField required label="Farming Type" placeholder="e.g. Organic, Mixed, Dairy" value={formData.nvcharFarmingType} onChangeText={(t) => updateField("nvcharFarmingType", t)} icon="tractor" />
            <InputField required label="Preferred Language" placeholder="e.g. Marathi, Hindi" value={formData.nvcharPreferredLanguage} onChangeText={(t) => updateField("nvcharPreferredLanguage", t)} icon="translate" />
            <View>
              <Text className="text-sm font-semibold text-[#111827] mb-2">About Your Farm</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-[#111827]"
                placeholder="Tell buyers about your farm..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={formData.nvcharDescription}
                onChangeText={(t) => updateField("nvcharDescription", t)}
              />
            </View>
          </View>

          {/* ── Register Button ── */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isSubmitting}
            className="flex-row justify-center items-center h-14 rounded-xl mb-5"
            style={{ backgroundColor: isSubmitting ? "#4ADE80" : "#16A34A" }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white text-base font-bold mr-2">Create Account</Text>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          {/* ── Login Link ── */}
          <View className="flex-row justify-center pb-6">
            <Text className="text-[#6B7280] text-base">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("FarmerLogin" as never)}>
              <Text className="text-[#16A34A] text-base font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
