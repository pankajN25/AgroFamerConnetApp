import React, { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
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

const formatHarvestDateInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

export default function AddCropScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingCrop = route.params?.crop;
  const isEditMode = Boolean(route.params?.mode === "edit" || route.params?.isEdit || editingCrop);

  const [formData, setFormData] = useState({
    nvcharCropName: "",
    intCropCategoryId: "",
    floatQuantity: "",
    floatPricePerKg: "",
    dtHarvestDate: "",
    nvcharDescription: "",
    nvcharLocation: "",
    floatLatitude: null as number | null,
    floatLongitude: null as number | null,
    intQualityGradeId: "",
    ynOrganic: false,
  });

  const [cropImageUri, setCropImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [profileLocation, setProfileLocation] = useState("");
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string } | null>(null);
  const [isQualityModalVisible, setIsQualityModalVisible] = useState(false);
  const [selectedQualityGrade, setSelectedQualityGrade] = useState<{ id: number; name: string } | null>(null);
  const [isImageDirty, setIsImageDirty] = useState(false);

  const FALLBACK_CATEGORIES = [
    { id: 1, name: "Vegetables" },
    { id: 2, name: "Fruits" },
    { id: 3, name: "Grains" },
    { id: 4, name: "Pulses" },
    { id: 5, name: "Spices" },
    { id: 6, name: "Dairy" },
    { id: 7, name: "Other" },
  ];

  const QUALITY_GRADES = [
    { id: 1, name: "Premium" },
    { id: 2, name: "Standard" },
    { id: 3, name: "Economy" },
  ];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCropImageUri(result.assets[0].uri);
      setIsImageDirty(true);
    }
  };

  const updateField = (key: string, value: string | boolean | number | null) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const loadProfileLocation = async () => {
      try {
        const userString = await AsyncStorage.getItem("@farmer_user");
        if (!userString) return;
        const user = JSON.parse(userString);
        const locationParts = [
          user?.nvcharLocation,
          user?.intCityId,
          user?.intstateId,
          user?.intcountryId,
        ]
          .filter(Boolean)
          .map((v: any) => String(v).trim())
          .filter((v: string) => v.length > 0);

        const merged = Array.from(new Set(locationParts)).join(", ");
        if (merged) {
          setProfileLocation(merged);
        }
      } catch {
        // ignore profile location read errors
      }
    };

    loadProfileLocation();
  }, []);

  useEffect(() => {
    if (formData.intCropCategoryId && categories.length) {
      const match = categories.find((cat) => String(cat.id) === String(formData.intCropCategoryId));
      if (match) setSelectedCategory(match);
    }
  }, [categories, formData.intCropCategoryId]);

  useEffect(() => {
    if (formData.intQualityGradeId) {
      const match = QUALITY_GRADES.find((grade) => String(grade.id) === String(formData.intQualityGradeId));
      if (match) setSelectedQualityGrade(match);
      return;
    }

    const defaultGrade = QUALITY_GRADES[0];
    if (defaultGrade) {
      setSelectedQualityGrade(defaultGrade);
      updateField("intQualityGradeId", String(defaultGrade.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.intQualityGradeId]);

  useEffect(() => {
    if (!isEditMode || !editingCrop) return;

    const harvestRaw = String(editingCrop?.dtHarvestDate ?? "").trim();
    const harvestDate = harvestRaw ? harvestRaw.slice(0, 10) : "";

    const resolvedImage =
      editingCrop?._resolvedImageUrl ||
      cropService.resolveCropImageUrl(
        editingCrop?.nvcharCropImageUrl || editingCrop?.nvcharImageUrl || editingCrop?.imageUrl
      );

    setCropImageUri(resolvedImage || null);
    setIsImageDirty(false);

    setFormData((prev) => ({
      ...prev,
      nvcharCropName: String(editingCrop?.nvcharCropName ?? ""),
      intCropCategoryId: String(
        editingCrop?.intCropCategoryId ??
          editingCrop?.intCategoryId ??
          editingCrop?.categoryId ??
          ""
      ),
      floatQuantity: String(editingCrop?.floatQuantity ?? ""),
      floatPricePerKg: String(editingCrop?.floatPricePerKg ?? ""),
      dtHarvestDate: harvestDate,
      nvcharDescription: String(editingCrop?.nvcharDescription ?? ""),
      nvcharLocation: String(editingCrop?.nvcharLocation ?? ""),
      floatLatitude:
        editingCrop?.floatLatitude ??
        editingCrop?.float_latitude ??
        editingCrop?.latitude ??
        prev.floatLatitude,
      floatLongitude:
        editingCrop?.floatLongitude ??
        editingCrop?.float_longitude ??
        editingCrop?.longitude ??
        prev.floatLongitude,
      intQualityGradeId: String(editingCrop?.intQualityGradeId ?? editingCrop?.qualityGradeId ?? ""),
      ynOrganic: Boolean(editingCrop?.ynOrganic),
    }));
  }, [editingCrop, isEditMode]);

  useEffect(() => {
    const loadCategories = async () => {
      setIsCategoryLoading(true);
      try {
        const response = await cropService.getCropCategories();
        const list = cropService.extractCropCategories(response);
        const normalized = (Array.isArray(list) ? list : []).map((item: any) => {
          const rawId =
            item?.id ??
            item?.intCropCategoryId ??
            item?.intCategoryId ??
            item?.categoryId ??
            item?.int_crop_category_id;
          const name =
            item?.nvcharCropCategoryName ??
            item?.nvcharCategoryName ??
            item?.categoryName ??
            item?.nvcharCropCategory ??
            item?.name ??
            "";
          const id = Number(rawId);
          return Number.isFinite(id) && id > 0
            ? { id, name: String(name).trim() || `Category ${id}` }
            : null;
        }).filter(Boolean) as Array<{ id: number; name: string }>;

        const finalList = normalized.length ? normalized : FALLBACK_CATEGORIES;
        setCategories(finalList);

        if (formData.intCropCategoryId) {
          const match = finalList.find((c) => String(c.id) === String(formData.intCropCategoryId));
          if (match) setSelectedCategory(match);
        }
      } catch {
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setIsCategoryLoading(false);
      }
    };

    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
  );

  const formatAddress = (details: Location.LocationGeocodedAddress | null) => {
    if (!details) return "";
    const line1 = [details.name, details.streetNumber, details.street]
      .filter(Boolean)
      .join(" ")
      .trim();
    const parts = [
      line1,
      details.district,
      details.city || details.subregion,
      details.region,
      details.postalCode,
      details.country,
    ].filter(Boolean);
    return Array.from(new Set(parts)).join(", ");
  };

  const isAddressDetailed = (address: string) => {
    if (!address) return false;
    const hasLetters = /[a-zA-Z]/.test(address);
    const hasComma = address.includes(",");
    return hasLetters && (address.length > 12 || hasComma);
  };

  const addressMatchesProfile = (address: string, profile: string) => {
    if (!address || !profile) return false;
    const addressLower = address.toLowerCase();
    const tokens = profile
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length >= 3);
    if (tokens.length === 0) return false;
    return tokens.some((token) => addressLower.includes(token));
  };

  const fetchAddressFromOSM = async (latitude: number, longitude: number) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "AgroConnectApp/1.0 (support@agroconnect.local)",
      },
    });
    if (!res.ok) {
      throw new Error("OSM reverse geocode failed");
    }
    const data = await res.json();
    const addr = data?.address || {};
    const line1 = [addr.house_number, addr.road].filter(Boolean).join(" ").trim();
    const parts = [
      line1 || addr.neighbourhood || addr.suburb,
      addr.city || addr.town || addr.village || addr.county,
      addr.state,
      addr.postcode,
      addr.country,
    ].filter(Boolean);
    return (parts.join(", ") || data?.display_name || "").trim();
  };

  const handleAutoLocation = async () => {
    try {
      setIsLocating(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location Permission", "Please allow location access to auto detect your farm location.");
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert("GPS Disabled", "Please enable GPS/location services and try again.");
        return;
      }

      let position = null as Location.LocationObject | null;
      try {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch {
        position = await Location.getLastKnownPositionAsync();
      }

      if (!position?.coords) {
        Alert.alert("Location Error", "Unable to fetch GPS location. Please try again.");
        return;
      }

      const { latitude, longitude } = position.coords;
      updateField("floatLatitude", latitude);
      updateField("floatLongitude", longitude);

      const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
        new Promise<T>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("Reverse geocode timeout")), ms);
          promise
            .then((value) => {
              clearTimeout(timer);
              resolve(value);
            })
            .catch((err) => {
              clearTimeout(timer);
              reject(err);
            });
        });

      let address = "";
      try {
        const geo = await withTimeout(
          Location.reverseGeocodeAsync({ latitude, longitude }),
          8000
        );
        const first = geo && geo.length > 0 ? geo[0] : null;
        address = formatAddress(first);
      } catch {
        address = "";
      }

      if (!isAddressDetailed(address)) {
        try {
          const osmAddress = await withTimeout(fetchAddressFromOSM(latitude, longitude), 8000);
          if (osmAddress) {
            address = osmAddress;
          }
        } catch {
          // ignore; fallback to best available
        }
      }

      if (address) {
        const normalizedAddress = address.toLowerCase();
        const isUsa = normalizedAddress.includes("united states") || normalizedAddress.includes("usa");
        const hasProfile = Boolean(profileLocation);
        const matchesProfile = addressMatchesProfile(address, profileLocation);

        if (hasProfile && isUsa && !matchesProfile) {
          Alert.alert(
            "Location Mismatch",
            "Detected GPS location doesn't match your farm profile. Use your farm profile location instead?",
            [
              {
                text: "Use Farm Profile",
                onPress: () => updateField("nvcharLocation", profileLocation),
              },
              {
                text: "Keep GPS",
                onPress: () => updateField("nvcharLocation", address),
              },
            ]
          );
          return;
        }

        updateField("nvcharLocation", address);
      } else {
        updateField("nvcharLocation", `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        Alert.alert("Location Found", "Could not fetch full address. Using coordinates instead.");
      }
    } catch (error: any) {
      const message =
        error?.message?.includes("Location")
          ? error.message
          : "Unable to fetch location. Please check GPS and try again.";
      Alert.alert("Location Error", message);
    } finally {
      setIsLocating(false);
    }
  };

  const handlePublish = async () => {
    const parsedQuantity = parseFloat(formData.floatQuantity);
    const parsedPrice = parseFloat(formData.floatPricePerKg);
    const harvestDate = normalizeHarvestDate(formData.dtHarvestDate);

    if (!formData.nvcharCropName.trim()) {
      Alert.alert("Validation Error", "Please enter a Crop Name.");
      return;
    }

    if (!formData.intCropCategoryId) {
      Alert.alert("Validation Error", "Please select a crop category.");
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

      if (isEditMode) {
        const cropId =
          editingCrop?.id ??
          editingCrop?.intCropId ??
          editingCrop?.cropId ??
          editingCrop?.int_crop_id;

        if (!cropId) {
          throw new Error("Could not find crop id to update.");
        }

        let imageUrlToSave =
          editingCrop?.nvcharCropImageUrl ||
          editingCrop?.nvcharImageUrl ||
          editingCrop?.imageUrl ||
          "";

        if (isImageDirty && cropImageUri) {
          try {
            const uploadResponse = await cropService.uploadCropImage(cropImageUri, Number(cropId));
            const uploadedImageUrl = cropService.extractUploadedImageUrl(uploadResponse);
            if (uploadedImageUrl) {
              imageUrlToSave = uploadedImageUrl;
            }
          } catch {
            Alert.alert("Image Upload Failed", "Could not upload new image. Keeping the previous image.");
          }
        }

        const updatePayload = {
          id: Number(cropId),
          intFarmerId: farmerId,
          nvcharCropName: formData.nvcharCropName.trim(),
          intCropCategoryId: parseInt(formData.intCropCategoryId, 10) || 1,
          floatQuantity: parsedQuantity,
          floatPricePerKg: parsedPrice,
          dtHarvestDate: harvestDate,
          nvcharDescription: formData.nvcharDescription.trim(),
          nvcharLocation: formData.nvcharLocation.trim(),
          floatLatitude: formData.floatLatitude,
          floatLongitude: formData.floatLongitude,
          intQualityGradeId: parseInt(formData.intQualityGradeId, 10) || 1,
          ynOrganic: formData.ynOrganic,
          nvcharCropImageUrl: imageUrlToSave,
        };

        const editResponse = await cropService.editCrop(updatePayload);
        const updatedCrop = cropService.extractCropRecord(editResponse) ?? updatePayload;
        const resolvedImage = cropService.resolveCropImageUrl(updatedCrop?.nvcharCropImageUrl);

        Alert.alert("Success", "Crop updated successfully.");
        navigation.replace("CropDetails", {
          crop: {
            ...updatedCrop,
            _resolvedImageUrl: resolvedImage ?? cropImageUri,
          },
        });
        return;
      }

      const payload: AddCropPayload = {
        intFarmerId: farmerId,
        nvcharCropName: formData.nvcharCropName.trim(),
        intCropCategoryId: parseInt(formData.intCropCategoryId, 10) || 1,
        floatQuantity: parsedQuantity,
        floatPricePerKg: parsedPrice,
        dtHarvestDate: harvestDate,
        nvcharDescription: formData.nvcharDescription.trim(),
        nvcharLocation: formData.nvcharLocation.trim(),
        floatLatitude: formData.floatLatitude,
        floatLongitude: formData.floatLongitude,
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
          {isEditMode ? "Edit Crop" : "Add New Crop"}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
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
                <Text className="text-[#10B981] font-bold text-base">
                  {isEditMode ? "Update Crop Image" : "Upload Crop Image"}
                </Text>
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
            <Text className="text-sm font-bold text-[#374151] mb-2">Crop Category</Text>
            <TouchableOpacity
              onPress={() => {
                setCategorySearch("");
                setIsCategoryModalVisible(true);
              }}
              className="bg-white border border-gray-200 rounded-xl px-4 h-14 flex-row items-center"
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="sprout" size={20} color="#10B981" />
              <Text className={`flex-1 ml-3 text-base ${selectedCategory ? "text-[#111827]" : "text-[#9CA3AF]"}`}>
                {selectedCategory?.name || "Select category"}
              </Text>
              {isCategoryLoading ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <MaterialCommunityIcons name="chevron-down" size={22} color="#9CA3AF" />
              )}
            </TouchableOpacity>
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
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold text-[#374151]">Harvest Date</Text>
              <TouchableOpacity
                onPress={() => updateField("dtHarvestDate", getTodayDate())}
                className="px-2 py-1 rounded-full bg-[#ECFDF3]"
              >
                <Text className="text-[11px] font-bold text-[#059669]">TODAY</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14">
              <TextInput
                className="flex-1 text-[#111827]"
                placeholder="YYYY-MM-DD"
                value={formData.dtHarvestDate}
                onChangeText={(t) => updateField("dtHarvestDate", formatHarvestDateInput(t))}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="number-pad"
                maxLength={10}
              />
              <MaterialCommunityIcons name="calendar-blank-outline" size={24} color="#10B981" />
            </View>
            <Text className="text-[11px] text-[#9CA3AF] mt-2">Format: YYYY-MM-DD</Text>
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
              <View className="flex-row items-center">
                {profileLocation ? (
                  <TouchableOpacity
                    onPress={() => updateField("nvcharLocation", profileLocation)}
                    className="flex-row items-center mr-3"
                  >
                    <MaterialCommunityIcons name="map-marker-check" size={16} color="#059669" />
                    <Text className="text-[#059669] text-xs font-bold ml-1">USE FARM PROFILE</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={handleAutoLocation}
                  disabled={isLocating}
                  className="flex-row items-center"
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#10B981" />
                  )}
                  <Text className="text-[#10B981] text-xs font-bold ml-1">
                    {isLocating ? "LOCATING..." : "AUTO SELECT LOCATION"}
                  </Text>
                </TouchableOpacity>
              </View>
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
            {formData.floatLatitude !== null && formData.floatLongitude !== null ? (
              <Text className="text-[11px] text-[#9CA3AF] mt-2">
                GPS: {formData.floatLatitude.toFixed(5)}, {formData.floatLongitude.toFixed(5)}
              </Text>
            ) : null}
          </View>

          <View className="bg-[#F0FDF4] rounded-2xl p-4 mb-6">
            <View className="mb-4">
              <Text className="text-sm font-bold text-[#374151] mb-2">Quality Grade</Text>
              <TouchableOpacity
                onPress={() => setIsQualityModalVisible(true)}
                className="bg-white border border-gray-200 rounded-xl px-4 h-12 flex-row items-center"
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="shield-star-outline" size={18} color="#10B981" />
                <Text className={`flex-1 ml-3 text-sm ${selectedQualityGrade ? "text-[#111827]" : "text-[#9CA3AF]"}`}>
                  {selectedQualityGrade
                    ? `${selectedQualityGrade.name} (ID ${selectedQualityGrade.id})`
                    : "Select quality grade"}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
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
            <Text className="text-white text-lg font-bold ml-2">
              {isEditMode ? "Save Changes" : "Publish Crop"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isCategoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#fff",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 24,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "70%",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>Select Category</Text>
              <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 h-12 mb-3">
              <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-sm text-[#111827]"
                placeholder="Search category"
                placeholderTextColor="#9CA3AF"
                value={categorySearch}
                onChangeText={setCategorySearch}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    setSelectedCategory(cat);
                    updateField("intCropCategoryId", String(cat.id));
                    setIsCategoryModalVisible(false);
                    setCategorySearch("");
                  }}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderColor: "#F3F4F6",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 15, color: "#111827", fontWeight: "600" }}>{cat.name}</Text>
                  {selectedCategory?.id === cat.id && (
                    <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
              {filteredCategories.length === 0 && (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: "#9CA3AF", fontSize: 13 }}>No categories found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isQualityModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsQualityModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#fff",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 24,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "60%",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>Select Quality Grade</Text>
              <TouchableOpacity onPress={() => setIsQualityModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {QUALITY_GRADES.map((grade) => (
                <TouchableOpacity
                  key={grade.id}
                  onPress={() => {
                    setSelectedQualityGrade(grade);
                    updateField("intQualityGradeId", String(grade.id));
                    setIsQualityModalVisible(false);
                  }}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderColor: "#F3F4F6",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 15, color: "#111827", fontWeight: "600" }}>
                    {grade.name} (ID {grade.id})
                  </Text>
                  {selectedQualityGrade?.id === grade.id && (
                    <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
