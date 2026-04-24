// src/features/farmer/screens/marketplace/MarketplaceCropDetailScreen.tsx
import React from "react";
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Share, Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { cropService } from "@/services/farmer/cropService";

// ── helpers ───────────────────────────────────────────────────────────────
const formatDate = (v?: string) => {
  if (!v) return "Not specified";
  const d = new Date(`${v}T00:00:00`);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

const QUALITY_LABEL: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "Grade A — Premium",  color: "#16A34A", bg: "#DCFCE7" },
  2: { label: "Grade B — Standard", color: "#D97706", bg: "#FEF3C7" },
  3: { label: "Grade C — Economy",  color: "#6B7280", bg: "#F3F4F6" },
};

const CATEGORY_LABEL: Record<number, string> = {
  1: "Vegetables", 2: "Fruits",   3: "Grains",
  4: "Pulses",     5: "Spices",   6: "Dairy",   7: "Other",
};

const PLACEHOLDER = "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=800&q=80";

// ── info row ──────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, iconColor = "#16A34A" }: { icon: string; label: string; value: string; iconColor?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
      <View style={{ width: 40, height: 40, backgroundColor: `${iconColor}15`, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: "#111827", fontWeight: "700" }}>{value}</Text>
      </View>
    </View>
  );
}

// ── main ─────────────────────────────────────────────────────────────────
export default function MarketplaceCropDetailScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { crop }   = route.params as { crop: any };

  const imageUrl = crop._resolvedImageUrl ||
    cropService.resolveCropImageUrl(
      crop?.nvcharCropImageUrl || crop?.nvcharImageUrl || crop?.imageUrl
    ) || PLACEHOLDER;

  const isOrganic = crop.ynOrganic === true || crop.ynOrganic === 1;
  const quality   = QUALITY_LABEL[crop.intQualityGradeId];
  const category  = CATEGORY_LABEL[crop.intCropCategoryId] || "Produce";

  const nav = (screen: string) => {
    const parent = navigation.getParent();
    (parent ?? navigation).navigate(screen);
  };

  const handleContact = () => {
    Alert.alert(
      "Contact Farmer",
      `Message the farmer who listed "${crop.nvcharCropName}" to discuss pricing, quantity, and delivery.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Messages", onPress: () => nav("Messages") },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${crop.nvcharCropName} on AgroConnect!\n₹${crop.floatPricePerKg}/kg — ${crop.floatQuantity} kg available\nLocation: ${crop.nvcharLocation || "N/A"}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero Image ── */}
        <View style={{ position: "relative", height: 300 }}>
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: "100%", backgroundColor: "#F0FDF4" }}
            resizeMode="cover"
          />
          {/* Gradient overlay */}
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, backgroundColor: "rgba(0,0,0,0.25)" }} />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ position: "absolute", top: 48, left: 16, width: 42, height: 42, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 21, alignItems: "center", justifyContent: "center" }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity
            onPress={handleShare}
            style={{ position: "absolute", top: 48, right: 16, width: 42, height: 42, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 21, alignItems: "center", justifyContent: "center" }}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color="#111827" />
          </TouchableOpacity>

          {/* Badges on image */}
          <View style={{ position: "absolute", bottom: 16, left: 16, flexDirection: "row", gap: 8 }}>
            {isOrganic && (
              <View style={{ backgroundColor: "#16A34A", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons name="leaf" size={12} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800", marginLeft: 4 }}>ORGANIC</Text>
              </View>
            )}
            <View style={{ backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#374151" }}>{category}</Text>
            </View>
          </View>
        </View>

        {/* ── Content Card ── */}
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, padding: 24 }}>

          {/* Name + status */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#111827", flex: 1, marginRight: 12, lineHeight: 30 }}>
              {crop.nvcharCropName}
            </Text>
            <View style={{ backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
              <Text style={{ color: "#16A34A", fontSize: 11, fontWeight: "800" }}>ACTIVE</Text>
            </View>
          </View>

          <Text style={{ color: "#9CA3AF", fontSize: 12, fontWeight: "600", marginBottom: 16 }}>
            Farmer #{crop.intFarmerId}
          </Text>

          {/* Price + Qty row */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1, backgroundColor: "#F0FDF4", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#BBF7D0" }}>
              <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "600", marginBottom: 4 }}>Price per kg</Text>
              <Text style={{ fontSize: 28, fontWeight: "900", color: "#16A34A" }}>₹{crop.floatPricePerKg}</Text>
              <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>per kilogram</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#E5E7EB" }}>
              <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "600", marginBottom: 4 }}>Available Stock</Text>
              <Text style={{ fontSize: 28, fontWeight: "900", color: "#111827" }}>{crop.floatQuantity}</Text>
              <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>kilograms</Text>
            </View>
          </View>

          {/* Quality badge */}
          {quality && (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: quality.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20, alignSelf: "flex-start" }}>
              <MaterialCommunityIcons name="medal-outline" size={18} color={quality.color} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: quality.color, marginLeft: 8 }}>{quality.label}</Text>
            </View>
          )}

          {/* Info rows */}
          <View style={{ backgroundColor: "#F9FAFB", borderRadius: 20, paddingHorizontal: 16, marginBottom: 20 }}>
            <InfoRow icon="map-marker-outline"    label="Farm Location"    value={crop.nvcharLocation || "Not specified"} />
            <InfoRow icon="calendar-check-outline" label="Harvest Date"    value={formatDate(crop.dtHarvestDate)} iconColor="#D97706" />
            <InfoRow icon="sprout"                label="Category"         value={category} />
            <InfoRow icon="account-outline"       label="Farmer ID"        value={`Farmer #${crop.intFarmerId}`} iconColor="#7C3AED" />
            {isOrganic && (
              <InfoRow icon="check-decagram"      label="Certification"    value="Certified Organic Produce" iconColor="#059669" />
            )}
          </View>

          {/* Description */}
          {crop.nvcharDescription ? (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 10 }}>About This Crop</Text>
              <View style={{ backgroundColor: "#F9FAFB", borderRadius: 18, padding: 16 }}>
                <Text style={{ fontSize: 14, color: "#4B5563", lineHeight: 22 }}>{crop.nvcharDescription}</Text>
              </View>
            </View>
          ) : null}

          {/* Estimated Total Value */}
          <View style={{ backgroundColor: "#111827", borderRadius: 20, padding: 18, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "600" }}>If you buy all stock</Text>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 2 }}>
                ₹{(crop.floatPricePerKg * crop.floatQuantity).toLocaleString("en-IN")}
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
                {crop.floatQuantity} kg × ₹{crop.floatPricePerKg}
              </Text>
            </View>
            <View style={{ width: 52, height: 52, backgroundColor: "#16A34A", borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons name="calculator-variant-outline" size={26} color="#fff" />
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Sticky Bottom Actions ── */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: "#fff",
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28,
        borderTopWidth: 1, borderTopColor: "#F3F4F6",
        flexDirection: "row", gap: 12,
        shadowColor: "#0F172A", shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 12,
      }}>
        <TouchableOpacity
          onPress={handleContact}
          style={{ flex: 1, backgroundColor: "#F0FDF4", paddingVertical: 14, borderRadius: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", borderWidth: 1.5, borderColor: "#BBF7D0" }}
        >
          <MaterialCommunityIcons name="message-text-outline" size={18} color="#16A34A" />
          <Text style={{ color: "#16A34A", fontWeight: "800", fontSize: 15, marginLeft: 8 }}>Message Farmer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "#16A34A", paddingVertical: 14, borderRadius: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", shadowColor: "#16A34A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
          onPress={() => Alert.alert("Interest Sent", `Your interest in "${crop.nvcharCropName}" has been noted. The farmer will be notified.`)}
        >
          <MaterialCommunityIcons name="handshake-outline" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15, marginLeft: 8 }}>I'm Interested</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
