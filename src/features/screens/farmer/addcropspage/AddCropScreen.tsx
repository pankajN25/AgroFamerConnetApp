import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AddCropPayload, cropService } from "@/services/farmer/cropService";

const getTodayDate = () => new Date().toISOString().split("T")[0];

const normalizeHarvestDate = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return getTodayDate();
  }

  const normalizedValue = trimmedValue.replace(/\//g, "-");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return null;
  }

  const parsedDate = new Date(`${normalizedValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return normalizedValue;
};

export default function AddCropScreen() {
  const navigation = useNavigation<any>();

  const [formData, setFormData] = useState({
    nvcharCropName: "",
    intCropCategoryId: "",
    floatQuantity: "",
    floatPricePerKg: "",
    dtHarvestDate: "",
    nvcharDescription: "",
    nvcharLocation: "",
    intQualityGradeId: "",
    ynOrganic: false,
  });

  const [cropImageUri, setCropImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCropImageUri(result.assets[0].uri);
    }
  };

  const updateField = (key: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePublish = async () => {
    const parsedQuantity = parseFloat(formData.floatQuantity);
    const parsedPrice = parseFloat(formData.floatPricePerKg);
    const harvestDate = normalizeHarvestDate(formData.dtHarvestDate);

    if (!formData.nvcharCropName.trim()) {
      Alert.alert("Validation Error", "Please enter a Crop Name.");
      return;
    }

    if (!parsedQuantity || parsedQuantity <= 0) {
      Alert.alert("Validation Error", "Quantity must be greater than 0.");
      return;
    }

    if (!parsedPrice || parsedPrice <= 0) {
      Alert.alert("Validation Error", "Price per kg must be greater than 0.");
      return;
    }

    if (!harvestDate) {
      Alert.alert("Validation Error", "Harvest Date must be in YYYY-MM-DD format.");
      return;
    }

    setIsLoading(true);

    try {
      const userString = await AsyncStorage.getItem("@farmer_user");
      if (!userString) {
        Alert.alert("Error", "User session not found. Please log in again.");
        return;
      }

      const user = JSON.parse(userString);
      const farmerId = user.id;

      const payload: AddCropPayload = {
        intFarmerId: farmerId,
        nvcharCropName: formData.nvcharCropName.trim(),
        intCropCategoryId: parseInt(formData.intCropCategoryId, 10) || 1,
        floatQuantity: parsedQuantity,
        floatPricePerKg: parsedPrice,
        dtHarvestDate: harvestDate,
        nvcharDescription: formData.nvcharDescription.trim(),
        nvcharLocation: formData.nvcharLocation.trim(),
        intQualityGradeId: parseInt(formData.intQualityGradeId, 10) || 1,
        ynOrganic: formData.ynOrganic,
        nvcharCropImageUrl: "",
      };

      const saveResponse = await cropService.addCrop(payload);
      const cropId = cropService.extractCropId(saveResponse);
      const savedCrop = cropService.extractCropRecord(saveResponse);

      if (!cropId || Number.isNaN(cropId)) {
        throw new Error("Crop was saved but backend did not return the crop id.");
      }

      if (cropImageUri) {
        const uploadResponse = await cropService.uploadCropImage(cropImageUri, cropId);
        const uploadedImageUrl = cropService.extractUploadedImageUrl(uploadResponse);

        if (uploadedImageUrl) {
          await cropService.editCrop({
            ...(savedCrop ?? payload),
            id: cropId,
            nvcharCropImageUrl: uploadedImageUrl,
          });
        } else {
          const cropImagesResponse = await cropService.getCropImagesByCropId(cropId);
          const cropImages = cropService.extractCropImages(cropImagesResponse);
          const matchedImage = cropImages[0];
          const resolvedImageUrl = cropService.resolveCropImageUrl(
            matchedImage?.nvcharImageUrl || matchedImage?.imageUrl || matchedImage?.url
          );

          if (resolvedImageUrl) {
            await cropService.editCrop({
              ...(savedCrop ?? payload),
              id: cropId,
              nvcharCropImageUrl: resolvedImageUrl,
            });
          }
        }
      }

      navigation.replace("CropSuccess");
    } catch (error: any) {
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.detail?.[0]?.msg ||
        error.message ||
        "Could not save the crop. Please try again.";

      Alert.alert("Publish Failed", backendMessage);
      console.log("Backend Error Details:", error.response?.data ?? error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center px-6 pt-4 pb-4 bg-white shadow-sm z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-[#111827] pr-8">
          Add New Crop
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            onPress={pickImage}
            className="w-full h-40 rounded-2xl border-2 border-dashed border-[#A7F3D0] bg-[#ECFDF5] items-center justify-center mb-6 overflow-hidden"
          >
            {cropImageUri ? (
              <Image source={{ uri: cropImageUri }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <>
                <View className="w-14 h-14 bg-[#10B981] rounded-full items-center justify-center mb-2">
                  <MaterialCommunityIcons name="camera-plus" size={28} color="white" />
                </View>
                <Text className="text-[#10B981] font-bold text-base">Upload Crop Image</Text>
                <Text className="text-gray-400 text-xs mt-1">JPG, PNG (Max 5MB)</Text>
              </>
            )}
          </TouchableOpacity>

          <View className="mb-4">
            <Text className="text-sm font-bold text-[#374151] mb-2">Crop Name</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 h-14 text-[#111827]"
              placeholder="e.g. Organic Cavendish Bananas"
              value={formData.nvcharCropName}
              onChangeText={(t) => updateField("nvcharCropName", t)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-bold text-[#374151] mb-2">Crop Category (ID)</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 h-14 text-[#111827]"
              placeholder="e.g. 1 (for Fruits), 2 (for Veg)"
              keyboardType="numeric"
              value={formData.intCropCategoryId}
              onChangeText={(t) => updateField("intCropCategoryId", t)}
            />
          </View>

          <View className="flex-row space-x-4 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-bold text-[#374151] mb-2">Quantity (kg)</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 h-14 text-[#111827]"
                placeholder="0.00"
                keyboardType="numeric"
                value={formData.floatQuantity}
                onChangeText={(t) => updateField("floatQuantity", t)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-[#374151] mb-2">Price per kg</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 h-14 text-[#111827]"
                placeholder="Rs 0.00"
                keyboardType="numeric"
                value={formData.floatPricePerKg}
                onChangeText={(t) => updateField("floatPricePerKg", t)}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-bold text-[#374151] mb-2">Harvest Date</Text>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14">
              <TextInput
                className="flex-1 text-[#111827]"
                placeholder="YYYY-MM-DD"
                value={formData.dtHarvestDate}
                onChangeText={(t) => updateField("dtHarvestDate", t)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <MaterialCommunityIcons name="calendar-blank-outline" size={24} color="#10B981" />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-bold text-[#374151] mb-2">Description</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827]"
              placeholder="Describe the freshness, farming methods..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.nvcharDescription}
              onChangeText={(t) => updateField("nvcharDescription", t)}
            />
          </View>

          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-bold text-[#374151]">Location</Text>
              <TouchableOpacity className="flex-row items-center">
                <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#10B981" />
                <Text className="text-[#10B981] text-xs font-bold ml-1">AUTO DETECT</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14">
              <MaterialCommunityIcons name="map-marker-outline" size={24} color="#10B981" />
              <TextInput
                className="flex-1 ml-2 text-[#111827]"
                placeholder="Enter farm location or city"
                value={formData.nvcharLocation}
                onChangeText={(t) => updateField("nvcharLocation", t)}
              />
            </View>
          </View>

          <View className="bg-[#F0FDF4] rounded-2xl p-4 mb-6">
            <View className="mb-4">
              <Text className="text-sm font-bold text-[#374151] mb-2">Quality Grade (ID)</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 h-12 text-[#111827]"
                placeholder="e.g. 1 (Premium), 2 (Standard)"
                keyboardType="numeric"
                value={formData.intQualityGradeId}
                onChangeText={(t) => updateField("intQualityGradeId", t)}
              />
            </View>

            <View className="flex-row justify-between items-center mt-2">
              <View>
                <Text className="text-sm font-bold text-[#374151]">Organic Produce</Text>
                <Text className="text-xs text-gray-500">Certified organic farming</Text>
              </View>
              <Switch
                trackColor={{ false: "#D1D5DB", true: "#A7F3D0" }}
                thumbColor={formData.ynOrganic ? "#10B981" : "#F3F4F6"}
                onValueChange={(val) => updateField("ynOrganic", val)}
                value={formData.ynOrganic}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handlePublish}
            disabled={isLoading}
            className={`flex-row justify-center items-center h-14 rounded-xl shadow-sm mb-8 ${isLoading ? "bg-green-400" : "bg-[#10B981]"}`}
          >
            <MaterialCommunityIcons name="publish" size={20} color="white" />
            <Text className="text-white text-lg font-bold ml-2">Publish Crop</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
