import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { farmerOrderService } from "@/services/farmer/farmerOrderService";
import { cropService } from "@/services/farmer/cropService";

const TABS = ["Pending", "Accepted", "Packed", "Shipped", "Delivered", "Completed", "Rejected", "Cancelled"];

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Pending: { bg: "#FEF3C7", text: "#D97706", border: "#FCD34D", icon: "clock-outline" },
  Accepted: { bg: "#DCFCE7", text: "#16A34A", border: "#86EFAC", icon: "check-circle-outline" },
  Packed: { bg: "#EDE9FE", text: "#7C3AED", border: "#C4B5FD", icon: "package-variant" },
  Shipped: { bg: "#DBEAFE", text: "#2563EB", border: "#93C5FD", icon: "truck-fast-outline" },
  Delivered: { bg: "#ECFDF5", text: "#10B981", border: "#A7F3D0", icon: "home-check-outline" },
  Completed: { bg: "#ECFDF5", text: "#10B981", border: "#A7F3D0", icon: "home-check-outline" },
  Rejected: { bg: "#FEE2E2", text: "#DC2626", border: "#FCA5A5", icon: "close-circle-outline" },
  Cancelled: { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", icon: "cancel" },
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=200&q=80";

type PaymentInfo = {
  status: string;
  method: string;
  tx?: any;
};

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [orders, setOrders] = useState<any[]>([]);
  const [cropMap, setCropMap] = useState<Record<number, any>>({});
  const [buyerMap, setBuyerMap] = useState<Record<number, any>>({});
  const [paymentMap, setPaymentMap] = useState<Record<number, PaymentInfo>>({});
  const [activeTab, setActiveTab] = useState("Pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [collectingId, setCollectingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractRecord = (response: any) => {
    const data = response?.data ?? response;
    if (Array.isArray(data)) return data[0] ?? null;
    if (Array.isArray(data?.data)) return data.data[0] ?? null;
    if (data?.data && typeof data.data === "object") return data.data;
    if (data && typeof data === "object") return data;
    return null;
  };

  const loadPaymentStatus = async (list: any[]) => {
    try {
      const ids = list
        .map((o) => Number(o.id))
        .filter((id) => Number.isFinite(id) && id > 0);
      const results = await Promise.all(
        ids.map((id) => farmerOrderService.getPaymentByOrderId(id).catch(() => null))
      );
      const map: Record<number, PaymentInfo> = {};
      results.forEach((res, idx) => {
        const data = res?.data || res;
        const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        const tx = arr[0];
        if (tx) {
          map[ids[idx]] = {
            status: tx.nvcharPaymentStatus || "Pending",
            method: tx.nvcharPaymentMethod || "Razorpay",
            tx,
          };
        }
      });
      setPaymentMap(map);
    } catch {
      // ignore
    }
  };

  const extractPaymentInfo = (res: any): PaymentInfo | null => {
    const data = res?.data || res;
    const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    const tx = arr[0];
    if (!tx) return null;
    return {
      status: tx.nvcharPaymentStatus || "Pending",
      method: tx.nvcharPaymentMethod || "Razorpay",
      tx,
    };
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const raw = await AsyncStorage.getItem("@farmer_user");
      const fid: number = raw ? (JSON.parse(raw)?.id ?? null) : null;
      if (!fid) {
        setError("Not logged in.");
        return;
      }

      const [orderList, crops] = await Promise.all([
        farmerOrderService.getOrdersByFarmerId(fid),
        farmerOrderService.getCropsByFarmerId(fid).catch(() => []),
      ]);

      const map: Record<number, any> = {};
      for (const c of crops) {
        map[Number(c.id)] = c;
      }
      setCropMap(map);

      const buyerIds = Array.from(
        new Set(
          orderList
            .map((o: any) => Number(o.intBuyerId))
            .filter((id: number) => Number.isFinite(id) && id > 0)
        )
      );

      const buyerResponses = await Promise.all(
        buyerIds.map((id) => farmerOrderService.getBuyerById(id).catch(() => null))
      );

      const buyers: Record<number, any> = {};
      buyerResponses.forEach((res, idx) => {
        const record = extractRecord(res);
        if (record) buyers[buyerIds[idx]] = record;
      });
      setBuyerMap(buyers);

      setOrders(orderList);
      await loadPaymentStatus(orderList);
    } catch (e: any) {
      setError("Could not load orders. Check your connection.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused, load]);

  const onRefresh = () => {
    setIsRefreshing(true);
    load(true);
  };

  const updateStatus = async (order: any, newStatus: string) => {
    const label =
      newStatus === "Accepted"
        ? "Accept"
        : newStatus === "Rejected"
        ? "Reject"
        : newStatus === "Packed"
        ? "Mark Packed"
        : newStatus === "Shipped"
        ? "Mark Shipped"
        : "Mark Delivered";

    Alert.alert(
      `${label} Order`,
      `Are you sure you want to ${label.toLowerCase()} order ${order.nvcharOrderNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: label,
          style: newStatus === "Rejected" ? "destructive" : "default",
          onPress: async () => {
            setUpdatingId(order.id);
            try {
              await farmerOrderService.updateOrderStatus(order.id, newStatus);
              setOrders((prev) =>
                prev.map((o) => (o.id === order.id ? { ...o, nvcharStatus: newStatus } : o))
              );
              const paymentRes = await farmerOrderService.getPaymentByOrderId(order.id).catch(() => null);
              const info = extractPaymentInfo(paymentRes);
              if (info) {
                setPaymentMap((prev) => ({ ...prev, [order.id]: info }));
              }
            } catch {
              Alert.alert("Error", "Could not update order status. Please try again.");
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const collectCodPayment = async (order: any, info?: PaymentInfo) => {
    if (!info?.tx) return;
    Alert.alert("Collect COD Payment", "Mark COD payment as collected?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            setCollectingId(order.id);
            await farmerOrderService.updateTransactionStatus(info.tx, "Collected");
            await farmerOrderService.updateOrderStatus(order.id, "Completed");
            setPaymentMap((prev) => ({
              ...prev,
              [order.id]: { ...info, status: "Collected" },
            }));
            setOrders((prev) =>
              prev.map((o) => (o.id === order.id ? { ...o, nvcharStatus: "Completed" } : o))
            );
          } catch {
            Alert.alert("Error", "Could not update payment status.");
          } finally {
            setCollectingId(null);
          }
        },
      },
    ]);
  };

  const filtered = orders.filter(
    (o) => String(o.nvcharStatus || "Pending").toLowerCase() === activeTab.toLowerCase()
  );

  const tabCounts = Object.fromEntries(
    TABS.map((t) => [
      t,
      orders.filter((o) => String(o.nvcharStatus || "Pending").toLowerCase() === t.toLowerCase()).length,
    ])
  );

  const renderCard = ({ item }: { item: any }) => {
    const s = STATUS_STYLE[item.nvcharStatus] ?? STATUS_STYLE.Pending;
    const crop = cropMap[Number(item.intCropId)];
    const cropName = item.cropName || crop?.nvcharCropName || `Crop #${item.intCropId}`;
    const imageUrl = cropService.resolveCropImageUrl(crop?.nvcharCropImageUrl) || FALLBACK_IMAGE;
    const isUpdating = updatingId === item.id;
    const buyer = buyerMap[Number(item.intBuyerId)];
    const paymentInfo = paymentMap[item.id] || { status: "Pending", method: "Razorpay" };
    const buyerAvatar = buyer?.nvcharProfilePhotoUrl?.startsWith("http")
      ? buyer.nvcharProfilePhotoUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          buyer?.nvcharFullName || `Buyer ${item.intBuyerId}`
        )}&background=DBEAFE&color=1D4ED8&size=128`;

    const showCollect =
      paymentInfo.method === "COD" &&
      paymentInfo.status === "Pending" &&
      item.nvcharStatus === "Delivered";

    return (
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 20,
          marginHorizontal: 16,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: "#F3F4F6",
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
          overflow: "hidden",
        }}
      >
        <View style={{ height: 3, backgroundColor: s.text }} />

        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row" }}>
            <Image source={{ uri: imageUrl }} style={{ width: 80, height: 80, borderRadius: 14 }} resizeMode="cover" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#111827", flex: 1, marginRight: 8 }} numberOfLines={1}>
                  {cropName}
                </Text>
                <View style={{ backgroundColor: s.bg, borderWidth: 1, borderColor: s.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons name={s.icon as any} size={11} color={s.text} />
                  <Text style={{ color: s.text, fontSize: 10, fontWeight: "800", marginLeft: 3 }}>
                    {item.nvcharStatus}
                  </Text>
                </View>
              </View>

              <Text style={{ color: "#9CA3AF", fontSize: 11, marginTop: 3 }}>#{item.nvcharOrderNumber}</Text>

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons name="weight-kilogram" size={13} color="#9CA3AF" />
                  <Text style={{ color: "#6B7280", fontSize: 12, marginLeft: 3 }}>{item.intQuantity} kg</Text>
                </View>
                <Text style={{ color: "#16A34A", fontSize: 14, fontWeight: "800" }}>Rs {item.intTotalPrice}</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    paymentInfo.status === "Paid" ||
                    paymentInfo.status === "Collected" ||
                    paymentInfo.status === "Settled"
                      ? "#10B981"
                      : "#F59E0B",
                }}
              />
                <Text style={{ color: "#6B7280", fontSize: 11, marginLeft: 6 }}>
                  Payment: {paymentInfo.status} ({paymentInfo.method})
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F9FAFB", gap: 5 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="account-outline" size={13} color="#9CA3AF" />
              <Text style={{ color: "#6B7280", fontSize: 12, marginLeft: 5 }}>
                {buyer?.nvcharFullName || `Buyer #${item.intBuyerId}`}
              </Text>
            </View>
            {buyer?.nvcharPhoneNumber ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons name="phone-outline" size={13} color="#9CA3AF" />
                <Text style={{ color: "#6B7280", fontSize: 12, marginLeft: 5 }}>{buyer.nvcharPhoneNumber}</Text>
              </View>
            ) : null}
            {item.nvcharDeliveryAddress ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color="#9CA3AF" />
                <Text style={{ color: "#6B7280", fontSize: 12, marginLeft: 5, flex: 1 }} numberOfLines={1}>
                  {item.nvcharDeliveryAddress}
                </Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ChatDetail", {
                counterpartyId: item.intBuyerId,
                counterpartyName: buyer?.nvcharFullName || `Buyer #${item.intBuyerId}`,
                counterpartyAvatar: buyerAvatar,
                currentUserType: "farmer",
              })
            }
            style={{
              marginTop: 10,
              backgroundColor: "#EFF6FF",
              borderWidth: 1,
              borderColor: "#BFDBFE",
              paddingVertical: 10,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons name="message-processing-outline" size={16} color="#2563EB" />
            <Text style={{ color: "#2563EB", fontWeight: "700", fontSize: 13, marginLeft: 6 }}>Message Buyer</Text>
          </TouchableOpacity>

          {isUpdating ? (
            <View style={{ marginTop: 12, alignItems: "center", paddingVertical: 10 }}>
              <ActivityIndicator size="small" color="#16A34A" />
            </View>
          ) : item.nvcharStatus === "Pending" ? (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => updateStatus(item, "Accepted")}
                style={{ flex: 1, backgroundColor: "#16A34A", paddingVertical: 11, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" }}
              >
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13, marginLeft: 5 }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateStatus(item, "Rejected")}
                style={{ flex: 1, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", paddingVertical: 11, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" }}
              >
                <MaterialCommunityIcons name="close" size={16} color="#DC2626" />
                <Text style={{ color: "#DC2626", fontWeight: "700", fontSize: 13, marginLeft: 5 }}>Reject</Text>
              </TouchableOpacity>
            </View>
          ) : item.nvcharStatus === "Accepted" ? (
            <TouchableOpacity
              onPress={() => updateStatus(item, "Packed")}
              style={{ marginTop: 12, backgroundColor: "#EDE9FE", borderWidth: 1, borderColor: "#C4B5FD", paddingVertical: 11, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" }}
            >
              <MaterialCommunityIcons name="package-variant" size={16} color="#7C3AED" />
              <Text style={{ color: "#7C3AED", fontWeight: "700", fontSize: 13, marginLeft: 6 }}>Mark Packed</Text>
            </TouchableOpacity>
          ) : item.nvcharStatus === "Packed" ? (
            <TouchableOpacity
              onPress={() => updateStatus(item, "Shipped")}
              style={{ marginTop: 12, backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE", paddingVertical: 11, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" }}
            >
              <MaterialCommunityIcons name="truck-fast-outline" size={16} color="#2563EB" />
              <Text style={{ color: "#2563EB", fontWeight: "700", fontSize: 13, marginLeft: 6 }}>Mark Shipped</Text>
            </TouchableOpacity>
          ) : item.nvcharStatus === "Shipped" ? (
            <TouchableOpacity
              onPress={() => updateStatus(item, "Delivered")}
              style={{ marginTop: 12, backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0", paddingVertical: 11, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" }}
            >
              <MaterialCommunityIcons name="home-check-outline" size={16} color="#10B981" />
              <Text style={{ color: "#10B981", fontWeight: "700", fontSize: 13, marginLeft: 6 }}>Mark Delivered</Text>
            </TouchableOpacity>
          ) : null}

          {showCollect && (
            <TouchableOpacity
              onPress={() => collectCodPayment(item, paymentInfo)}
              style={{ marginTop: 10, backgroundColor: "#16A34A", paddingVertical: 11, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" }}
              disabled={collectingId === item.id}
            >
              <MaterialCommunityIcons name="cash" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13, marginLeft: 6 }}>
                {collectingId === item.id ? "Updating..." : "Mark Payment Collected"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F9F4" }}>
      <View style={{ backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 0, borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "900", color: "#111827" }}>Orders</Text>
            <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
              {orders.length} total - {tabCounts.Pending || 0} pending
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => load()}
            style={{ width: 40, height: 40, backgroundColor: "#F0FDF4", borderRadius: 12, alignItems: "center", justifyContent: "center" }}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#16A34A" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row" }}>
          <FlatList
            horizontal
            data={TABS}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: tab }) => {
              const isActive = tab === activeTab;
              const s = STATUS_STYLE[tab] || STATUS_STYLE.Pending;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    alignItems: "center",
                    borderBottomWidth: 2,
                    borderColor: isActive ? s.text : "transparent",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontWeight: "700", fontSize: 13, color: isActive ? s.text : "#9CA3AF" }}>
                      {tab}
                    </Text>
                    {(tabCounts[tab] ?? 0) > 0 && (
                      <View
                        style={{
                          marginLeft: 5,
                          minWidth: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: isActive ? s.text : "#F3F4F6",
                          alignItems: "center",
                          justifyContent: "center",
                          paddingHorizontal: 4,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "800", color: isActive ? "#fff" : "#9CA3AF" }}>
                          {tabCounts[tab]}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={{ color: "#9CA3AF", marginTop: 12, fontSize: 13 }}>Loading orders...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <MaterialCommunityIcons name="wifi-off" size={48} color="#D1D5DB" />
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#374151", marginTop: 14, marginBottom: 6 }}>Connection Error</Text>
          <Text style={{ color: "#9CA3AF", fontSize: 13, textAlign: "center", marginBottom: 20 }}>{error}</Text>
          <TouchableOpacity
            onPress={() => load()}
            style={{ backgroundColor: "#16A34A", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => String(item.id ?? item.nvcharOrderNumber ?? i)}
          renderItem={renderCard}
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#16A34A"]} tintColor="#16A34A" />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 80, paddingHorizontal: 32 }}>
              <View style={{ width: 80, height: 80, backgroundColor: "#F0FDF4", borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={38} color="#BBF7D0" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#374151", marginBottom: 6 }}>
                No {activeTab} Orders
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: 13, textAlign: "center", lineHeight: 20 }}>
                {activeTab === "Pending" ? "New orders from buyers will appear here." : `No ${activeTab.toLowerCase()} orders yet.`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
