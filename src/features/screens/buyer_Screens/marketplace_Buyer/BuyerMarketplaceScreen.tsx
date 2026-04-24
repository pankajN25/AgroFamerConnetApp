import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { buyerCropService } from "@/services/buyer/buyerCropService";

const CATEGORIES = [
  { label: "All", id: null, icon: "view-grid-outline" },
  { label: "Vegetables", id: 1, icon: "food-variant" },
  { label: "Fruits", id: 2, icon: "fruit-cherries" },
  { label: "Grains", id: 3, icon: "grain" },
  { label: "Pulses", id: 4, icon: "sprout" },
  { label: "Spices", id: 5, icon: "shaker" },
  { label: "Dairy", id: 6, icon: "cow" },
  { label: "Other", id: 7, icon: "tag-outline" },
];

const FILTER_CHIPS = ["All", "Organic", "Grade A", "In Stock"];
const SORT_OPTIONS = ["Default", "Price Low", "Price High", "Newest"];

const QUALITY_LABEL: Record<number, string> = {
  1: "Grade A",
  2: "Grade B",
  3: "Grade C",
};

export default function BuyerMarketplaceScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [allCrops, setAllCrops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState(FILTER_CHIPS[0]);
  const [activeSort, setActiveSort] = useState(SORT_OPTIONS[0]);
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadCrops();
    }
  }, [isFocused]);

  const loadCrops = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await buyerCropService.getCrops();
      const list = buyerCropService.extractCropList(response);
      setAllCrops(list);
    } catch (e) {
      setAllCrops([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const displayCrops = useMemo(() => {
    let list = allCrops.filter((c: any) => c.nvcharStatus !== "SOLD" && !c.ynDeleted);

    if (activeCategoryId !== null) {
      list = list.filter((c: any) => Number(c.intCropCategoryId) === activeCategoryId);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((c: any) => {
        const name = String(c.nvcharCropName || "").toLowerCase();
        const location = String(c.nvcharLocation || "").toLowerCase();
        const categoryLabel =
          CATEGORIES.find((cat) => cat.id === Number(c.intCropCategoryId))?.label.toLowerCase() || "";
        return name.includes(q) || location.includes(q) || categoryLabel.includes(q);
      });
    }

    if (activeFilter === "Organic") {
      list = list.filter((c: any) => c.ynOrganic === true || c.ynOrganic === 1);
    }

    if (activeFilter === "Grade A") {
      list = list.filter((c: any) => Number(c.intQualityGradeId) === 1);
    }

    if (activeFilter === "In Stock") {
      list = list.filter((c: any) => Number(c.floatQuantity) > 0);
    }

    if (activeSort === "Price Low") {
      list = [...list].sort((a: any, b: any) => Number(a.floatPricePerKg) - Number(b.floatPricePerKg));
    }

    if (activeSort === "Price High") {
      list = [...list].sort((a: any, b: any) => Number(b.floatPricePerKg) - Number(a.floatPricePerKg));
    }

    if (activeSort === "Newest") {
      list = [...list].sort((a: any, b: any) => Number(b.id) - Number(a.id));
    }

    return list;
  }, [allCrops, activeCategoryId, activeFilter, activeSort, searchQuery]);

  const renderCropCard = ({ item }: { item: any }) => {
    const imageUrl =
      buyerCropService.resolveCropImageUrl(item.nvcharCropImageUrl) ||
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=300&q=80";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate("BuyerCropDetails", { crop: item })}
        className="bg-white rounded-2xl mb-4 overflow-hidden"
        style={{ width: "48%", borderWidth: 1, borderColor: "#F3F4F6" }}
      >
        <View className="w-full h-36 bg-gray-100 relative">
          <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
          {(item.ynOrganic === true || item.ynOrganic === 1) && (
            <View
              className="absolute top-2 left-2 flex-row items-center rounded-full px-2 py-0.5"
              style={{ backgroundColor: "#ECFDF5" }}
            >
              <MaterialCommunityIcons name="leaf" size={10} color="#10B981" />
              <Text className="text-[10px] font-bold text-[#10B981] ml-0.5">Organic</Text>
            </View>
          )}
          <TouchableOpacity
            className="absolute top-2 right-2 w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            <MaterialCommunityIcons name="heart-outline" size={16} color="#374151" />
          </TouchableOpacity>
        </View>

        <View className="p-3">
          <Text className="text-[#111827] font-bold text-sm mb-0.5" numberOfLines={1}>
            {item.nvcharCropName}
          </Text>
          <View className="flex-row items-center mb-2">
            <MaterialCommunityIcons name="map-marker-outline" size={11} color="#9CA3AF" />
            <Text className="text-[#9CA3AF] text-xs ml-0.5 flex-1" numberOfLines={1}>
              {item.nvcharLocation || "Farm location"}
            </Text>
          </View>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="weight-kilogram" size={12} color="#9CA3AF" />
              <Text className="text-[#9CA3AF] text-[10px] ml-1">
                {item.floatQuantity ?? 0} kg
              </Text>
            </View>
            {QUALITY_LABEL[Number(item.intQualityGradeId)] ? (
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF" }}>
                <Text className="text-[10px] font-bold text-[#1D4ED8]">
                  {QUALITY_LABEL[Number(item.intQualityGradeId)]}
                </Text>
              </View>
            ) : null}
          </View>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[#10B981] font-extrabold text-base leading-tight">
                Rs {item.floatPricePerKg}
              </Text>
              <Text className="text-[#9CA3AF] text-[10px]">per kg</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("BuyerCropDetails", { crop: item })}
              className="w-8 h-8 rounded-xl items-center justify-center"
              style={{ backgroundColor: "#EFF6FF" }}
            >
              <MaterialCommunityIcons name="cart-plus" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F7FB]">
      <View className="bg-white px-5 pt-5 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-[#9CA3AF] text-xs font-medium">Discover</Text>
            <Text className="text-[#111827] text-xl font-extrabold">Marketplace</Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "#F3F4F6" }}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color="#374151" />
            <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </TouchableOpacity>
        </View>

        <View
          className="flex-row items-center rounded-xl px-4 h-12"
          style={{ backgroundColor: "#F3F4F6" }}
        >
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-sm text-[#111827]"
            placeholder="Search crops, location..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("") }>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="bg-white border-b border-gray-100">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => String(item.label)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
          renderItem={({ item }) => {
            const isActive = activeCategoryId === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategoryId(item.id)}
                className="flex-row items-center rounded-full px-4 py-2"
                style={{
                  backgroundColor: isActive ? "#1D4ED8" : "#F3F4F6",
                }}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={15}
                  color={isActive ? "#fff" : "#6B7280"}
                />
                <Text
                  className="ml-1.5 text-sm font-bold"
                  style={{ color: isActive ? "#fff" : "#6B7280" }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View className="bg-white">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {FILTER_CHIPS.map((chip) => {
            const active = chip === activeFilter;
            return (
              <TouchableOpacity
                key={chip}
                onPress={() => setActiveFilter(chip)}
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: active ? "#1D4ED8" : "#F3F4F6" }}
              >
                <Text className="text-xs font-bold" style={{ color: active ? "#fff" : "#6B7280" }}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View className="bg-white px-5 pb-2">
        <TouchableOpacity
          onPress={() => setShowSort((v) => !v)}
          className="flex-row items-center self-start rounded-full px-4 py-2"
          style={{ backgroundColor: activeSort !== "Default" ? "#1D4ED8" : "#F3F4F6" }}
        >
          <MaterialCommunityIcons name="sort" size={16} color={activeSort !== "Default" ? "#fff" : "#6B7280"} />
          <Text className="ml-2 text-xs font-bold" style={{ color: activeSort !== "Default" ? "#fff" : "#6B7280" }}>
            {activeSort}
          </Text>
        </TouchableOpacity>
        {showSort ? (
          <View className="mt-2 bg-white rounded-xl p-3" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
            <Text className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Sort By</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {SORT_OPTIONS.map((opt) => {
                const active = opt === activeSort;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      setActiveSort(opt);
                      setShowSort(false);
                    }}
                    className="rounded-full px-4 py-2"
                    style={{ backgroundColor: active ? "#1D4ED8" : "#F3F4F6" }}
                  >
                    <Text className="text-xs font-bold" style={{ color: active ? "#fff" : "#6B7280" }}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      {!isLoading && (
        <View className="px-5 pt-4 pb-1">
          <Text className="text-[#9CA3AF] text-xs font-semibold">
            {displayCrops.length} crop{displayCrops.length !== 1 ? "s" : ""} available
          </Text>
        </View>
      )}

      <View className="flex-1 px-5">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-[#9CA3AF] text-sm font-semibold mt-3">Loading crops...</Text>
          </View>
        ) : displayCrops.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#F3F4F6" }}
            >
              <MaterialCommunityIcons name="sprout-outline" size={40} color="#D1D5DB" />
            </View>
            <Text className="text-[#111827] font-bold text-base">No crops found</Text>
            <Text className="text-[#9CA3AF] text-sm mt-1 text-center">
              Try a different category or search term
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayCrops}
            keyExtractor={(item, index) => String(item.id ?? index)}
            renderItem={renderCropCard}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 110 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
