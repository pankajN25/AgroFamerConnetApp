import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { buyerCropService } from "@/services/buyer/buyerCropService";

const CATEGORY_MAP: Record<string, number | null> = {
  "All Crops": null,
  Grains: 1,
  Vegetables: 2,
  Fruits: 3,
};

const tabs = Object.keys(CATEGORY_MAP);

export default function BuyerMarketplaceScreen() {
  const navigation = useNavigation<any>();
  const [crops, setCrops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All Crops");

  useEffect(() => {
    fetchCrops(activeTab);
  }, [activeTab]);

  const fetchCrops = async (tabName: string) => {
    setIsLoading(true);

    try {
      const categoryId = CATEGORY_MAP[tabName];
      const response =
        categoryId === null
          ? await buyerCropService.getCrops()
          : await buyerCropService.getCropsByCategoryId(categoryId);

      const list = buyerCropService.extractCropList(response);
      const activeCrops = list.filter((crop: any) => crop.nvcharStatus !== "SOLD" && crop.ynDeleted !== true);
      setCrops(activeCrops);
    } catch (error) {
      console.error("Error fetching crops:", error);
      setCrops([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCrops = crops.filter((crop) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      String(crop.nvcharCropName || "").toLowerCase().includes(query) ||
      String(crop.nvcharLocation || "").toLowerCase().includes(query)
    );
  });

  const renderCropCard = ({ item }: { item: any }) => {
    let imageUrl = buyerCropService.resolveCropImageUrl(item.nvcharCropImageUrl);
    if (!imageUrl) {
      imageUrl = "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80";
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate("BuyerCropDetails", { crop: item })}
        className="bg-white w-[48%] rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden"
      >
        <View className="relative h-32 w-full bg-gray-100">
          <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
          <TouchableOpacity className="absolute top-2 right-2 bg-white/90 w-8 h-8 rounded-full items-center justify-center shadow-sm">
            <MaterialCommunityIcons name="heart-outline" size={18} color="#111827" />
          </TouchableOpacity>
        </View>

        <View className="p-3">
          <Text className="text-[#111827] font-bold text-base mb-1" numberOfLines={1}>
            {item.nvcharCropName}
          </Text>

          <View className="flex-row items-center mb-2">
            <MaterialCommunityIcons name="map-marker-outline" size={12} color="#6B7280" />
            <Text className="text-[#6B7280] text-xs ml-1 flex-1" numberOfLines={1}>
              {item.nvcharLocation || "Farm Location"}
            </Text>
          </View>

          <Text className="text-[#00E600] font-extrabold text-lg">
            Rs. {item.floatPricePerKg} <Text className="text-[10px] text-gray-500 font-normal">/ kg</Text>
          </Text>

          <Text className="text-[#6B7280] text-[10px] mt-1">
            Stock: {item.floatQuantity}kg available
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Text className="text-2xl font-extrabold text-[#111827]">Marketplace</Text>
        <TouchableOpacity className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
          <MaterialCommunityIcons name="bell-outline" size={24} color="#00E600" />
          <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-white" />
        </TouchableOpacity>
      </View>

      <View className="px-6 py-3 flex-row items-center space-x-3">
        <View className="flex-1 flex-row items-center bg-white border border-gray-100 rounded-xl px-4 h-12 shadow-sm">
          <MaterialCommunityIcons name="magnify" size={22} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-sm text-[#111827]"
            placeholder="Search crops (e.g. Corn, Wheat)"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity className="w-12 h-12 bg-[#00E600] rounded-xl items-center justify-center shadow-sm">
          <MaterialCommunityIcons name="tune-variant" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="pl-6 py-2">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveTab(item)}
              className={`px-5 py-2 rounded-full mr-2 ${
                activeTab === item ? "bg-[#00E600]" : "bg-white border border-gray-200"
              }`}
            >
              <Text
                className={`font-bold text-sm ${
                  activeTab === item ? "text-white" : "text-[#6B7280]"
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View className="flex-1 px-6 pt-4">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#00E600" />
          </View>
        ) : filteredCrops.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <MaterialCommunityIcons name="sprout-outline" size={64} color="#D1D5DB" />
            <Text className="text-[#6B7280] font-bold mt-4">No crops available right now.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCrops}
            keyExtractor={(item, index) => String(item.id ?? index)}
            renderItem={renderCropCard}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
