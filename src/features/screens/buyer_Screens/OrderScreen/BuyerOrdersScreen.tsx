import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useIsFocused, useNavigation } from "@react-navigation/native";
import RazorpayCheckout from "react-native-razorpay";
import { orderService } from "@/services/buyer/orderService";
import { buyerCropService } from "@/services/buyer/buyerCropService";
import { razorpayService } from "@/services/payment/razorpayService";
import { parseStoredUser } from "@/src/utils/authSession";

const TABS = ["Pending", "Accepted", "Packed", "Shipped", "Delivered", "Completed", "Rejected", "Cancelled"];

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  Pending: { bg: "#FEF3C7", text: "#D97706", icon: "clock-outline" },
  Accepted: { bg: "#DCFCE7", text: "#16A34A", icon: "check-circle-outline" },
  Packed: { bg: "#EDE9FE", text: "#7C3AED", icon: "package-variant" },
  Shipped: { bg: "#DBEAFE", text: "#2563EB", icon: "truck-fast-outline" },
  Delivered: { bg: "#ECFDF5", text: "#10B981", icon: "home-check-outline" },
  Completed: { bg: "#ECFDF5", text: "#10B981", icon: "check-decagram-outline" },
  Rejected: { bg: "#FEE2E2", text: "#DC2626", icon: "close-circle-outline" },
  Cancelled: { bg: "#F3F4F6", text: "#6B7280", icon: "cancel" },
};

type PaymentInfo = {
  status: string;
  method: string;
  tx?: any;
};

export default function BuyerOrdersScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState("Pending");
  const [orders, setOrders] = useState<any[]>([]);
  const [paymentMap, setPaymentMap] = useState<Record<number, PaymentInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [addressDraft, setAddressDraft] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isCancellingId, setIsCancellingId] = useState<number | null>(null);
  const [retryingId, setRetryingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (isFocused) fetchOrders();
  }, [isFocused]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const user = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));

      if (!user?.id) {
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "BuyerLogin" }] }));
        return;
      }

      const localOrders = await orderService.getLocalOrders();

      let remoteOrders: any[] = [];
      try {
        const response = await orderService.getOrdersByBuyerId(user.id);
        if (response?.status === "success" && Array.isArray(response.data)) {
          remoteOrders = response.data;
        } else if (Array.isArray(response?.data)) {
          remoteOrders = response.data;
        } else if (Array.isArray(response)) {
          remoteOrders = response;
        }
      } catch (e) {
        // Keep local orders
      }

      const mergedMap = new Map<string, any>();
      for (const o of localOrders) {
        const key = String(o.nvcharOrderNumber || o.id || "");
        if (key) mergedMap.set(key, o);
      }
      for (const o of remoteOrders) {
        const key = String(o.nvcharOrderNumber || o.id || "");
        if (!key) continue;
        const existing = mergedMap.get(key) || {};
        mergedMap.set(key, { ...existing, ...o });
      }

      const merged = Array.from(mergedMap.values());
      setOrders(merged);
      await AsyncStorage.setItem("@buyer_local_orders", JSON.stringify(merged));

      await loadPaymentStatus(merged);
    } catch (e) {
      console.log("Error fetching orders:", e);
      const localOrders = await orderService.getLocalOrders();
      setOrders(localOrders);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentStatus = async (list: any[]) => {
    try {
      const ids = list
        .map((o) => Number(o.id))
        .filter((id) => Number.isFinite(id) && id > 0);

      const results = await Promise.all(
        ids.map((id) => orderService.getPaymentByOrderId(id).catch(() => null))
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

  const filteredOrders = orders.filter(
    (o) => String(o.nvcharStatus || "Pending").toLowerCase() === activeTab.toLowerCase()
  );

  const resolveCropForOrder = async (order: any) => {
    const cropId = Number(order?.intCropId || order?.cropId || order?.id);
    if (cropId) {
      try {
        const response = await buyerCropService.getCrops();
        const list = buyerCropService.extractCropList(response);
        const found = list.find((c: any) => Number(c.id) === cropId);
        if (found) return found;
      } catch {}
    }

    return {
      id: cropId || order?.id,
      intFarmerId: Number(order?.intFarmerId) || 0,
      nvcharCropName: order?.cropName || order?.nvcharCropName || "Crop",
      nvcharCropImageUrl: order?.cropImageUrl || order?.nvcharCropImageUrl || "",
      floatPricePerKg: Number(order?.intUnitPrice || order?.floatPricePerKg || 0),
      nvcharLocation: order?.nvcharLocation || "",
      floatQuantity: Number(order?.intQuantity || 0),
      dtHarvestDate: order?.dtHarvestDate || "",
      nvcharDescription: order?.nvcharDescription || "",
      ynOrganic: Boolean(order?.ynOrganic),
    };
  };

  const openChangeAddress = (order: any) => {
    setEditingOrder(order);
    setAddressDraft(order?.nvcharDeliveryAddress || "");
  };

  const saveAddress = async () => {
    if (!editingOrder) return;
    if (!addressDraft.trim()) {
      Alert.alert("Invalid Address", "Please enter a delivery address.");
      return;
    }

    setIsSavingAddress(true);
    try {
      await orderService.updateOrderAddress(editingOrder.id, addressDraft.trim());

      const updated = orders.map((o) =>
        o.id === editingOrder.id ? { ...o, nvcharDeliveryAddress: addressDraft.trim() } : o
      );
      setOrders(updated);
      await AsyncStorage.setItem("@buyer_local_orders", JSON.stringify(updated));
      setEditingOrder(null);
    } catch (e) {
      Alert.alert("Update Failed", "Could not update address. Please try again.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCancelOrder = (order: any) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? A refund will be initiated if payment was captured.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setIsCancellingId(order.id);
              const res = await orderService.cancelOrder(order.id, "Cancelled by buyer");
              const updatedOrder = res?.data?.order || { ...order, nvcharStatus: "Cancelled" };
              const paymentStatus = res?.data?.transaction?.nvcharPaymentStatus;

              const updated = orders.map((o) =>
                o.id === order.id
                  ? {
                      ...o,
                      ...updatedOrder,
                      paymentStatus: paymentStatus || o.paymentStatus,
                    }
                  : o
              );
              setOrders(updated);
              await AsyncStorage.setItem("@buyer_local_orders", JSON.stringify(updated));
            } catch (e) {
              Alert.alert("Cancel Failed", "Could not cancel the order. Please try again.");
            } finally {
              setIsCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const retryPayment = async (order: any) => {
    try {
      setRetryingId(order.id || order.nvcharOrderNumber);
      const user = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));
      if (!user?.id) {
        Alert.alert("Login Required", "Please log in before retrying payment.");
        return;
      }

      const payload = order.draftPayload || {
        nvcharOrderNumber: order.nvcharOrderNumber || `ORD-${Date.now()}`,
        intFarmerId: Number(order.intFarmerId) || 1,
        intBuyerId: Number(order.intBuyerId) || Number(user.id),
        intCropId: Number(order.intCropId) || 1,
        intQuantity: Number(order.intQuantity) || 1,
        intUnitPrice: Number(order.intUnitPrice) || 0,
        intTotalPrice: Number(order.intTotalPrice) || 0,
        nvcharStatus: "Pending",
        nvcharDeliveryAddress: order.nvcharDeliveryAddress || "",
      };

      const createRes = await razorpayService.createOrder({
        amount: Math.round(Number(payload.intTotalPrice) * 100),
        currency: "INR",
        receipt: payload.nvcharOrderNumber,
        notes: { cropId: String(payload.intCropId), buyerId: String(payload.intBuyerId) },
      });

      if (createRes?.status !== "success" || !createRes?.data?.orderId) {
        Alert.alert("Payment Error", createRes?.message || "Could not start payment.");
        return;
      }

      const options: any = {
        key: createRes.data.keyId,
        order_id: createRes.data.orderId,
        amount: Math.round(Number(payload.intTotalPrice) * 100),
        currency: "INR",
        name: "AgroConnect",
        description: `${order?.cropName || "Crop"} - ${payload.intQuantity} kg`,
        prefill: {
          name: user?.nvcharFullName || "",
          email: user?.nvcharEmail || "",
          contact: user?.nvcharPhoneNumber || "",
        },
        theme: { color: "#1D4ED8" },
      };

      if (!RazorpayCheckout || typeof (RazorpayCheckout as any).open !== "function") {
        Alert.alert(
          "Razorpay Not Available",
          "Razorpay native SDK is not loaded. This usually happens in Expo Go. Please use a Dev Client or a production build, or choose COD."
        );
        return;
      }

      const paymentResult: any = await (RazorpayCheckout as any).open(options);
      const verifyRes = await razorpayService.verifyPaymentAndCreateOrder({
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
        order: payload,
      });

      if (verifyRes?.status !== "success") {
        Alert.alert("Payment Verification Failed", verifyRes?.message || "Please try again later.");
        return;
      }

      const savedOrder = verifyRes?.data?.order || payload;
      const transaction = verifyRes?.data?.transaction;

      const localOrder = {
        ...savedOrder,
        cropName: order.cropName || "Crop",
        cropImageUrl: order.cropImageUrl || "",
        paymentStatus: transaction?.nvcharPaymentStatus || "Paid",
        paymentMethod: transaction?.nvcharPaymentMethod || "Razorpay",
        paymentTransactionNo: transaction?.nvcharTransactionNo,
      };

      const updated = orders.filter((o) => o.id !== order.id && o.nvcharOrderNumber !== order.nvcharOrderNumber);
      const merged = [localOrder, ...updated];
      setOrders(merged);
      await AsyncStorage.setItem("@buyer_local_orders", JSON.stringify(merged));
    } catch (e: any) {
      const msg = e?.description || e?.message || "Payment cancelled or failed.";
      Alert.alert("Payment Failed", msg);
    } finally {
      setRetryingId(null);
    }
  };

  const renderOrderCard = ({ item }: { item: any }) => {
    const statusStyle = STATUS_STYLE[item.nvcharStatus] || STATUS_STYLE.Pending;
    const imageUrl =
      buyerCropService.resolveCropImageUrl(item.cropImageUrl) ||
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=300&q=80";

    const paymentInfo: PaymentInfo =
      item.localDraft
        ? { status: item.paymentStatus || "Failed", method: item.paymentMethod || "Razorpay" }
        : paymentMap[item.id] || {
            status: item.paymentStatus || "Pending",
            method: item.paymentMethod || "Razorpay",
          };

    const showRetry =
      (paymentInfo.status || "").toLowerCase() === "failed" &&
      (paymentInfo.method || "").toLowerCase() === "razorpay";

    return (
      <View className="mx-5 mb-3 bg-white rounded-2xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#F3F4F6" }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={async () => {
            const crop = await resolveCropForOrder(item);
            navigation.navigate("Browse", {
              screen: "BuyerCropDetails",
              params: {
                crop,
                orderStatus: item?.nvcharStatus || "Pending",
                orderNumber: item?.nvcharOrderNumber || item?.id,
                order: item,
              },
            });
          }}
        >
          <View className="flex-row items-center justify-between px-4 py-2.5" style={{ backgroundColor: "#F9FAFB", borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
            <Text className="text-[#9CA3AF] text-xs font-semibold">
              {item.nvcharOrderNumber || `#${item.id}`}
            </Text>
            <View className="flex-row items-center px-2 py-1 rounded-full" style={{ backgroundColor: statusStyle.bg }}>
              <MaterialCommunityIcons name={statusStyle.icon as any} size={12} color={statusStyle.text} />
              <Text className="text-xs font-bold ml-1" style={{ color: statusStyle.text }}>
                {item.nvcharStatus || "Pending"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center p-4">
            <Image source={{ uri: imageUrl }} className="w-16 h-16 rounded-xl" resizeMode="cover" />
            <View className="flex-1 ml-3">
              <Text className="text-[#111827] font-bold text-base" numberOfLines={1}>
                {item.cropName || `Crop #${item.intCropId}`}
              </Text>
              <Text className="text-[#9CA3AF] text-xs mt-0.5">
                Qty: {item.intQuantity} kg  -  Rs {item.intUnitPrice}/kg
              </Text>
              {item.nvcharDeliveryAddress ? (
                <View className="flex-row items-center mt-1">
                  <MaterialCommunityIcons name="map-marker-outline" size={11} color="#9CA3AF" />
                  <Text className="text-[#9CA3AF] text-xs ml-0.5 flex-1" numberOfLines={1}>
                    {item.nvcharDeliveryAddress}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="items-end ml-2">
              <Text className="text-[#1D4ED8] font-extrabold text-base">Rs {item.intTotalPrice}</Text>
              <Text className="text-[#9CA3AF] text-[10px] mt-0.5">Total</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View className="px-4 pb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    paymentInfo.status === "Paid" ||
                    paymentInfo.status === "Collected" ||
                    paymentInfo.status === "Settled"
                      ? "#10B981"
                      : "#F59E0B",
                }}
              />
              <Text className="text-xs font-semibold text-[#6B7280] ml-2">
                Payment: {paymentInfo.status} ({paymentInfo.method})
              </Text>
            </View>
            {item.nvcharStatus === "Pending" && (
              <Text className="text-[10px] text-[#9CA3AF]">You can edit or cancel</Text>
            )}
          </View>

          {showRetry && (
            <TouchableOpacity
              onPress={() => retryPayment(item)}
              className="mt-3 py-2 rounded-xl items-center"
              style={{ backgroundColor: "#1D4ED8" }}
              disabled={retryingId === item.id || retryingId === item.nvcharOrderNumber}
            >
              <Text className="text-white font-bold text-xs">
                {retryingId === item.id || retryingId === item.nvcharOrderNumber ? "Retrying..." : "Retry Payment"}
              </Text>
            </TouchableOpacity>
          )}

          {item.nvcharStatus === "Pending" && !showRetry && (
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                onPress={() => openChangeAddress(item)}
                className="flex-1 py-2 rounded-xl items-center"
                style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" }}
              >
                <Text className="text-[#2563EB] font-bold text-xs">Change Address</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleCancelOrder(item)}
                className="flex-1 py-2 rounded-xl items-center"
                style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" }}
                disabled={isCancellingId === item.id}
              >
                <Text className="text-[#DC2626] font-bold text-xs">
                  {isCancellingId === item.id ? "Cancelling..." : "Cancel Order"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: "#F3F4F6" }}>
        <MaterialCommunityIcons name="receipt-text-outline" size={38} color="#D1D5DB" />
      </View>
      <Text className="text-[#111827] font-bold text-base text-center">No {activeTab} Orders</Text>
      <Text className="text-[#9CA3AF] text-sm text-center mt-1 mb-6">
        {activeTab === "Pending" ? "Your placed orders will appear here." : `No ${activeTab.toLowerCase()} orders yet.`}
      </Text>
      {activeTab === "Pending" && (
        <TouchableOpacity
          onPress={() => navigation.navigate("Browse", { screen: "BuyerMarketplaceHome" })}
          className="flex-row items-center px-5 py-3 rounded-xl"
          style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" }}
        >
          <MaterialCommunityIcons name="store-search-outline" size={18} color="#3B82F6" />
          <Text className="text-[#3B82F6] font-bold text-sm ml-2">Browse Marketplace</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F4F7FB]">
      <View className="bg-white px-5 pt-5 pb-2">
        <Text className="text-xl font-extrabold text-[#111827] mb-4">My Orders</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6 }}>
          {TABS.map((tab) => {
            const count = orders.filter(
              (o) => String(o.nvcharStatus || "Pending").toLowerCase() === tab.toLowerCase()
            ).length;
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="items-center mr-5"
                style={{ borderBottomWidth: 2, borderColor: isActive ? "#1D4ED8" : "transparent" }}
              >
                <View className="flex-row items-center pb-2">
                  <Text className="font-bold text-sm" style={{ color: isActive ? "#1D4ED8" : "#9CA3AF" }}>
                    {tab}
                  </Text>
                  {count > 0 && (
                    <View className="ml-1.5 w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: isActive ? "#1D4ED8" : "#F3F4F6" }}>
                      <Text className="text-[10px] font-bold" style={{ color: isActive ? "#fff" : "#9CA3AF" }}>
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-[#9CA3AF] text-sm mt-3 font-semibold">Loading orders...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, i) => String(item.nvcharOrderNumber || item.id || i)}
          renderItem={renderOrderCard}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={!!editingOrder} transparent animationType="fade" onRequestClose={() => setEditingOrder(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 8 }}>
              Change Delivery Address
            </Text>
            <TextInput
              value={addressDraft}
              onChangeText={setAddressDraft}
              placeholder="Enter new delivery address"
              placeholderTextColor="#9CA3AF"
              multiline
              style={{
                minHeight: 80,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                padding: 10,
                color: "#111827",
              }}
            />

            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setEditingOrder(null)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", marginRight: 8 }}
              >
                <Text style={{ color: "#6B7280", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveAddress}
                disabled={isSavingAddress}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#1D4ED8", alignItems: "center" }}
              >
                {isSavingAddress ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
