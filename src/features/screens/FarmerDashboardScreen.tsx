// src/features/farmer/screens/FarmerDashboardScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, Image, StatusBar
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { farmerOrderService } from "@/services/farmer/farmerOrderService";
import { authService } from "@/services/farmer/authService";
import { parseStoredUser } from "@/src/utils/authSession";

// ── helpers ────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const today = new Date().toLocaleDateString("en-IN", {
  weekday: "long", day: "numeric", month: "long",
});

const WEATHER_MAP: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "weather-sunny" },
  1: { label: "Mainly clear", icon: "weather-sunny" },
  2: { label: "Partly cloudy", icon: "weather-partly-cloudy" },
  3: { label: "Overcast", icon: "weather-cloudy" },
  45: { label: "Fog", icon: "weather-fog" },
  48: { label: "Fog", icon: "weather-fog" },
  51: { label: "Light drizzle", icon: "weather-rainy" },
  53: { label: "Drizzle", icon: "weather-rainy" },
  55: { label: "Heavy drizzle", icon: "weather-rainy" },
  61: { label: "Light rain", icon: "weather-rainy" },
  63: { label: "Rain", icon: "weather-rainy" },
  65: { label: "Heavy rain", icon: "weather-pouring" },
  71: { label: "Light snow", icon: "weather-snowy" },
  73: { label: "Snow", icon: "weather-snowy" },
  75: { label: "Heavy snow", icon: "weather-snowy-heavy" },
  80: { label: "Rain showers", icon: "weather-rainy" },
  81: { label: "Heavy showers", icon: "weather-pouring" },
  82: { label: "Violent showers", icon: "weather-pouring" },
  95: { label: "Thunderstorm", icon: "weather-lightning" },
  96: { label: "Thunderstorm", icon: "weather-lightning" },
  99: { label: "Thunderstorm", icon: "weather-lightning" },
};

// ── sub-components ─────────────────────────────────────────────────────────
function StatChip({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <View style={{ backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 8, marginBottom: 4 }}>
        <MaterialCommunityIcons name={icon as any} size={18} color="#fff" />
      </View>
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "600", marginTop: 1 }}>{label}</Text>
    </View>
  );
}

type QuickAction = { icon: string; label: string; sub: string; bg: string; iconColor: string; onPress: () => void };

function ActionCard({ icon, label, sub, bg, iconColor, onPress }: QuickAction) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: bg, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <MaterialCommunityIcons name={icon as any} size={26} color={iconColor} />
      </View>
      <Text style={{ color: "#111827", fontWeight: "700", fontSize: 14 }}>{label}</Text>
      <Text style={{ color: "#9CA3AF", fontSize: 11, marginTop: 2 }}>{sub}</Text>
    </TouchableOpacity>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export default function FarmerDashboardScreen() {
  const navigation = useNavigation<any>();
  const isFocused  = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [farmer, setFarmer] = useState({
    nvcharFullName: "Farmer",
    nvcharLocation: "Your Location",
    nvcharProfilePhotoUrl: "",
  });
  const [cropCount, setCropCount]       = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [monthEarnings, setMonthEarnings] = useState<number | null>(null);
  const [weather, setWeather] = useState({
    temp: null as number | null,
    humidity: null as number | null,
    wind: null as number | null,
    label: "Fetching weather...",
    icon: "weather-partly-cloudy",
  });
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem("@farmer_user");
        if (!raw) return;
        const u = parseStoredUser(raw);
        if (!u) return;
        setFarmer({
          nvcharFullName: u?.nvcharFullName || "Farmer",
          nvcharLocation:
            u?.nvcharLocation ||
            [u?.cityName, u?.stateName].filter(Boolean).join(", ") ||
            "Your Location",
          nvcharProfilePhotoUrl: authService.resolveProfileImageUrl(
            u?.nvcharProfilePhotoUrl || u?.avatarUrl || ""
          ),
        });

        const farmerId = u?.id;
        if (farmerId) {
          const [crops, orders] = await Promise.all([
            farmerOrderService.getCropsByFarmerId(Number(farmerId)).catch(() => []),
            farmerOrderService.getOrdersByFarmerId(Number(farmerId)).catch(() => []),
          ]);
          setCropCount(crops.length);
          const pending = orders.filter((o: any) => (o.nvcharStatus || "Pending") === "Pending");
          setPendingCount(pending.length);
          const now = new Date();
          const monthOrders = orders.filter((o: any) => {
            const d = new Date(o.dtOrderDate || o.createdAt || "");
            return !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          });
          const earnings = monthOrders.reduce((sum: number, o: any) => sum + (Number(o.intTotalPrice) || 0), 0);
          setMonthEarnings(earnings);
        } else {
          // farmerId not resolved — show 0 instead of "…"
          setCropCount(0);
          setPendingCount(0);
          setMonthEarnings(0);
        }
      } catch {
        // network or parse error — show 0 so stats don't stick at "…"
        setCropCount(0);
        setPendingCount(0);
        setMonthEarnings(0);
      }
    };
    load();
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    const fetchWeather = async () => {
      setIsWeatherLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setWeather((prev) => ({ ...prev, label: "Location permission needed" }));
          return;
        }

        let position = await Location.getLastKnownPositionAsync();
        if (!position) {
          position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        if (!position?.coords) {
          setWeather((prev) => ({ ...prev, label: "Location unavailable" }));
          return;
        }

        const { latitude, longitude } = position.coords;
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
          `&longitude=${longitude}` +
          `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
          `&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather fetch failed");
        const data = await res.json();
        const current = data?.current || {};
        const code = Number(current?.weather_code);
        const mapped = WEATHER_MAP[code] || { label: "Weather update", icon: "weather-cloudy" };

        setWeather({
          temp: typeof current?.temperature_2m === "number" ? current.temperature_2m : null,
          humidity: typeof current?.relative_humidity_2m === "number" ? current.relative_humidity_2m : null,
          wind: typeof current?.wind_speed_10m === "number" ? current.wind_speed_10m : null,
          label: mapped.label,
          icon: mapped.icon,
        });
      } catch {
        setWeather((prev) => ({ ...prev, label: "Weather unavailable" }));
      } finally {
        setIsWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [isFocused]);

  // navigation helpers
  const nav = (screen: string) => {
    const parent = navigation.getParent();
    (parent ?? navigation).navigate(screen);
  };

  const ACTIONS: QuickAction[] = [
    { icon: "plus-circle-outline", label: "Add Crop",  sub: "List a new produce",   bg: "#DCFCE7", iconColor: "#16A34A", onPress: () => nav("AddCrop") },
    { icon: "sprout",              label: "My Crops",  sub: "Manage inventory",      bg: "#D1FAE5", iconColor: "#059669", onPress: () => nav("MyCrops") },
    { icon: "receipt-text-outline",label: "Orders",    sub: "Track & manage orders", bg: "#FEF3C7", iconColor: "#D97706", onPress: () => navigation.navigate("Orders") },
    { icon: "message-text-outline",label: "Messages",  sub: "Chat with buyers",      bg: "#EDE9FE", iconColor: "#7C3AED", onPress: () => nav("Messages") },
  ];

  const firstName = farmer.nvcharFullName.split(" ")[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F0FDF4" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
      >
        {/* ── Top Bar ───────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: farmer.nvcharProfilePhotoUrl || "https://i.pravatar.cc/150?img=11" }}
              style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2.5, borderColor: "#16A34A" }}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "500" }}>{getGreeting()}</Text>
              <Text style={{ fontSize: 17, color: "#111827", fontWeight: "800" }}>{firstName}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => nav("Notifications")}
            style={{ width: 44, height: 44, backgroundColor: "#fff", borderRadius: 22, alignItems: "center", justifyContent: "center", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4 }}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color="#374151" />
            <View style={{ position: "absolute", top: 10, right: 10, width: 9, height: 9, backgroundColor: "#16A34A", borderRadius: 5, borderWidth: 1.5, borderColor: "#fff" }} />
          </TouchableOpacity>
        </View>

        {/* ── Hero Card ─────────────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 10,
            borderRadius: 28,
            backgroundColor: "#16A34A",
            padding: 22,
            shadowColor: "#166534",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {/* Decorative circles */}
          <View style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.07)" }} />
          <View style={{ position: "absolute", bottom: -30, right: 40, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.05)" }} />

          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600", marginBottom: 2 }}>{today}</Text>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 16 }}>Your Farm Overview</Text>

          {/* Stats row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <StatChip icon="sprout"               label="Active Crops"   value={cropCount !== null ? String(cropCount) : "..."} color="#fff" />
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
            <StatChip icon="receipt-text-outline" label="Pending Orders" value={pendingCount !== null ? String(pendingCount) : "..."} color="#fff" />
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
            <StatChip icon="currency-inr"         label="This Month"    value={monthEarnings !== null ? `Rs ${monthEarnings > 999 ? (monthEarnings / 1000).toFixed(1) + "k" : monthEarnings}` : "..."} color="#fff" />
          </View>
        </View>

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 14 }}>Quick Actions</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {ACTIONS.map(a => <ActionCard key={a.label} {...a} />)}
          </View>
        </View>

        {/* ── Daily Insights ────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 14 }}>Daily Insights</Text>

          {/* Weather Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => nav("Weather")}
            style={{
              backgroundColor: "#0EA5E9",
              borderRadius: 24,
              padding: 20,
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              shadowColor: "#0369A1",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 7,
              overflow: "hidden",
            }}
          >
            <View style={{ position: "absolute", top: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.08)" }} />
            <View>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" }}>Today's Weather</Text>
              <Text style={{ color: "#fff", fontSize: 40, fontWeight: "900", lineHeight: 46 }}>
                {weather.temp !== null ? `${Math.round(weather.temp)} C` : "-- C"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>{weather.label}</Text>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 10 }}>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
                  Humidity: {weather.humidity !== null ? `${weather.humidity}%` : "--%"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
                  Wind: {weather.wind !== null ? `${Math.round(weather.wind)} km/h` : "-- km/h"}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name={weather.icon as any} size={72} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          {/* Market Trend Card */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 20,
              marginBottom: 14,
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.07,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{ width: 44, height: 44, backgroundColor: "#F0FDF4", borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <MaterialCommunityIcons name="trending-up" size={24} color="#16A34A" />
              </View>
              <View>
                <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "600" }}>MARKET PRICE TREND</Text>
                <Text style={{ color: "#111827", fontWeight: "800", fontSize: 15 }}>Top Selling Crop</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <Text style={{ color: "#16A34A", fontSize: 28, fontWeight: "900" }}>Rs --</Text>
                <Text style={{ color: "#9CA3AF", fontSize: 12, marginLeft: 4 }}> / kg</Text>
              </View>
              <View style={{ backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: "#16A34A", fontSize: 12, fontWeight: "800" }}>Up --% today</Text>
              </View>
            </View>
          </View>

          {/* Tip Banner */}
          <View
            style={{
              backgroundColor: "#111827",
              borderRadius: 24,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <View style={{ flex: 1, marginRight: 14 }}>
              <Text style={{ color: "#16A34A", fontSize: 11, fontWeight: "700", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Pro Tip</Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 4 }}>Boost Your Crop Visibility</Text>
              <Text style={{ color: "#9CA3AF", fontSize: 12, lineHeight: 18 }}>Mark your produce as Premium to appear at the top of buyer searches.</Text>
            </View>
            <TouchableOpacity
              onPress={() => nav("Marketplace")}
              style={{ backgroundColor: "#16A34A", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Explore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
