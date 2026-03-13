// src/features/farmer/screens/OrderDetailsScreen.tsx
import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

// --- FALLBACK DUMMY DATA ---
const FALLBACK_ORDER = {
  id: 1,
  nvcharOrderNumber: "ORD-20260312-001",
  cropName: "Green Bell Peppers",
  intQuantity: 500,
  intUnitPrice: 40,
  intTotalPrice: 20000,
  buyerName: "Organic Foods Ltd.",
  nvcharDeliveryAddress: "Nairobi Central Market, Block A, Store 12",
  nvcharStatus: "Pending",
  dtDateOfCreation: "Mar 12, 2026 • 10:30 AM",
  imageUrl: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=400&q=80"
};

export default function OrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Try to get the order from navigation params, otherwise use the fallback dummy data
  const order = (route.params as any)?.order || FALLBACK_ORDER;

  const handleAccept = () => {
    Alert.alert("Accept Order", "Are you sure you want to accept this order? You will be expected to prepare the items for delivery.");
    // We will connect this to /edittblOrder later to change status to "Accepted"
  };

  const handleReject = () => {
    Alert.alert("Reject Order", "Are you sure you want to reject this order? The buyer will be notified.");
    // We will connect this to /edittblOrder later to change status to "Rejected"
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      
      {/* ---------------- HEADER ---------------- */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-4 bg-white shadow-sm z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#111827]">Order Details</Text>
        <View className="w-10" /> {/* Empty view for balance */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* ---------------- ORDER STATUS BANNER ---------------- */}
        <View className="bg-white px-6 py-5 mb-2 shadow-sm border-b border-gray-100">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[#6B7280] font-semibold text-sm">Order ID: {order.nvcharOrderNumber}</Text>
            <View className={`px-2.5 py-1 rounded-md ${
              order.nvcharStatus === 'Pending' ? 'bg-[#FEF3C7]' : 
              order.nvcharStatus === 'Accepted' ? 'bg-[#D1FAE5]' : 'bg-gray-100'
            }`}>
              <Text className={`text-xs font-bold uppercase ${
                order.nvcharStatus === 'Pending' ? 'text-[#D97706]' : 
                order.nvcharStatus === 'Accepted' ? 'text-[#059669]' : 'text-gray-600'
              }`}>
                {order.nvcharStatus}
              </Text>
            </View>
          </View>
          <Text className="text-[#9CA3AF] text-xs">{order.dtDateOfCreation}</Text>
        </View>

        {/* ---------------- CROP SUMMARY ---------------- */}
        <View className="bg-white px-6 py-5 mb-2 shadow-sm border-y border-gray-100">
          <Text className="text-sm font-bold text-[#111827] mb-4">Item Summary</Text>
          <View className="flex-row">
            <Image 
              source={{ uri: order.imageUrl }} 
              className="w-20 h-20 rounded-xl bg-gray-100" 
              resizeMode="cover" 
            />
            <View className="flex-1 ml-4 justify-center">
              <Text className="text-lg font-bold text-[#111827] mb-1">{order.cropName}</Text>
              <Text className="text-[#6B7280] text-sm">₹{order.intUnitPrice} / kg  x  {order.intQuantity} kg</Text>
            </View>
          </View>
        </View>

        {/* ---------------- BUYER & DELIVERY INFO ---------------- */}
        <View className="bg-white px-6 py-5 mb-2 shadow-sm border-y border-gray-100">
          <Text className="text-sm font-bold text-[#111827] mb-4">Delivery Information</Text>
          
          <View className="flex-row items-start mb-4">
            <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3">
              <MaterialCommunityIcons name="account-outline" size={20} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-[#9CA3AF] text-xs font-semibold">Buyer Name</Text>
              <Text className="text-[#111827] font-semibold text-base">{order.buyerName}</Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3">
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-[#9CA3AF] text-xs font-semibold">Delivery Address</Text>
              <Text className="text-[#111827] font-semibold text-base leading-snug">{order.nvcharDeliveryAddress}</Text>
            </View>
          </View>
        </View>

        {/* ---------------- PAYMENT BREAKDOWN ---------------- */}
        <View className="bg-white px-6 py-5 shadow-sm border-y border-gray-100">
          <Text className="text-sm font-bold text-[#111827] mb-4">Payment Summary</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-[#6B7280]">Subtotal ({order.intQuantity} kg)</Text>
            <Text className="text-[#111827] font-semibold">₹{order.intTotalPrice}</Text>
          </View>
          <View className="flex-row justify-between mb-4">
            <Text className="text-[#6B7280]">Platform Fee (0%)</Text>
            <Text className="text-[#111827] font-semibold">₹0</Text>
          </View>

          <View className="h-[1px] bg-gray-200 mb-4" />

          <View className="flex-row justify-between items-center">
            <Text className="text-[#111827] font-bold text-base">Total Earnings</Text>
            <Text className="text-[#10B981] font-extrabold text-2xl">₹{order.intTotalPrice}</Text>
          </View>
        </View>

      </ScrollView>

      {/* ---------------- FLOATING ACTION BOTTOM BAR ---------------- */}
      <View className="absolute bottom-0 w-full bg-white px-6 py-4 border-t border-gray-200 pb-8">
        {order.nvcharStatus === 'Pending' ? (
          <View className="flex-row space-x-3">
            <TouchableOpacity 
              onPress={handleReject}
              className="flex-1 bg-white border-2 border-gray-200 py-3 rounded-xl items-center"
            >
              <Text className="text-[#4B5563] font-bold text-lg">Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleAccept}
              className="flex-1 bg-[#10B981] py-3 rounded-xl items-center shadow-sm"
            >
              <Text className="text-white font-bold text-lg">Accept Order</Text>
            </TouchableOpacity>
          </View>
        ) : order.nvcharStatus === 'Accepted' ? (
          <TouchableOpacity className="w-full bg-[#10B981] py-3 rounded-xl items-center shadow-sm flex-row justify-center">
            <MaterialCommunityIcons name="truck-fast-outline" size={24} color="white" />
            <Text className="text-white font-bold text-lg ml-2">Mark as Dispatched</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-full bg-gray-100 py-3 rounded-xl items-center flex-row justify-center">
             <MaterialCommunityIcons name="check-circle" size={24} color="#6B7280" />
            <Text className="text-[#6B7280] font-bold text-lg ml-2">Order Completed</Text>
          </View>
        )}
      </View>

    </SafeAreaView>
  );
}