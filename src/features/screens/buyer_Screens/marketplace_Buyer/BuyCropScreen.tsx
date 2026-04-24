import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RazorpayCheckout from "react-native-razorpay";
import { buyerCropService } from "@/services/buyer/buyerCropService";
import { orderService } from "@/services/buyer/orderService";
import { razorpayService } from "@/services/payment/razorpayService";
import { parseStoredUser } from "@/src/utils/authSession";

type PaymentMethod = "Razorpay" | "COD";

export default function BuyCropScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const crop = route.params?.crop;

  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Razorpay");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const imageUrl =
    buyerCropService.resolveCropImageUrl(crop?.nvcharCropImageUrl) ||
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=300&q=80";

  const price = Number(crop?.floatPricePerKg || 0);
  const maxQty = Number(crop?.floatQuantity || 999);

  const subtotal = useMemo(() => quantity * price, [quantity, price]);
  const deliveryFee = 50;
  const serviceFee = Math.round(subtotal * 0.02);
  const totalAmount = subtotal + deliveryFee + serviceFee;
  const footerBottomPadding = Math.max(16, insets.bottom + 8);
  const footerHeight = footerBottomPadding + 84;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));
        if (user?.nvcharAddress) setAddress(user.nvcharAddress);
        if (user?.nvcharFullName) setBuyerName(user.nvcharFullName);
        if (user?.nvcharEmail) setBuyerEmail(user.nvcharEmail);
        if (user?.nvcharPhoneNumber) setBuyerPhone(String(user.nvcharPhoneNumber));
      } catch (e) {
        console.log("Error loading user", e);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const changeQty = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxQty) return maxQty;
      return next;
    });
  };

  const buildOrderPayload = (user: any) => {
    const orderNumber = `ORD-${Date.now()}`;
    return {
      nvcharOrderNumber: orderNumber,
      intFarmerId: Number(crop.intFarmerId) || 1,
      intBuyerId: Number(user.id),
      intCropId: Number(crop.id) || 1,
      intQuantity: quantity,
      intUnitPrice: Math.round(price),
      intTotalPrice: Math.round(totalAmount),
      nvcharStatus: "Pending",
      nvcharDeliveryAddress: address.trim(),
    };
  };

  const saveFailedPaymentDraft = async (orderPayload: any) => {
    const draft = {
      ...orderPayload,
      id: `draft-${Date.now()}`,
      cropName: crop.nvcharCropName,
      cropImageUrl: crop.nvcharCropImageUrl,
      paymentStatus: "Failed",
      paymentMethod: "Razorpay",
      localDraft: true,
      draftPayload: orderPayload,
    };
    await orderService.saveLocalOrder(draft);
  };

  const handleCodOrder = async () => {
    if (isSubmitting) return;

    if (!address.trim()) {
      Alert.alert("Missing Address", "Please enter a delivery address.");
      return;
    }

    if (quantity < 1) {
      Alert.alert("Invalid Quantity", "Please enter a quantity of at least 1 kg.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));

      if (!user?.id) {
        Alert.alert("Login Required", "Please log in before placing an order.");
        navigation.navigate("BuyerLogin");
        return;
      }

      const orderPayload = buildOrderPayload(user);
      const res = await orderService.placeCodOrder(orderPayload);

      if (res?.status !== "success") {
        Alert.alert("Order Failed", res?.message || "Could not place COD order.");
        return;
      }

      const savedOrder = res?.data?.order || orderPayload;
      const transaction = res?.data?.transaction;

      const localOrder = {
        ...savedOrder,
        cropName: crop.nvcharCropName,
        cropImageUrl: crop.nvcharCropImageUrl,
        paymentStatus: transaction?.nvcharPaymentStatus || "Pending",
        paymentMethod: transaction?.nvcharPaymentMethod || "COD",
        paymentTransactionNo: transaction?.nvcharTransactionNo,
      };

      await orderService.saveLocalOrder(localOrder);

      navigation.replace("OrderSuccess", {
        crop,
        order: localOrder,
        buyerName,
        transaction,
      });
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayAndPlaceOrder = async () => {
    if (isSubmitting) return;

    if (!address.trim()) {
      Alert.alert("Missing Address", "Please enter a delivery address.");
      return;
    }

    if (quantity < 1) {
      Alert.alert("Invalid Quantity", "Please enter a quantity of at least 1 kg.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));

      if (!user?.id) {
        Alert.alert("Login Required", "Please log in before placing an order.");
        navigation.navigate("BuyerLogin");
        return;
      }

      const orderPayload = buildOrderPayload(user);

      const createRes = await razorpayService.createOrder({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: orderPayload.nvcharOrderNumber,
        notes: { cropId: String(crop.id), buyerId: String(user.id) },
      });

      if (createRes?.status !== "success" || !createRes?.data?.orderId) {
        Alert.alert("Payment Error", createRes?.message || "Could not start payment.");
        return;
      }

      const options: any = {
        key: createRes.data.keyId,
        order_id: createRes.data.orderId,
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        name: "AgroConnect",
        description: `${crop?.nvcharCropName || "Crop"} - ${quantity} kg`,
        prefill: {
          name: buyerName || user?.nvcharFullName || "",
          email: buyerEmail || user?.nvcharEmail || "",
          contact: buyerPhone || user?.nvcharPhoneNumber || "",
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
        order: orderPayload,
      });

      if (verifyRes?.status !== "success") {
        await saveFailedPaymentDraft(orderPayload);
        Alert.alert("Payment Verification Failed", verifyRes?.message || "Please retry from Orders.");
        return;
      }

      const savedOrder = verifyRes?.data?.order || orderPayload;
      const transaction = verifyRes?.data?.transaction;

      const localOrder = {
        ...savedOrder,
        cropName: crop.nvcharCropName,
        cropImageUrl: crop.nvcharCropImageUrl,
        paymentStatus: transaction?.nvcharPaymentStatus || "Paid",
        paymentMethod: transaction?.nvcharPaymentMethod || "Razorpay",
        paymentTransactionNo: transaction?.nvcharTransactionNo,
      };

      await orderService.saveLocalOrder(localOrder);

      navigation.replace("OrderSuccess", {
        crop,
        order: localOrder,
        buyerName,
        transaction,
      });
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.details ||
        null;
      const msg = apiMessage || error?.description || error?.message || "Payment cancelled or failed.";
      try {
        const user = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));
        if (user?.id) {
          const orderPayload = buildOrderPayload(user);
          await saveFailedPaymentDraft(orderPayload);
        }
      } catch {}
      Alert.alert("Payment Failed", `${msg} You can retry from Orders.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!crop) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-[#6B7280]">No crop selected.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F4F7FB]">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="bg-white flex-row items-center px-4 py-4" style={{ borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1 mr-3">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-extrabold text-[#111827] flex-1">Checkout</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: footerHeight + 28 }}>
          {/* Crop summary */}
          <View className="mx-5 mt-4 bg-white rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#F3F4F6" }}>
            <Text className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Selected Crop</Text>
            <View className="flex-row items-center">
              <Image source={{ uri: imageUrl }} className="w-20 h-20 rounded-xl" resizeMode="cover" />
              <View className="flex-1 ml-4">
                <Text className="text-[#111827] font-extrabold text-base" numberOfLines={2}>
                  {crop.nvcharCropName}
                </Text>
                <View className="flex-row items-center mt-1">
                  <MaterialCommunityIcons name="map-marker-outline" size={12} color="#9CA3AF" />
                  <Text className="text-[#9CA3AF] text-xs ml-1" numberOfLines={1}>
                    {crop.nvcharLocation || "Farm location"}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-[#16A34A] font-extrabold text-lg">Rs {price}/kg</Text>
                  <Text className="text-[#9CA3AF] text-xs">Stock: {maxQty} kg</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quantity */}
          <View className="mx-5 mt-4 bg-white rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#F3F4F6" }}>
            <Text className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Quantity (kg)</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => changeQty(-1)}
                className="w-11 h-11 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: quantity <= 1 ? "#F9FAFB" : "#EFF6FF",
                  borderWidth: 1,
                  borderColor: quantity <= 1 ? "#F3F4F6" : "#BFDBFE",
                }}
              >
                <MaterialCommunityIcons name="minus" size={20} color={quantity <= 1 ? "#D1D5DB" : "#3B82F6"} />
              </TouchableOpacity>

              <View className="flex-1 mx-3 bg-[#F9FAFB] rounded-xl h-11 items-center justify-center" style={{ borderWidth: 1, borderColor: "#F3F4F6" }}>
                <Text className="text-xl font-extrabold text-[#111827]">{quantity} kg</Text>
              </View>

              <TouchableOpacity
                onPress={() => changeQty(1)}
                className="w-11 h-11 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: quantity >= maxQty ? "#F9FAFB" : "#1D4ED8",
                  borderWidth: 1,
                  borderColor: quantity >= maxQty ? "#F3F4F6" : "#1D4ED8",
                }}
              >
                <MaterialCommunityIcons name="plus" size={20} color={quantity >= maxQty ? "#D1D5DB" : "white"} />
              </TouchableOpacity>
            </View>

            <View className="flex-row mt-3 gap-2">
              {[10, 25, 50, 100].filter((v) => v <= maxQty).map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setQuantity(v)}
                  className="flex-1 py-1.5 rounded-lg items-center"
                  style={{ backgroundColor: quantity === v ? "#1D4ED8" : "#F3F4F6" }}
                >
                  <Text className="text-xs font-bold" style={{ color: quantity === v ? "#fff" : "#6B7280" }}>
                    {v}kg
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address */}
          <View className="mx-5 mt-4 bg-white rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#F3F4F6" }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Delivery Address</Text>
              <Text className="text-[10px] text-[#9CA3AF]">Tap to edit</Text>
            </View>
            <View className="flex-row items-start rounded-xl px-3 py-3" style={{ backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6" }}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#9CA3AF" style={{ marginTop: 2 }} />
              <TextInput
                className="flex-1 ml-2 text-sm text-[#111827]"
                placeholder="Enter delivery address"
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Payment method */}
          <View className="mx-5 mt-4 bg-white rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#F3F4F6" }}>
            <Text className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Payment Method</Text>
            <TouchableOpacity
              onPress={() => setPaymentMethod("Razorpay")}
              className="flex-row items-center rounded-xl p-3 mb-3"
              style={{
                backgroundColor: paymentMethod === "Razorpay" ? "#EFF6FF" : "#F9FAFB",
                borderWidth: 1,
                borderColor: paymentMethod === "Razorpay" ? "#BFDBFE" : "#F3F4F6",
              }}
            >
              <MaterialCommunityIcons name="credit-card-outline" size={20} color="#1D4ED8" />
              <View className="ml-3 flex-1">
                <Text className="text-[#1D4ED8] font-bold text-sm">Online Payment</Text>
                <Text className="text-[#6B7280] text-xs">UPI, Card, Net Banking (Razorpay)</Text>
              </View>
              {paymentMethod === "Razorpay" && (
                <MaterialCommunityIcons name="check-circle" size={18} color="#1D4ED8" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod("COD")}
              className="flex-row items-center rounded-xl p-3"
              style={{
                backgroundColor: paymentMethod === "COD" ? "#ECFDF5" : "#F9FAFB",
                borderWidth: 1,
                borderColor: paymentMethod === "COD" ? "#BBF7D0" : "#F3F4F6",
              }}
            >
              <MaterialCommunityIcons name="cash" size={20} color="#16A34A" />
              <View className="ml-3 flex-1">
                <Text className="text-[#16A34A] font-bold text-sm">Cash on Delivery</Text>
                <Text className="text-[#6B7280] text-xs">Pay when your order arrives</Text>
              </View>
              {paymentMethod === "COD" && (
                <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
              )}
            </TouchableOpacity>
          </View>

          {/* Price breakdown */}
          <View className="mx-5 mt-4 bg-white rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#F3F4F6" }}>
            <Text className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Price Details</Text>
            <View className="flex-row justify-between mb-2.5">
              <Text className="text-[#6B7280] text-sm">{quantity} kg x Rs {price}</Text>
              <Text className="text-[#111827] text-sm font-semibold">Rs {subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2.5">
              <Text className="text-[#6B7280] text-sm">Delivery fee</Text>
              <Text className="text-[#111827] text-sm font-semibold">Rs {deliveryFee.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-[#6B7280] text-sm">Service fee (2%)</Text>
              <Text className="text-[#111827] text-sm font-semibold">Rs {serviceFee.toFixed(2)}</Text>
            </View>
            <View style={{ borderTopWidth: 1, borderStyle: "dashed", borderColor: "#E5E7EB", marginBottom: 12 }} />
            <View className="flex-row justify-between items-center">
              <Text className="text-[#111827] font-extrabold text-base">Total</Text>
              <Text className="text-[#1D4ED8] font-extrabold text-xl">Rs {totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          {isLoadingUser && (
            <View className="mx-5 mt-3 flex-row items-center">
              <ActivityIndicator size="small" color="#1D4ED8" />
              <Text className="text-[#6B7280] text-xs ml-2">Loading buyer info...</Text>
            </View>
          )}
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-6"
          style={{
            borderTopWidth: 1,
            borderColor: "#F3F4F6",
            paddingBottom: footerBottomPadding,
          }}
        >
          <TouchableOpacity
            onPress={paymentMethod === "COD" ? handleCodOrder : handlePayAndPlaceOrder}
            disabled={isSubmitting}
            className="w-full flex-row items-center justify-center rounded-xl py-4"
            style={{ backgroundColor: isSubmitting ? "#93C5FD" : "#1D4ED8" }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={paymentMethod === "COD" ? "cash" : "shield-check"}
                  size={20}
                  color="white"
                />
                <Text className="text-white font-bold text-base ml-2">
                  {paymentMethod === "COD"
                    ? `Place Order (COD) - Rs ${totalAmount.toFixed(2)}`
                    : `Pay Now - Rs ${totalAmount.toFixed(2)}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
