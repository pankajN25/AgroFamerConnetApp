import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buyerCropService } from "@/services/buyer/buyerCropService";
import { orderService } from "@/services/buyer/orderService";
import { parseStoredUser } from "@/src/utils/authSession";

const FALLBACK_CROP = {
  id: 1,
  nvcharCropName: "Premium Organic Wheat",
  floatPricePerKg: 2.5,
  floatQuantity: 1200,
  nvcharCropImageUrl:
    "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=300&q=80",
  intFarmerId: 1,
};

export default function BuyCropScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const crop = route.params?.crop || FALLBACK_CROP;

  let imageUrl = buyerCropService.resolveCropImageUrl(crop.nvcharCropImageUrl);
  if (!imageUrl) {
    imageUrl = FALLBACK_CROP.nvcharCropImageUrl;
  }

  const [quantity, setQuantity] = useState(50);
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const price = Number(crop.floatPricePerKg || 0);
  const subtotal = quantity * price;
  const deliveryFee = 15;
  const serviceFee = subtotal * 0.02;
  const totalAmount = subtotal + deliveryFee + serviceFee;

  const handleIncrease = () => {
    if (quantity < Number(crop.floatQuantity || 0)) {
      setQuantity((prev) => prev + 10);
    }
  };

  const handleDecrease = () => {
    if (quantity > 10) {
      setQuantity((prev) => prev - 10);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("BuyerMarketplaceHome");
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) {
      return;
    }

    if (!address.trim()) {
      Alert.alert("Missing Information", "Please enter a delivery address.");
      return;
    }

    try {
      setIsSubmitting(true);

      const user = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));

      if (!user?.id) {
        Alert.alert("Login Required", "Please log in as a buyer before placing an order.");
        navigation.navigate("BuyerLogin");
        return;
      }

      const orderPayload = {
        nvcharOrderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
        intFarmerId: Number(crop.intFarmerId) || 1,
        intBuyerId: user.id,
        intCropId: Number(crop.id) || 1,
        intQuantity: Math.round(quantity),
        intUnitPrice: Math.round(price),
        intTotalPrice: Math.round(totalAmount),
        nvcharStatus: "Pending",
        nvcharDeliveryAddress: address.trim(),
      };

      console.log("Sending order payload to backend:", orderPayload);

      const localOrder = {
        ...orderPayload,
        id: Date.now(),
        cropName: crop.nvcharCropName,
        cropImageUrl: crop.nvcharCropImageUrl,
      };

      await orderService.saveLocalOrder(localOrder);

      let response = null;
      try {
        response = await orderService.placeOrder(orderPayload);
        console.log("Backend Response:", response);
      } catch (backendError: any) {
        console.log("Backend order save failed, keeping local order:", backendError?.response?.data || backendError);
      }

      navigation.replace("OrderSuccess", {
        crop,
        orderPayload: localOrder,
        orderResponse: response,
      });

    } catch (error: any) {
      console.log("Backend error details:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.detail?.[0]?.msg || 
                           "Server error occurred.";
                           
      Alert.alert("API Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100 z-10">
          <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-lg font-bold text-[#111827] pr-8">Buy Crop</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="px-6 pt-5">
            <Text className="text-[#111827] font-bold text-base mb-3">Crop Details</Text>
            <View className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm border border-gray-100 mb-6">
              <View className="flex-1 pr-4">
                <Text className="text-[#111827] font-extrabold text-lg leading-tight mb-2">
                  {crop.nvcharCropName}
                </Text>
                <Text className="text-[#00E600] font-extrabold text-base mb-2">
                  Rs. {price.toFixed(2)} <Text className="text-xs text-gray-500 font-normal">/ kg</Text>
                </Text>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="package-variant-closed" size={14} color="#9CA3AF" />
                  <Text className="text-[#6B7280] text-xs ml-1">Available: {crop.floatQuantity} kg</Text>
                </View>
              </View>
              <Image source={{ uri: imageUrl }} className="w-20 h-20 rounded-xl bg-gray-100" resizeMode="cover" />
            </View>

            <Text className="text-[#111827] font-bold text-base mb-3">Order Information</Text>

            <View className="mb-4">
              <Text className="text-[#6B7280] text-sm font-semibold mb-2">Quantity (kg)</Text>
              <View className="flex-row items-center space-x-3">
                <TouchableOpacity
                  onPress={handleDecrease}
                  className="w-12 h-12 bg-green-50 rounded-xl items-center justify-center border border-green-100"
                >
                  <MaterialCommunityIcons name="minus" size={24} color="#00E600" />
                </TouchableOpacity>

                <View className="flex-1 bg-white border border-gray-200 rounded-xl h-12 items-center justify-center">
                  <Text className="text-lg font-extrabold text-[#111827]">{quantity}</Text>
                </View>

                <TouchableOpacity
                  onPress={handleIncrease}
                  className="w-12 h-12 bg-[#00E600] rounded-xl items-center justify-center shadow-sm"
                >
                  <MaterialCommunityIcons name="plus" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-[#6B7280] text-sm font-semibold mb-2">Delivery Location</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-12 mb-3">
                <MaterialCommunityIcons name="map-marker" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-base text-[#111827]"
                  placeholder="Enter delivery address"
                  placeholderTextColor="#9CA3AF"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View className="w-full h-32 bg-gray-200 rounded-xl overflow-hidden opacity-80">
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80",
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            </View>

            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-2">
              <Text className="text-[#111827] font-bold text-base mb-4">Order Summary</Text>

              <View className="flex-row justify-between mb-3">
                <Text className="text-[#6B7280]">Subtotal ({quantity}kg x Rs. {price.toFixed(2)})</Text>
                <Text className="text-[#111827] font-bold">Rs. {subtotal.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-[#6B7280]">Delivery Fee</Text>
                <Text className="text-[#111827] font-bold">Rs. {deliveryFee.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-4">
                <Text className="text-[#6B7280]">Service Fee (2%)</Text>
                <Text className="text-[#111827] font-bold">Rs. {serviceFee.toFixed(2)}</Text>
              </View>

              <View className="border-t border-dashed border-gray-200 my-2" />

              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-[#111827] font-extrabold text-lg">Total Amount</Text>
                <Text className="text-[#00E600] font-extrabold text-2xl">Rs. {totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 w-full bg-white px-6 py-4 border-t border-gray-100 pb-8">
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={isSubmitting}
            className="w-full bg-[#00E600] py-4 rounded-2xl items-center justify-center flex-row shadow-sm"
          >
            <MaterialCommunityIcons name="cart-check" size={22} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
