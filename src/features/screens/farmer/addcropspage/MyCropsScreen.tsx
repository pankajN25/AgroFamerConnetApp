// src/features/farmer/screens/MyCropsScreen.tsx
import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, SafeAreaView, 
  FlatList, Image, ActivityIndicator, Alert, 
  ScrollView
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cropService } from "@/services/farmer/cropService";
import { parseStoredUser } from "@/src/utils/authSession";
// import { cropService } from "../api/cropService";

export default function MyCropsScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused(); // Refreshes data when you navigate back to this screen

  const [crops, setCrops] = useState<any[]>([]);
  const [cropImagesByCropId, setCropImagesByCropId] = useState<Record<string, string | null>>({});
  const [filteredCrops, setFilteredCrops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Tabs: "All Crops", "ACTIVE", "SOLD", "PENDING"
  const [activeTab, setActiveTab] = useState("All Crops");
  const tabs = ["All Crops", "ACTIVE", "SOLD", "PENDING"];

  const getCropImageUrl = (crop: any): string | null => {
    const fromMap = cropImagesByCropId[String(crop?.id)];
    if (fromMap) return fromMap;
    return cropService.extractImageUrl(crop);
  };

  useEffect(() => {
    if (isFocused) {
      fetchMyCrops();
    }
  }, [isFocused]);

  const extractCropList = (response: any): any[] => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    if (response?.status === "success" && Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  };

  const normalizeFarmerId = (value: any): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const fetchMyCrops = async () => {
    setIsLoading(true);
    let cropsToEnrich: any[] = [];

    try {
      // 1. Get current farmer's ID
      const userString = await AsyncStorage.getItem('@farmer_user');
      const user = parseStoredUser(userString);
      const farmerId = normalizeFarmerId(user?.id);
      if (!farmerId) {
        setCrops([]);
        setFilteredCrops([]);
        return;
      }

      // 2. Fetch all crops + bulk images in parallel
      const [response, cropImagesResponse] = await Promise.all([
        cropService.getCrops(),
        cropService.getCropImages().catch(() => null),
      ]);

      const cropImages = cropService.extractCropImages(cropImagesResponse);
      const allCrops = extractCropList(response);

      if (allCrops.length) {
        // 3. Filter to only this farmer's crops
        const myCrops = allCrops.filter((crop: any) => {
          const cropFarmerId = normalizeFarmerId(
            crop?.intFarmerId ?? crop?.farmerId ?? crop?.int_farmer_id ?? crop?.intFarmerID
          );
          return cropFarmerId === farmerId;
        });

        // 4. Build image map from bulk response
        const imageMap: Record<string, string | null> = {};
        for (const image of cropImages) {
          const cropId = image?.intCropId ?? image?.crop_id;
          if (!cropId) continue;
          const key = String(cropId);
          if (!imageMap[key]) {
            const resolved = cropService.extractImageUrl(image);
            if (resolved) imageMap[key] = resolved;
          }
        }

        // 5. Show crops immediately — spinner stops here
        setCropImagesByCropId(imageMap);
        setCrops(myCrops);
        applyFilters(myCrops, activeTab, searchQuery);

        // 6. Mark crops that still need per-crop image fetch
        cropsToEnrich = myCrops.filter(c => !imageMap[String(c.id)]);
      } else {
        setCrops([]);
        setFilteredCrops([]);
      }
    } catch (error) {
      console.log("Error fetching crops:", error);
    } finally {
      // ✅ Stop spinner NOW — crops already visible above
      setIsLoading(false);
    }

    // 7. Background: fetch missing images without blocking the UI
    if (cropsToEnrich.length > 0) {
      const updates: Record<string, string> = {};
      for (const crop of cropsToEnrich) {
        try {
          const res = await cropService.getCropImagesByCropId(crop.id);
          const imgs = cropService.extractCropImages(res);
          const url = cropService.extractImageUrl(imgs[0]);
          if (url) updates[String(crop.id)] = url;
        } catch {}
      }
      if (Object.keys(updates).length > 0) {
        setCropImagesByCropId(prev => ({ ...prev, ...updates }));
      }
    }
  };

  const applyFilters = (data: any[], tab: string, search: string) => {
    let filtered = data;
    
    // Filter by Tab
    if (tab !== "All Crops") {
      filtered = filtered.filter(crop => crop.nvcharStatus?.toUpperCase() === tab);
    }
    
    // Filter by Search text
    if (search.trim()) {
      filtered = filtered.filter(crop => 
        crop.nvcharCropName?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredCrops(filtered);
  };

  // Run filters whenever tab or search changes
  useEffect(() => {
    applyFilters(crops, activeTab, searchQuery);
  }, [activeTab, searchQuery, crops]);

  const handleDelete = (cropId: number) => {
    Alert.alert(
      "Delete Crop",
      "Are you sure you want to delete this crop? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await cropService.deleteCrop(cropId);
              // Remove from local state instantly for good UX
              const updatedCrops = crops.filter(c => c.id !== cropId);
              setCrops(updatedCrops);
              Alert.alert("Success", "Crop deleted.");
            } catch (error) {
              Alert.alert("Error", "Could not delete crop.");
            }
          }
        }
      ]
    );
  };

  const openCropDetails = (crop: any) => {
    const resolvedImage = getCropImageUrl(crop);
    navigation.navigate("CropDetails", {
      crop: {
        ...crop,
        nvcharCropImageUrl: resolvedImage ?? crop.nvcharCropImageUrl,
        _resolvedImageUrl: resolvedImage,
      },
    });
  };

  // --- RENDER SINGLE CROP CARD ---
  const renderCropCard = ({ item }: { item: any }) => {
    const cropImageUrl = getCropImageUrl(item);

    return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => openCropDetails(item)}
      className="bg-white rounded-3xl p-4 mb-4 shadow-sm border border-gray-100 mx-6"
    >
      <View className="flex-row">
        <View className="w-24 h-24 bg-[#F4F9F4] rounded-2xl items-center justify-center overflow-hidden">
          {cropImageUrl ? (
            <Image source={{ uri: cropImageUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name="sprout" size={32} color="#10B981" />
          )}
        </View>

        {/* Details Box */}
        <View className="flex-1 ml-4 justify-center">
          <View className="flex-row justify-between items-start">
            <Text className="text-lg font-bold text-[#111827] flex-1 mr-2" numberOfLines={1}>
              {item.nvcharCropName}
            </Text>
            {/* Status Badge */}
            <View className={`px-2 py-1 rounded-md ${item.nvcharStatus === 'SOLD' ? 'bg-gray-100' : 'bg-green-50'}`}>
              <Text className={`text-[10px] font-bold ${item.nvcharStatus === 'SOLD' ? 'text-gray-500' : 'text-[#10B981]'}`}>
                {item.nvcharStatus || "ACTIVE"}
              </Text>
            </View>
          </View>

          <Text className="text-[#6B7280] text-sm mt-1">{item.floatQuantity} kg available</Text>
          <Text style={{ color: "#16A34A", fontWeight: "800", fontSize: 15, marginTop: 4 }}>₹{item.floatPricePerKg} / kg</Text>
          
          <View className="flex-row items-center mt-1">
            <MaterialCommunityIcons name="map-marker-outline" size={12} color="#9CA3AF" />
            <Text className="text-[#9CA3AF] text-xs ml-1" numberOfLines={1}>{item.nvcharLocation}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View className="flex-row justify-between mt-4 space-x-3">
        <TouchableOpacity
          onPress={() => openCropDetails(item)}
          className="flex-1 bg-green-50 py-3 rounded-xl flex-row items-center justify-center"
        >
          <MaterialCommunityIcons name="pencil" size={16} color="#10B981" />
          <Text className="text-[#10B981] font-bold ml-2">View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => handleDelete(item.id)}
          className="flex-1 bg-gray-50 py-3 rounded-xl flex-row items-center justify-center"
        >
          <MaterialCommunityIcons name="trash-can-outline" size={16} color="#6B7280" />
          <Text className="text-[#6B7280] font-bold ml-2">Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F9F4]">

      {/* ── Header ── */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 42, height: 42, backgroundColor: "#fff", borderRadius: 21, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#111827" }}>My Crops</Text>
          <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "500" }}>{filteredCrops.length} crops listed</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications")}
          style={{ width: 42, height: 42, backgroundColor: "#fff", borderRadius: 21, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
        >
          <MaterialCommunityIcons name="bell-outline" size={20} color="#374151" />
          <View style={{ position: "absolute", top: 10, right: 10, width: 8, height: 8, backgroundColor: "#16A34A", borderRadius: 4, borderWidth: 1.5, borderColor: "#F4F9F4" }} />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 10 }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 14, height: 50, elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
          <MaterialCommunityIcons name="magnify" size={22} color="#9CA3AF" />
          <TextInput
            style={{ flex: 1, marginLeft: 8, fontSize: 15, color: "#111827" }}
            placeholder="Search your crops..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={{ width: 50, height: 50, backgroundColor: "#16A34A", borderRadius: 16, alignItems: "center", justifyContent: "center", elevation: 3, shadowColor: "#16A34A", shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}>
          <MaterialCommunityIcons name="tune-variant" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* ── Pill Tabs ── */}
      <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {tabs.map(tab => {
            const active = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: active ? "#16A34A" : "#fff",
                  borderWidth: active ? 0 : 1, borderColor: "#E5E7EB",
                  elevation: active ? 3 : 0,
                  shadowColor: active ? "#16A34A" : "transparent",
                  shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
                }}
              >
                <Text style={{ fontWeight: "700", fontSize: 13, color: active ? "#fff" : "#6B7280" }}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Crop List ── */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <FlatList
          data={filteredCrops}
          extraData={cropImagesByCropId}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCropCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 80, paddingHorizontal: 32 }}>
              <View style={{ width: 80, height: 80, backgroundColor: "#F3F4F6", borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <MaterialCommunityIcons name="sprout-outline" size={40} color="#D1D5DB" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#374151", marginBottom: 8 }}>No crops found</Text>
              <Text style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, lineHeight: 20 }}>
                {searchQuery ? "Try adjusting your search or filters." : "You haven't added any crops yet. Tap + to start selling!"}
              </Text>
            </View>
          }
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        onPress={() => navigation.navigate("AddCrop" as never)}
        style={{
          position: "absolute", bottom: 24, right: 20,
          width: 60, height: 60, backgroundColor: "#16A34A", borderRadius: 30,
          alignItems: "center", justifyContent: "center",
          elevation: 8, shadowColor: "#16A34A", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
        }}
      >
        <MaterialCommunityIcons name="plus" size={30} color="white" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}
