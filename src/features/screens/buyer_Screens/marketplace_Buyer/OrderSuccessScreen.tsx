import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { buyerCropService } from "@/services/buyer/buyerCropService";

const STATUS_FLOW = ["Pending", "Accepted", "Packed", "Shipped", "Delivered", "Completed"];

export default function OrderSuccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { crop, order, buyerName, transaction } = route.params || {};

  const imageUrl =
    buyerCropService.resolveCropImageUrl(crop?.nvcharCropImageUrl) ||
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=300&q=80";

  const paymentStatus =
    transaction?.nvcharPaymentStatus || order?.paymentStatus || "Paid";
  const paymentMethod =
    transaction?.nvcharPaymentMethod || order?.paymentMethod || "Razorpay";

  const currentStatus = String(order?.nvcharStatus || "Pending");
  const statusIndex = STATUS_FLOW.indexOf(currentStatus);

  const goToOrders = () => {
    navigation.dispatch(CommonActions.navigate({ name: "Orders" }));
  };

  const goToMarketplace = () => {
    navigation.dispatch(CommonActions.navigate({ name: "Browse", params: { screen: "BuyerMarketplaceHome" } }));
  };

  const goHome = () => {
    navigation.dispatch(CommonActions.navigate({ name: "Home" }));
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F7FB]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="items-center pt-12 pb-6 px-6">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-5"
            style={{ backgroundColor: "#ECFDF5", borderWidth: 4, borderColor: "#BBF7D0" }}
          >
            <MaterialCommunityIcons name="check-bold" size={48} color="#10B981" />
          </View>
          <Text className="text-2xl font-extrabold text-[#111827] mb-2 text-center">
            Order Placed!
          </Text>
          <Text className="text-[#6B7280] text-sm text-center leading-relaxed">
            Your order has been sent to the farmer. You will be notified once it is accepted.
          </Text>
        </View>

        <View
          className="mx-5 bg-white rounded-2xl overflow-hidden"
          style={{ borderWidth: 1, borderColor: "#F3F4F6" }}
        >
          <View className="px-4 py-3" style={{ backgroundColor: "#EFF6FF" }}>
            <Text className="text-xs font-semibold text-[#6B7280]">Order Number</Text>
            <Text className="text-[#1D4ED8] font-extrabold text-base">{order?.nvcharOrderNumber || "-"}</Text>
          </View>

          <View className="flex-row items-center p-4" style={{ borderBottomWidth: 1, borderColor: "#F9FAFB" }}>
            <Image source={{ uri: imageUrl }} className="w-16 h-16 rounded-xl" resizeMode="cover" />
            <View className="flex-1 ml-3">
              <Text className="text-[#111827] font-bold text-base" numberOfLines={1}>
                {crop?.nvcharCropName || "-"}
              </Text>
              <Text className="text-[#9CA3AF] text-xs mt-0.5">
                {order?.intQuantity} kg x Rs {crop?.floatPricePerKg}/kg
              </Text>
            </View>
          </View>

          {[
            { label: "Buyer", value: buyerName || "-" },
            { label: "Delivery Address", value: order?.nvcharDeliveryAddress || "-" },
            { label: "Status", value: order?.nvcharStatus || "Pending", highlight: true },
            {
              label: "Payment",
              value: `${paymentStatus} (${paymentMethod})`,
              highlight:
                paymentStatus === "Paid" ||
                paymentStatus === "Collected" ||
                paymentStatus === "Settled",
            },
            { label: "Total Amount", value: `Rs ${order?.intTotalPrice || "-"}`, bold: true },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              className="flex-row items-start px-4 py-3"
              style={i < arr.length - 1 ? { borderBottomWidth: 1, borderColor: "#F9FAFB" } : {}}
            >
              <Text className="text-[#9CA3AF] text-sm w-32">{row.label}</Text>
              <Text
                className="flex-1 text-sm font-semibold text-right"
                style={{
                  color: row.highlight ? "#10B981" : row.bold ? "#1D4ED8" : "#111827",
                  fontWeight: row.bold ? "800" : "600",
                }}
                numberOfLines={2}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View
          className="mx-5 mt-4 bg-white rounded-2xl p-4"
          style={{ borderWidth: 1, borderColor: "#F3F4F6" }}
        >
          <Text className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-4">Order Progress</Text>
          {STATUS_FLOW.map((step, i) => {
            const done = statusIndex >= 0 && i <= statusIndex;
            return (
              <View key={step} className="flex-row items-center">
                <View className="items-center" style={{ width: 24 }}>
                  <MaterialCommunityIcons
                    name={done ? "check-circle" : "clock-outline"}
                    size={22}
                    color={done ? "#10B981" : "#D1D5DB"}
                  />
                  {i < STATUS_FLOW.length - 1 && (
                    <View
                      className="w-0.5 h-6"
                      style={{ backgroundColor: done ? "#10B981" : "#E5E7EB" }}
                    />
                  )}
                </View>
                <Text
                  className="ml-3 text-sm font-semibold mb-6"
                  style={{ color: done ? "#111827" : "#9CA3AF" }}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>

        <View className="mx-5 mt-4 mb-8 gap-3">
          <TouchableOpacity
            onPress={goToOrders}
            className="w-full flex-row items-center justify-center rounded-xl py-4"
            style={{ backgroundColor: "#1D4ED8" }}
          >
            <MaterialCommunityIcons name="receipt-text-outline" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">View My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToMarketplace}
            className="w-full flex-row items-center justify-center rounded-xl py-4"
            style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" }}
          >
            <MaterialCommunityIcons name="store-search-outline" size={20} color="#3B82F6" />
            <Text className="text-[#3B82F6] font-bold text-base ml-2">Continue Shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goHome}
            className="w-full flex-row items-center justify-center py-3"
          >
            <MaterialCommunityIcons name="home-outline" size={18} color="#9CA3AF" />
            <Text className="text-[#9CA3AF] font-semibold text-sm ml-1.5">Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
