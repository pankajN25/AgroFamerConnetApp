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
import { CommonActions, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { authService, FarmerRegisterPayload } from "@/services/farmer/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  keyboard?: "default" | "phone-pad" | "email-address";
  required?: boolean;
};

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  secure = false,
  keyboard = "default",
  required = false,
}: InputFieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-[#111827] mb-2">
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
      <TextInput
        className="bg-white border border-green-100 rounded-xl px-4 h-14 text-base text-[#111827] focus:border-[#00E600]"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize={keyboard === "email-address" ? "none" : "sentences"}
      />
    </View>
  );
}

export default function FarmerRegisterScreen() {
  const navigation = useNavigation<any>();

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

      let finalImageUrl = "";
      if (profileImageUri) {
        const imageRes = await authService.uploadProfilePicture(profileImageUri);
        finalImageUrl = authService.extractProfileImageUrl(imageRes);
      }

      const payload: FarmerRegisterPayload = {
        nvcharFullName: formData.nvcharFullName.trim(),
        nvcharPhoneNumber: formData.nvcharPhoneNumber.trim(),
        nvcharEmail: formData.nvcharEmail.trim().toLowerCase(),
        nvcharPassword: formData.nvcharPassword,
        nvcharProfilePhotoUrl: finalImageUrl,
        intcountryId: formData.countryName.trim(),
        intstateId: formData.stateName.trim(),
        intCityId: formData.cityName.trim(),
        nvcharFarmingType: formData.nvcharFarmingType.trim(),
        nvcharPreferredLanguage: formData.nvcharPreferredLanguage.trim(),
        ynPhoneVerified: false,
        nvcharDescription: formData.nvcharDescription.trim(),
      };

      const registerResponse = await authService.registerFarmer(payload);
      const registeredUser = {
        ...(registerResponse?.data ?? registerResponse ?? {}),
        ...payload,
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
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center mb-8 pt-2">
            <TouchableOpacity onPress={() => navigation.goBack()} className="-ml-2 p-2">
              <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-xl font-bold text-[#111827] pr-8">
              Farmer Registration
            </Text>
          </View>

          <View className="items-center mb-8">
            <TouchableOpacity
              onPress={pickImage}
              className="w-24 h-24 rounded-full border-2 border-dashed border-[#00E600] items-center justify-center bg-green-50 overflow-hidden"
            >
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} className="w-full h-full" />
              ) : (
                <>
                  <MaterialCommunityIcons name="camera-plus" size={32} color="#00E600" />
                  <Text className="text-[#00E600] text-xs font-bold mt-1">UPLOAD</Text>
                </>
              )}
            </TouchableOpacity>
            <Text className="text-[#6B7280] text-sm mt-3">Add Profile Photo (Optional)</Text>
          </View>

          <InputField
            required
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.nvcharFullName}
            onChangeText={(t) => updateField("nvcharFullName", t)}
          />
          <InputField
            required
            label="Phone Number"
            placeholder="+91 00000 00000"
            keyboard="phone-pad"
            value={formData.nvcharPhoneNumber}
            onChangeText={(t) => updateField("nvcharPhoneNumber", t)}
          />
          <InputField
            required
            label="Email Address"
            placeholder="example@farm.com"
            keyboard="email-address"
            value={formData.nvcharEmail}
            onChangeText={(t) => updateField("nvcharEmail", t)}
          />
          <InputField
            required
            label="Password"
            placeholder="Enter password"
            secure
            value={formData.nvcharPassword}
            onChangeText={(t) => updateField("nvcharPassword", t)}
          />
          <InputField
            required
            label="Confirm Password"
            placeholder="Re-enter password"
            secure
            value={formData.confirmPassword}
            onChangeText={(t) => updateField("confirmPassword", t)}
          />

          <Text className="text-sm font-semibold text-[#111827] mb-2 mt-2">Location Setup</Text>
          <View className="flex-row space-x-4 mb-2">
            <View className="flex-1">
              <InputField
                required
                label="Country"
                placeholder="e.g. India"
                value={formData.countryName}
                onChangeText={(t) => updateField("countryName", t)}
              />
            </View>
            <View className="flex-1">
              <InputField
                required
                label="State"
                placeholder="e.g. Maharashtra"
                value={formData.stateName}
                onChangeText={(t) => updateField("stateName", t)}
              />
            </View>
          </View>
          <InputField
            required
            label="City / Village"
            placeholder="e.g. Pune"
            value={formData.cityName}
            onChangeText={(t) => updateField("cityName", t)}
          />

          <InputField
            required
            label="Farming Type"
            placeholder="e.g. Organic"
            value={formData.nvcharFarmingType}
            onChangeText={(t) => updateField("nvcharFarmingType", t)}
          />
          <InputField
            required
            label="Preferred Language"
            placeholder="e.g. Marathi"
            value={formData.nvcharPreferredLanguage}
            onChangeText={(t) => updateField("nvcharPreferredLanguage", t)}
          />

          <View className="mb-6 mt-4">
            <Text className="text-sm font-semibold text-[#111827] mb-2">About Your Farm</Text>
            <TextInput
              className="bg-white border border-green-100 rounded-xl px-4 py-3 text-base text-[#111827] focus:border-[#00E600]"
              placeholder="Tell buyers about your farm..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.nvcharDescription}
              onChangeText={(t) => updateField("nvcharDescription", t)}
            />
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={isSubmitting}
            className={`flex-row justify-center items-center h-14 rounded-xl shadow-sm mb-6 ${isSubmitting ? "bg-green-400" : "bg-[#00E600]"}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-bold">Register</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
