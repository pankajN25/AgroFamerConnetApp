// src/features/farmer/screens/marketplace/FarmerMarketplaceScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  FlatList, Image, ActivityIndicator, RefreshControl,
  StatusBar, ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cropService } from "@/services/farmer/cropService";

// ── constants ───────────────────────────────────────────────────────────────
const QUALITY_LABEL: Record<number, string> = {
  1: "Grade A",
  2: "Grade B",
  3: "Grade C",
};

const CATEGORY_LABEL: Record<number, string> = {
  1: "Vegetables",
  2: "Fruits",
  3: "Grains",
  4: "Pulses",
  5: "Spices",
  6: "Dairy",
  7: "Other",
};

const SORT_OPTIONS = ["Default", "Price ↑", "Price ↓", "Newest", "Qty ↑"];
const FILTER_CHIPS = ["All", "Organic", "Grade A", "Vegetables", "Fruits", "Grains"];

// ── helpers ─────────────────────────────────────────────────────────────────
const formatDate = (v?: string) => {
  if (!v) return "—";
  const d = new Date(`${v}T00:00:00`);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=400&q=80";

// ── crop card ────────────────────────────────────────────────────────────────
function CropCard({ item, onPress }: { item: any; onPress: () => void }) {
  const isOrganic = item.ynOrganic === true || item.ynOrganic === 1;
  const isActive  = (item.nvcharStatus || "ACTIVE").toUpperCase() === "ACTIVE";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 20,
        margin: 6,
        overflow: "hidden",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.09,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      {/* Image */}
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: item._resolvedImageUrl || PLACEHOLDER_IMAGE }}
          style={{ width: "100%", height: 130, backgroundColor: "#F0FDF4" }}
          resizeMode="cover"
        />
        {/* Status chip top-left */}
        {!isActive && (
          <View style={{ position: "absolute", top: 8, left: 8, backgroundColor: "rgba(17,24,39,0.7)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{item.nvcharStatus}</Text>
          </View>
        )}
        {/* Organic badge top-right */}
        {isOrganic && (
          <View style={{ position: "absolute", top: 8, right: 8, backgroundColor: "#16A34A", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons name="leaf" size={10} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800", marginLeft: 3 }}>ORGANIC</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#111827", marginBottom: 4 }} numberOfLines={1}>
          {item.nvcharCropName}
        </Text>

        {/* Price */}
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#16A34A" }}>
          ₹{item.floatPricePerKg}
          <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF" }}>/kg</Text>
        </Text>

        {/* Qty */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
          <MaterialCommunityIcons name="weight-kilogram" size={12} color="#9CA3AF" />
          <Text style={{ fontSize: 11, color: "#6B7280", marginLeft: 4 }}>{item.floatQuantity} kg available</Text>
        </View>

        {/* Location */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <MaterialCommunityIcons name="map-marker-outline" size={12} color="#9CA3AF" />
          <Text style={{ fontSize: 11, color: "#6B7280", marginLeft: 4, flex: 1 }} numberOfLines={1}>
            {item.nvcharLocation || "Location N/A"}
          </Text>
        </View>

        {/* Quality */}
        {QUALITY_LABEL[item.intQualityGradeId] && (
          <View style={{ marginTop: 8, backgroundColor: "#F0FDF4", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#16A34A" }}>
              {QUALITY_LABEL[item.intQualityGradeId]}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View style={{ alignItems: "center", marginTop: 80, paddingHorizontal: 32 }}>
      <View style={{ width: 80, height: 80, backgroundColor: "#F0FDF4", borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <MaterialCommunityIcons name="storefront-outline" size={40} color="#BBF7D0" />
      </View>
      <Text style={{ fontSize: 18, fontWeight: "800", color: "#374151", marginBottom: 8 }}>No Crops Found</Text>
      <Text style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
        No other farmers have listed crops yet, or your filters are too narrow.
      </Text>
      <TouchableOpacity onPress={onRefresh} style={{ backgroundColor: "#16A34A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────
export default function FarmerMarketplaceScreen() {
  const navigation = useNavigation<any>();
  const isFocused  = useIsFocused();

  const [allCrops, setAllCrops]     = useState<any[]>([]);
  const [imageMap, setImageMap]     = useState<Record<string, string>>({});
  const [myFarmerId, setMyFarmerId] = useState<number | null>(null);

  const [search,      setSearch]      = useState("");
  const [activeChip,  setActiveChip]  = useState("All");
  const [activeSort,  setActiveSort]  = useState("Default");
  const [showSort,    setShowSort]    = useState(false);
  const [isLoading,   setIsLoading]   = useState(true);
  const [isRefreshing,setIsRefreshing]= useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // ── fetch ──────────────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      // 1. get current farmer id
      const raw = await AsyncStorage.getItem("@farmer_user");
      const fid = raw ? (JSON.parse(raw)?.id ?? null) : null;
      setMyFarmerId(fid);

      // 2. fetch all crops + all images in parallel
      const [cropsRes, imagesRes] = await Promise.all([
        cropService.getCrops(),
        cropService.getCropImages().catch(() => null),
      ]);

      // 3. extract crop list (handles { status, data } or raw array)
      const cropList: any[] = Array.isArray(cropsRes)
        ? cropsRes
        : Array.isArray(cropsRes?.data) ? cropsRes.data : [];

      // 4. build image map from bulk response
      const newMap: Record<string, string> = {};
      if (imagesRes) {
        const imgs = cropService.extractCropImages(imagesRes);
        for (const img of imgs) {
          const cid = String(img?.intCropId ?? img?.crop_id ?? "");
          if (cid && !newMap[cid]) {
            const url = cropService.extractImageUrl(img);
            if (url) newMap[cid] = url;
          }
        }
      }

      // 5. for crops missing an image in the bulk map, fall back to per-crop field
      for (const crop of cropList) {
        const key = String(crop.id);
        if (!newMap[key]) {
          const inline = cropService.extractImageUrl(crop);
          if (inline) newMap[key] = inline;
        }
      }

      setImageMap(newMap);
      setAllCrops(cropList);
    } catch (err: any) {
      setError("Could not load crops. Check your network connection.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { if (isFocused) load(); }, [isFocused]);

  const onRefresh = () => { setIsRefreshing(true); load(true); };

  // ── derived list ───────────────────────────────────────────────────────
  const displayCrops = useMemo(() => {
    // exclude own crops
    let list = allCrops.filter(c => c.intFarmerId !== myFarmerId);

    // attach resolved image
    list = list.map(c => ({ ...c, _resolvedImageUrl: imageMap[String(c.id)] || null }));

    // search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(c =>
        c.nvcharCropName?.toLowerCase().includes(q) ||
        c.nvcharLocation?.toLowerCase().includes(q) ||
        (CATEGORY_LABEL[c.intCropCategoryId] || "").toLowerCase().includes(q)
      );
    }

    // chip filter
    if (activeChip === "Organic") list = list.filter(c => c.ynOrganic === true || c.ynOrganic === 1);
    if (activeChip === "Grade A") list = list.filter(c => c.intQualityGradeId === 1);
    if (activeChip === "Vegetables") list = list.filter(c => c.intCropCategoryId === 1);
    if (activeChip === "Fruits")     list = list.filter(c => c.intCropCategoryId === 2);
    if (activeChip === "Grains")     list = list.filter(c => c.intCropCategoryId === 3);

    // sort
    if (activeSort === "Price ↑")  list = [...list].sort((a, b) => a.floatPricePerKg - b.floatPricePerKg);
    if (activeSort === "Price ↓")  list = [...list].sort((a, b) => b.floatPricePerKg - a.floatPricePerKg);
    if (activeSort === "Qty ↑")    list = [...list].sort((a, b) => b.floatQuantity - a.floatQuantity);
    if (activeSort === "Newest")   list = [...list].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

    // only show ACTIVE unless explicitly including all
    list = list.filter(c => !c.nvcharStatus || c.nvcharStatus.toUpperCase() === "ACTIVE");

    return list;
  }, [allCrops, myFarmerId, imageMap, search, activeChip, activeSort]);

  const totalOtherFarmers = useMemo(() =>
    new Set(allCrops.filter(c => c.intFarmerId !== myFarmerId).map(c => c.intFarmerId)).size,
    [allCrops, myFarmerId]
  );

  // ── open detail ─────────────────────────────────────────────────────────
  const openDetail = (crop: any) => {
    const parent = navigation.getParent();
    (parent ?? navigation).navigate("MarketplaceCropDetail", { crop });
  };

  // ── render ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={{ marginTop: 14, color: "#6B7280", fontSize: 14 }}>Loading marketplace…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <MaterialCommunityIcons name="wifi-off" size={56} color="#D1D5DB" />
        <Text style={{ fontSize: 17, fontWeight: "800", color: "#374151", marginTop: 16, marginBottom: 8 }}>Connection Error</Text>
        <Text style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, lineHeight: 20, marginBottom: 24 }}>{error}</Text>
        <TouchableOpacity onPress={() => load()} style={{ backgroundColor: "#16A34A", paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F9F4" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F9F4" />

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: "900", color: "#111827" }}>Marketplace</Text>
            <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 2 }}>
              {displayCrops.length} crops · {totalOtherFarmers} farmers
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => load()}
            style={{ width: 42, height: 42, backgroundColor: "#fff", borderRadius: 21, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search + Sort ── */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 10, paddingTop: 6 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 14, height: 50, elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={{ flex: 1, marginLeft: 8, fontSize: 14, color: "#111827" }}
              placeholder="Search crop, location…"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          {/* Sort button */}
          <TouchableOpacity
            onPress={() => setShowSort(v => !v)}
            style={{ width: 50, height: 50, backgroundColor: activeSort !== "Default" ? "#16A34A" : "#fff", borderRadius: 16, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
          >
            <MaterialCommunityIcons name="sort" size={22} color={activeSort !== "Default" ? "#fff" : "#374151"} />
          </TouchableOpacity>
        </View>

        {/* Sort dropdown */}
        {showSort && (
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 12, marginTop: 8, elevation: 6, shadowColor: "#0F172A", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Sort By</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SORT_OPTIONS.map(opt => {
                const active = opt === activeSort;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => { setActiveSort(opt); setShowSort(false); }}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? "#16A34A" : "#F3F4F6" }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#fff" : "#374151" }}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* ── Filter Chips ── */}
      <View style={{ paddingBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {FILTER_CHIPS.map(chip => {
            const active = chip === activeChip;
            return (
              <TouchableOpacity
                key={chip}
                onPress={() => setActiveChip(chip)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: active ? "#16A34A" : "#fff",
                  borderWidth: active ? 0 : 1, borderColor: "#E5E7EB",
                  elevation: active ? 3 : 0,
                  shadowColor: active ? "#16A34A" : "transparent",
                  shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#fff" : "#6B7280" }}>{chip}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Stats row ── */}
      {displayCrops.length > 0 && (
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 10, gap: 10 }}>
          {[
            { label: "Listed", value: String(displayCrops.length), icon: "sprout", color: "#16A34A" },
            { label: "Organic", value: String(displayCrops.filter(c => c.ynOrganic === true || c.ynOrganic === 1).length), icon: "leaf", color: "#059669" },
            { label: "Avg Price", value: `₹${displayCrops.length ? Math.round(displayCrops.reduce((s, c) => s + (c.floatPricePerKg || 0), 0) / displayCrops.length) : 0}`, icon: "currency-inr", color: "#D97706" },
          ].map(stat => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, alignItems: "center", flexDirection: "row", gap: 8, elevation: 1, shadowColor: "#0F172A", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}>
              <View style={{ width: 30, height: 30, backgroundColor: `${stat.color}18`, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
                <MaterialCommunityIcons name={stat.icon as any} size={16} color={stat.color} />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#111827" }}>{stat.value}</Text>
                <Text style={{ fontSize: 10, color: "#9CA3AF", fontWeight: "600" }}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Crop Grid ── */}
      <FlatList
        data={displayCrops}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        renderItem={({ item }) => (
          <CropCard item={item} onPress={() => openDetail(item)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#16A34A"]} tintColor="#16A34A" />
        }
        ListEmptyComponent={<EmptyState onRefresh={() => load()} />}
      />
    </SafeAreaView>
  );
}
