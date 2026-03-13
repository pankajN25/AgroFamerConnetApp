// src/features/farmer/screens/OrdersScreen.tsx
import React, { useState } from "react";
import { 
  View, Text, TouchableOpacity, SafeAreaView, 
  FlatList, Image 
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// --- DUMMY DATA (Structured to match your tblOrder API) ---
const DUMMY_ORDERS = [
  {
    id: 1,
    nvcharOrderNumber: "ORD-001",
    cropName: "Green Bell Peppers", // Note: In reality, you'll fetch this from tblCrop using intCropId
    intQuantity: 500,
    buyerName: "Organic Foods Ltd.", // In reality, fetch from User table using intBuyerId
    nvcharDeliveryAddress: "Nairobi Central Market", // Using screenshot data for visual match
    nvcharStatus: "Pending",
    imageUrl: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 2,
    nvcharOrderNumber: "ORD-002",
    cropName: "Russet Potatoes",
    intQuantity: 1200,
    buyerName: "Fresh Harvest Co.",
    nvcharDeliveryAddress: "Mombasa Port Logistics",
    nvcharStatus: "Pending",
    imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 3,
    nvcharOrderNumber: "ORD-003",
    cropName: "Red Tomatoes",
    intQuantity: 200,
    buyerName: "City Grocery Store",
    nvcharDeliveryAddress: "Kisumu Urban Hub",
    nvcharStatus: "Accepted",
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80"
  }
];

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  
  // Tab State: "Pending", "Accepted", "Completed"
  const [activeTab, setActiveTab] = useState("Pending");
  const tabs = ["Pending", "Accepted", "Completed"];

  // Filter dummy orders based on the selected tab
  const filteredOrders = DUMMY_ORDERS.filter(
    (order) => order.nvcharStatus.toLowerCase() === activeTab.toLowerCase()
  );

  const openOrderDetails = (order: any) => {
    navigation.navigate("OrderDetails", { order });
  };

  // --- RENDER A SINGLE ORDER CARD ---
  const renderOrderCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={() => openOrderDetails(item)}
      className="bg-white rounded-3xl p-4 mb-4 shadow-sm border border-gray-100 mx-4"
    >
      
      {/* Top Section: Image & Details */}
      <View className="flex-row">
        {/* Crop Image */}
        <Image 
          source={{ uri: item.imageUrl }} 
          className="w-24 h-24 rounded-xl" 
          resizeMode="cover" 
        />
        
        {/* Order Info */}
        <View className="flex-1 ml-4 justify-center">
          <View className="flex-row justify-between items-start mb-1">
            <Text className="text-lg font-bold text-[#111827] flex-1 mr-2" numberOfLines={1}>
              {item.cropName}
            </Text>
            
            {/* Dynamic Status Badge */}
            <View className={`px-2 py-1 rounded-md ${
              item.nvcharStatus === 'Pending' ? 'bg-[#FEF3C7]' : 
              item.nvcharStatus === 'Accepted' ? 'bg-[#D1FAE5]' : 'bg-gray-100'
            }`}>
              <Text className={`text-[10px] font-bold uppercase ${
                item.nvcharStatus === 'Pending' ? 'text-[#D97706]' : 
                item.nvcharStatus === 'Accepted' ? 'text-[#059669]' : 'text-gray-600'
              }`}>
                {item.nvcharStatus}
              </Text>
            </View>
          </View>

          <Text className="text-[#6B7280] text-sm mb-0.5">Qty: {item.intQuantity} kg</Text>
          <Text className="text-[#6B7280] text-sm mb-1.5" numberOfLines={1}>Buyer: {item.buyerName}</Text>
          
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="map-marker-outline" size={14} color="#9CA3AF" />
            <Text className="text-[#9CA3AF] text-xs ml-1 flex-1" numberOfLines={1}>
              {item.nvcharDeliveryAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons Section */}
      {/* Show Accept/Reject ONLY if the order is Pending */}
      {item.nvcharStatus === 'Pending' && (
        <View className="flex-row space-x-3 mt-4">
          <TouchableOpacity className="flex-1 bg-[#10B981] py-3 rounded-xl items-center shadow-sm">
            <Text className="text-white font-bold text-base">Accept Order</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-gray-100 py-3 rounded-xl items-center">
            <Text className="text-[#111827] font-bold text-base">Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* View Details Button (Always visible) */}
      <TouchableOpacity
        onPress={() => openOrderDetails(item)}
        className="w-full border border-[#10B981] py-3 rounded-xl items-center mt-3"
      >
        <Text className="text-[#10B981] font-bold text-base">View Details</Text>
      </TouchableOpacity>

    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      
      {/* ---------------- HEADER ---------------- */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-4 bg-white">
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
            <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View className="w-10 h-10" />
        )}
        <Text className="text-2xl font-bold text-[#111827]">Orders</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications")}
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
        >
          <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
          <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-white" />
        </TouchableOpacity>
      </View>

      {/* ---------------- CUSTOM TAB BAR ---------------- */}
      <View className="flex-row bg-white border-b border-gray-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 items-center py-4 border-b-2 ${
                isActive ? 'border-[#10B981]' : 'border-transparent'
              }`}
            >
              <Text className={`font-bold ${
                isActive ? 'text-[#10B981]' : 'text-[#6B7280]'
              }`}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ---------------- ORDERS LIST ---------------- */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderCard}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center mt-20 px-6">
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#D1D5DB" />
            <Text className="text-xl font-bold text-[#374151] mt-4">No {activeTab} Orders</Text>
            <Text className="text-center text-[#9CA3AF] mt-2">
              You don't have any orders in this category right now.
            </Text>
          </View>
        }
      />

    </SafeAreaView>
  );
}
