import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useIsFocused, useNavigation } from "@react-navigation/native";
import { orderService } from "@/services/buyer/orderService";
import { parseStoredUser } from "@/src/utils/authSession";

export default function BuyerOrdersScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState("Pending");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFocused = useIsFocused();

  const tabs = ["Pending", "Accepted", "Completed"];

  useEffect(() => {
    if (isFocused) {
      fetchRealOrders();
    }
  }, [isFocused]);

  const fetchRealOrders = async () => {
    setIsLoading(true);

    try {
      const user = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));

      if (!user?.id) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "BuyerLogin" }],
          })
        );
        setOrders([]);
        return;
      }

      const localOrders = await orderService.getLocalOrders();
      const response = await orderService.getOrdersByBuyerId(user.id);

      let remoteOrders: any[] = [];
      if (response && response.status === "success") {
        remoteOrders = response.data || [];
      } else if (Array.isArray(response?.data)) {
        remoteOrders = response.data;
      } else if (Array.isArray(response)) {
        remoteOrders = response;
      }

      const mergedOrders = [...localOrders, ...remoteOrders].filter(
        (order, index, arr) =>
          index ===
          arr.findIndex(
            (item) =>
              String(item.id ?? item.nvcharOrderNumber) ===
              String(order.id ?? order.nvcharOrderNumber)
          )
      );

      setOrders(mergedOrders);
    } catch (error) {
      console.log("Error fetching orders:", error);
      const localOrders = await orderService.getLocalOrders();
      setOrders(localOrders);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(
    (order) => String(order.nvcharStatus || "").toLowerCase() === activeTab.toLowerCase()
  );

  const renderOrderCard = ({ item }: { item: any }) => (
    <View className="bg-white rounded-3xl p-4 mb-4 shadow-sm border border-gray-100 mx-6">
      <View className="flex-row justify-between items-center mb-3 border-b border-gray-100 pb-3">
        <Text className="text-[#6B7280] font-semibold text-xs">Order ID: {item.nvcharOrderNumber}</Text>
        <View
          className={`px-2 py-1 rounded-md ${
            item.nvcharStatus === "Pending"
              ? "bg-[#FEF3C7]"
              : item.nvcharStatus === "Accepted"
                ? "bg-[#D1FAE5]"
                : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-[10px] font-bold uppercase ${
              item.nvcharStatus === "Pending"
                ? "text-[#D97706]"
                : item.nvcharStatus === "Accepted"
                  ? "text-[#059669]"
                  : "text-gray-600"
            }`}
          >
            {item.nvcharStatus}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center">
        <View className="w-16 h-16 rounded-xl bg-green-50 items-center justify-center border border-green-100">
          <MaterialCommunityIcons name="leaf" size={24} color="#10B981" />
        </View>

        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-bold text-[#111827] mb-1">
            {item.cropName || `Crop ID: ${item.intCropId}`}
          </Text>
          <Text className="text-[#6B7280] text-sm">Qty: {item.intQuantity} kg</Text>
        </View>

        <View className="items-end">
          <Text className="text-[#3B82F6] font-extrabold text-lg">Rs. {item.intTotalPrice}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2 bg-white">
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
        <Text className="text-2xl font-extrabold text-[#111827]">My Orders</Text>
        <View className="w-10" />
      </View>

      <View className="flex-row bg-white border-b border-gray-200 mb-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 items-center py-4 border-b-2 ${isActive ? "border-[#3B82F6]" : "border-transparent"}`}
            >
              <Text className={`font-bold ${isActive ? "text-[#3B82F6]" : "text-[#6B7280]"}`}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View className="flex-1 items-center justify-center mt-10">
          <MaterialCommunityIcons name="receipt" size={64} color="#D1D5DB" />
          <Text className="text-[#6B7280] font-bold mt-4">No {activeTab} orders found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, index) => String(item.id ?? item.nvcharOrderNumber ?? index)}
          renderItem={renderOrderCard}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
