import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { buyerCropService } from "@/services/buyer/buyerCropService";
import { buyerAuthService } from "@/services/buyer/buyerAuthService";

export default function CropDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const crop = route.params?.crop;
  const orderStatus = route.params?.orderStatus;
  const orderNumber = route.params?.orderNumber;
  const order = route.params?.order;

  const statusLabel = String(orderStatus || "").trim();
  const statusKey = statusLabel || "Pending";
  const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "#FEF3C7", text: "#D97706" },
    Accepted: { bg: "#DCFCE7", text: "#16A34A" },
    Packed: { bg: "#EDE9FE", text: "#7C3AED" },
    Shipped: { bg: "#DBEAFE", text: "#2563EB" },
    Delivered: { bg: "#ECFDF5", text: "#10B981" },
    Cancelled: { bg: "#F3F4F6", text: "#6B7280" },
    Rejected: { bg: "#FEE2E2", text: "#DC2626" },
    Completed: { bg: "#DBEAFE", text: "#2563EB" },
  };
  const statusStyle = STATUS_STYLE[statusKey] ?? STATUS_STYLE.Pending;

  const [farmerData, setFarmerData] = useState<any>(null);
  const [isFarmerLoading, setIsFarmerLoading] = useState(true);

  const fallbackImage =
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=80";
  const rawImages = [
    ...(Array.isArray(crop?.images) ? crop.images : []),
    ...(Array.isArray(crop?.cropImages) ? crop.cropImages : []),
    ...(Array.isArray(crop?.imageUrls) ? crop.imageUrls : []),
    crop?.nvcharCropImageUrl,
    crop?.nvcharImageUrl,
    crop?.imageUrl,
  ];
  const resolvedImages = rawImages
    .map((img) => {
      if (!img) return null;
      const candidate =
        typeof img === "string"
          ? img
          : img?.nvcharCropImageUrl || img?.nvcharImageUrl || img?.imageUrl || img?.url;
      if (!candidate) return null;
      return buyerCropService.resolveCropImageUrl(candidate) || candidate;
    })
    .filter((img): img is string => Boolean(img))
    .filter((img, index, arr) => arr.indexOf(img) === index);
  const initialImage = resolvedImages[0] || fallbackImage;
  const [activeImageUrl, setActiveImageUrl] = useState(initialImage);

  const farmerAvatar = farmerData?.nvcharProfilePhotoUrl?.startsWith("http")
    ? farmerData.nvcharProfilePhotoUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(farmerData?.nvcharFullName || "Farmer")}&background=DCFCE7&color=166534&size=128`;

  useEffect(() => {
    const loadFarmer = async () => {
      if (!crop?.intFarmerId) {
        setIsFarmerLoading(false);
        return;
      }
      try {
        const response = await buyerAuthService.getFarmerById(Number(crop.intFarmerId));
        const record =
          response?.data?.[0] ||
          response?.data ||
          (Array.isArray(response) ? response[0] : response);
        if (record) setFarmerData(record);
      } catch (e) {
        console.log("Error loading farmer", e);
      } finally {
        setIsFarmerLoading(false);
      }
    };
    loadFarmer();
  }, [crop?.intFarmerId]);

  useEffect(() => {
    setActiveImageUrl(initialImage);
  }, [initialImage]);

  if (!crop) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-[#6B7280]">Crop not found.</Text>
      </SafeAreaView>
    );
  }

  const pricePerKg =
    crop?.floatPricePerKg ??
    crop?.intPricePerKg ??
    crop?.floatPrice ??
    crop?.intPrice ??
    "-";
  const quantityKg = crop?.floatQuantity ?? crop?.intQuantity ?? "-";
  const cropLocation = crop?.nvcharLocation || "Farm location";
  const harvestDate = crop?.dtHarvestDate || "-";
  const isActive = crop?.nvcharStatus === "ACTIVE" || !crop?.nvcharStatus;
  const footerBottomPadding = Math.max(16, insets.bottom + 8);
  const footerHeight = footerBottomPadding + (order ? 76 : 88);

  const cardBaseStyle = {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  } as const;
  const sectionLabelStyle = {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#94A3B8",
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  };
  const statItems = [
    {
      icon: "scale-balance",
      label: "Available",
      value: `${quantityKg} kg`,
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      icon: "calendar-outline",
      label: "Harvest",
      value: harvestDate,
      color: "#7C3AED",
      bg: "#F3E8FF",
    },
    {
      icon: "leaf",
      label: "Organic",
      value: crop.ynOrganic ? "Yes" : "No",
      color: crop.ynOrganic ? "#10B981" : "#9CA3AF",
      bg: crop.ynOrganic ? "#ECFDF5" : "#F3F4F6",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FB]">
      {/* -- Hero Image with Back Button -- */}
      <View style={{ marginBottom: 8 }}>
        <View
          style={{
            height: 300,
            backgroundColor: "#E2E8F0",
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            overflow: "hidden",
          }}
        >
          <Image source={{ uri: activeImageUrl }} className="w-full h-full" resizeMode="cover" />
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: "55%",
              backgroundColor: "rgba(15,23,42,0.15)",
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "65%",
              backgroundColor: "rgba(15,23,42,0.4)",
            }}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="absolute top-4 left-4 w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.92)" }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
          </TouchableOpacity>

          {isActive ? (
            <View
              className="absolute top-4 right-4 px-3 py-1 rounded-full"
              style={{ backgroundColor: "rgba(236,253,245,0.95)" }}
            >
              <Text className="text-[#10B981] text-xs font-bold">In Stock</Text>
            </View>
          ) : null}

          <View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
            <Text style={{ color: "#F8FAFC", fontSize: 24, fontWeight: "800" }} numberOfLines={2}>
              {crop.nvcharCropName}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color="#E2E8F0" />
              <Text style={{ color: "#E2E8F0", fontSize: 12, marginLeft: 4, flex: 1 }} numberOfLines={1}>
                {cropLocation}
              </Text>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.96)",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  alignItems: "flex-end",
                }}
              >
                <Text style={{ color: "#16A34A", fontWeight: "900", fontSize: 14 }}>Rs {pricePerKg}</Text>
                <Text style={{ color: "#64748B", fontSize: 10 }}>per kg</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {resolvedImages.length > 1 ? (
        <View style={{ marginTop: -18 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          >
            {resolvedImages.map((img, index) => {
              const isActive = img === activeImageUrl;
              return (
                <TouchableOpacity
                  key={`${img}-${index}`}
                  onPress={() => setActiveImageUrl(img)}
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 14,
                    overflow: "hidden",
                    marginRight: index === resolvedImages.length - 1 ? 0 : 10,
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive ? "#2563EB" : "#E2E8F0",
                    backgroundColor: "#F1F5F9",
                    shadowColor: "#0F172A",
                    shadowOpacity: isActive ? 0.12 : 0.05,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: isActive ? 4 : 2,
                  }}
                >
                  <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footerHeight + 28 }}
      >
        {/* -- Overview Card -- */}
        <View style={{ ...cardBaseStyle, marginHorizontal: 16, marginTop: -26 }}>
          <Text style={sectionLabelStyle}>Overview</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: statusStyle.bg,
                marginRight: 8,
                marginBottom: 6,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: statusStyle.text }}>
                {orderStatus
                  ? "Order " + (orderNumber ? "#" + orderNumber : "") + " - " + statusKey
                  : "Live Listing"}
              </Text>
            </View>
            {crop.ynOrganic === true || crop.ynOrganic === 1 ? (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: "#ECFDF5",
                  marginRight: 8,
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#10B981" }}>Organic</Text>
              </View>
            ) : null}
            {crop.intQualityGradeId ? (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: "#EFF6FF",
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#1D4ED8" }}>
                  Grade {crop.intQualityGradeId}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={{
              marginTop: 12,
              backgroundColor: "#F8FAFC",
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 6,
              flexDirection: "row",
            }}
          >
            {statItems.map((s, index) => (
              <View
                key={s.label}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 4,
                  borderLeftWidth: index === 0 ? 0 : 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    backgroundColor: s.bg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                  }}
                >
                  <MaterialCommunityIcons name={s.icon as any} size={18} color={s.color} />
                </View>
                <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "600" }}>{s.label}</Text>
                <Text style={{ fontWeight: "700", fontSize: 12, marginTop: 4, color: s.color }}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* -- Description -- */}
        {crop.nvcharDescription ? (
          <View style={{ ...cardBaseStyle, marginHorizontal: 16, marginTop: 14 }}>
            <Text style={sectionLabelStyle}>Description</Text>
            <Text style={{ color: "#475569", fontSize: 14, lineHeight: 20, marginTop: 10 }}>
              {crop.nvcharDescription}
            </Text>
          </View>
        ) : null}

        {/* -- Farmer Card -- */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isFarmerLoading}
          onPress={() =>
            navigation.navigate("BuyerFarmerProfile", {
              farmerId: crop?.intFarmerId,
              farmer: farmerData,
            })
          }
          style={{ ...cardBaseStyle, marginHorizontal: 16, marginTop: 14 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={sectionLabelStyle}>Sold By</Text>
            <Text style={{ fontSize: 11, color: "#94A3B8" }}>Tap to view profile</Text>
          </View>
          {isFarmerLoading ? (
            <ActivityIndicator color="#3B82F6" style={{ marginTop: 12 }} />
          ) : (
            <View className="flex-row items-center" style={{ marginTop: 12 }}>
              <Image source={{ uri: farmerAvatar }} className="w-12 h-12 rounded-full" />
              <View className="flex-1 ml-3">
                <Text className="text-[#111827] font-bold text-base">
                  {farmerData?.nvcharFullName || `Farmer #${crop.intFarmerId}`}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <MaterialCommunityIcons name="map-marker-outline" size={12} color="#9CA3AF" />
                  <Text className="text-[#9CA3AF] text-xs ml-1" numberOfLines={1}>
                    {farmerData?.nvcharAddress || crop.nvcharLocation || "Farm location"}
                  </Text>
                </View>
              </View>
              <View className="px-2 py-1 rounded-lg" style={{ backgroundColor: "#ECFDF5" }}>
                <Text className="text-[#10B981] text-xs font-bold">Verified</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" style={{ marginLeft: 8 }} />
            </View>
          )}
        </TouchableOpacity>

        {order ? (
          <View style={{ ...cardBaseStyle, marginHorizontal: 16, marginTop: 14 }}>
            <Text style={sectionLabelStyle}>Order Details</Text>
            {[
              { label: "Order Number", value: order?.nvcharOrderNumber || order?.id || "-" },
              { label: "Status", value: order?.nvcharStatus || "Pending" },
              { label: "Quantity", value: `${order?.intQuantity ?? "-"} kg` },
              { label: "Unit Price", value: `Rs ${order?.intUnitPrice ?? order?.floatPricePerKg ?? "-"}` },
              { label: "Total", value: `Rs ${order?.intTotalPrice ?? "-"}` },
              { label: "Delivery Address", value: order?.nvcharDeliveryAddress || "-" },
            ].map((row, index, arr) => (
              <View
                key={row.label}
                className="flex-row items-start py-2"
                style={{
                  borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                  borderColor: "#F1F5F9",
                }}
              >
                <Text className="text-[#94A3B8] text-sm w-36">{row.label}</Text>
                <Text className="flex-1 text-sm font-semibold text-right text-[#0F172A]" numberOfLines={2}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

      </ScrollView>

      {/* -- Bottom Action Bar -- */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-6 flex-row gap-3"
        style={{
          borderTopWidth: 1,
          borderColor: "#E2E8F0",
          paddingBottom: footerBottomPadding,
          shadowColor: "#0F172A",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 10,
        }}
      >
        {order ? (
          <View
            className="flex-1 flex-row items-center justify-center rounded-xl py-3.5"
            style={{ backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <MaterialCommunityIcons name="check-circle-outline" size={18} color="#6B7280" />
            <Text className="text-[#6B7280] font-bold text-sm ml-1.5">Already Purchased</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("BuyerChat", {
                  counterpartyId: crop?.intFarmerId,
                  counterpartyName: farmerData?.nvcharFullName || `Farmer #${crop?.intFarmerId}`,
                  counterpartyAvatar: farmerAvatar,
                  currentUserType: "buyer",
                  counterpartyType: "farmer",
                })
              }
              disabled={!crop?.intFarmerId}
              className="flex-1 flex-row items-center justify-center rounded-xl py-3.5"
              style={{ backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#D1FAE5" }}
            >
              <MaterialCommunityIcons name="message-processing-outline" size={18} color="#10B981" />
              <Text className="text-[#10B981] font-bold text-sm ml-1.5">Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("BuyCrop", { crop })}
              className="flex-[2] flex-row items-center justify-center rounded-xl py-3.5"
              style={{ backgroundColor: "#1D4ED8" }}
            >
              <MaterialCommunityIcons name="cart-outline" size={18} color="white" />
              <Text
                className="text-white font-bold text-sm ml-1.5"
                numberOfLines={1}
                style={{ flexShrink: 1 }}
              >
                Buy Now - Rs {pricePerKg}/kg
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

    </SafeAreaView>
  );
}




