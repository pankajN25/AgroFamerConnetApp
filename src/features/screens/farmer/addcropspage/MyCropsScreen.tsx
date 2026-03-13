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

  const getCropImageUrl = (crop: any) =>
    cropImagesByCropId[String(crop?.id)] ||
    cropService.resolveCropImageUrl(
      crop?.nvcharCropImageUrl || crop?.nvcharImageUrl || crop?.imageUrl
    );

  useEffect(() => {
    if (isFocused) {
      fetchMyCrops();
    }
  }, [isFocused]);

  const fetchMyCrops = async () => {
    setIsLoading(true);
    try {
      // 1. Get current farmer's ID
      const userString = await AsyncStorage.getItem('@farmer_user');
      if (!userString) return;
      const farmerId = JSON.parse(userString).id;

      // 2. Fetch all crops
      const response = await cropService.getCrops();
      const cropImagesResponse = await cropService.getCropImages();
      const cropImages = cropService.extractCropImages(cropImagesResponse);
      
      if (response && response.status === "success") {
        // 3. Filter crops to ONLY show this farmer's crops
        const myCrops = response.data.filter((crop: any) => crop.intFarmerId === farmerId);
        const imageMap = cropImages.reduce((acc: Record<string, string | null>, image: any) => {
          const cropId = image?.intCropId ?? image?.crop_id;
          if (!cropId) {
            return acc;
          }

          if (!acc[String(cropId)]) {
            acc[String(cropId)] = cropService.resolveCropImageUrl(
              image?.nvcharImageUrl || image?.imageUrl || image?.url
            );
          }

          return acc;
        }, {});

        setCropImagesByCropId(imageMap);
        setCrops(myCrops);
        applyFilters(myCrops, activeTab, searchQuery);

        for (const crop of myCrops) {
          const cropKey = String(crop.id);
          if (imageMap[cropKey]) {
            continue;
          }

          try {
            const cropImageByIdResponse = await cropService.getCropImagesByCropId(crop.id);
            const cropSpecificImages = cropService.extractCropImages(cropImageByIdResponse);
            const firstImage = cropSpecificImages[0];
            const resolvedImage = cropService.resolveCropImageUrl(
              firstImage?.nvcharImageUrl || firstImage?.imageUrl || firstImage?.url
            );

            if (resolvedImage) {
              imageMap[cropKey] = resolvedImage;
            }
          } catch (cropImageError) {
            console.log(`Error fetching image for crop ${crop.id}:`, cropImageError);
          }
        }

        setCropImagesByCropId({ ...imageMap });
      }
    } catch (error) {
      console.log("Error fetching crops:", error);
    } finally {
      setIsLoading(false);
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
    navigation.navigate("CropDetails", {
      crop: {
        ...crop,
        nvcharCropImageUrl: getCropImageUrl(crop),
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
          <Text className="text-[#10B981] font-bold text-base mt-1">₹{item.floatPricePerKg} / kg</Text>
          
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
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      
      {/* ---------------- HEADER ---------------- */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#111827]">My Crops</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications")}
          className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
        >
          <MaterialCommunityIcons name="bell-outline" size={20} color="#111827" />
          <View className="absolute top-2 right-2 w-2 h-2 bg-[#10B981] rounded-full" />
        </TouchableOpacity>
      </View>

      {/* ---------------- SEARCH & FILTER ---------------- */}
      <View className="flex-row px-6 mt-4 mb-4 space-x-3">
        <View className="flex-1 flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 shadow-sm h-14">
          <MaterialCommunityIcons name="magnify" size={24} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-[#111827]"
            placeholder="Search your crops..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity className="w-14 h-14 bg-[#10B981] rounded-2xl items-center justify-center shadow-sm shadow-green-200">
          <MaterialCommunityIcons name="tune-variant" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* ---------------- TABS ---------------- */}
      <View className="px-6 mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full mr-3 ${activeTab === tab ? 'bg-[#10B981]' : 'bg-white border border-gray-100 shadow-sm'}`}
            >
              <Text className={`font-bold ${activeTab === tab ? 'text-white' : 'text-[#6B7280]'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ---------------- CROP LIST ---------------- */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={filteredCrops}
          extraData={cropImagesByCropId}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCropCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 px-6">
              <MaterialCommunityIcons name="sprout-outline" size={64} color="#D1D5DB" />
              <Text className="text-xl font-bold text-[#374151] mt-4">No crops found</Text>
              <Text className="text-center text-[#9CA3AF] mt-2">
                {searchQuery ? "Try adjusting your search or filters." : "You haven't added any crops yet. Tap the + button to start selling!"}
              </Text>
            </View>
          }
        />
      )}

      {/* ---------------- FLOATING ACTION BUTTON ---------------- */}
      <TouchableOpacity
        onPress={() => navigation.navigate("AddCrop" as never)}
        className="absolute bottom-6 right-6 w-16 h-16 bg-[#10B981] rounded-full items-center justify-center shadow-lg shadow-green-500/40"
      >
        <MaterialCommunityIcons name="plus" size={32} color="white" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}
