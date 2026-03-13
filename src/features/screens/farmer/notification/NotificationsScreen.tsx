// src/features/farmer/screens/NotificationsScreen.tsx
import React, { useState, useEffect } from "react";
import { 
  View, Text, TouchableOpacity, SafeAreaView, 
  FlatList, ActivityIndicator 
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { notificationService } from "../api/notificationService";
import { notificationService } from "@/services/farmer/notificationService";

// --- DUMMY DATA MATCHING YOUR API ---
const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    intFarmerId: 1,
    nvcharTitle: "New Order Received",
    nvcharMessage: "FreshMart requested 500kg of Organic Bananas.",
    intIsRead: 0,
    intPriority: 1,
    nvcharRelatedEntity: "Order", // Triggers the Green Bag icon
    dtDateOfCreation: "10:30 AM"
  },
  {
    id: 2,
    intFarmerId: 1,
    nvcharTitle: "Payment Confirmed",
    nvcharMessage: "Your payment for ORD-001 has been processed successfully.",
    intIsRead: 1,
    intPriority: 2,
    nvcharRelatedEntity: "System", // Triggers the Blue Check icon
    dtDateOfCreation: "Yesterday"
  },
  {
    id: 3,
    intFarmerId: 1,
    nvcharTitle: "Market Price Alert",
    nvcharMessage: "Tomato prices in Pune have gone up by 5% today.",
    intIsRead: 0,
    intPriority: 2,
    nvcharRelatedEntity: "Market", // Triggers the Yellow Chart icon
    dtDateOfCreation: "Yesterday"
  },
  {
    id: 4,
    intFarmerId: 1,
    nvcharTitle: "Heavy Rain Warning",
    nvcharMessage: "Expected heavy rainfall in your location tomorrow. Protect open crops.",
    intIsRead: 0,
    intPriority: 1,
    nvcharRelatedEntity: "Weather", // Triggers the Red Alert icon
    dtDateOfCreation: "Oct 24"
  }
];

export default function NotificationsScreen() {
  const navigation = useNavigation();
  
  const [notifications, setNotifications] = useState<any[]>(DUMMY_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(false);
  
  // Tabs: All, Orders, System Alerts
  const [activeTab, setActiveTab] = useState("All");
  const tabs = ["All", "Orders", "System Alerts"];

  // In the future, this is how you'll fetch real data:
  /*
  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      const userStr = await AsyncStorage.getItem('@farmer_user');
      const farmerId = JSON.parse(userStr).id;
      const res = await notificationService.getNotificationsByFarmerId(farmerId);
      if(res.status === 'success') setNotifications(res.data);
      setIsLoading(false);
    }
    fetchAlerts();
  }, []);
  */

  // Filter logic based on tabs
  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === "Orders") return notif.nvcharRelatedEntity === "Order";
    if (activeTab === "System Alerts") return notif.nvcharRelatedEntity !== "Order";
    return true; // "All" tab
  });

  // --- UI HELPER: Get Icon and Color based on Entity Type ---
  const getIconConfig = (entityType: string) => {
    switch (entityType) {
      case 'Order':
        return { icon: 'shopping', bgColor: 'bg-green-100', color: '#10B981' };
      case 'System':
        return { icon: 'check-circle', bgColor: 'bg-blue-100', color: '#3B82F6' };
      case 'Market':
        return { icon: 'trending-up', bgColor: 'bg-yellow-100', color: '#F59E0B' };
      case 'Weather':
        return { icon: 'alert', bgColor: 'bg-red-100', color: '#EF4444' };
      default:
        return { icon: 'information', bgColor: 'bg-gray-100', color: '#6B7280' };
    }
  };

  const handleNotificationPress = (item: any) => {
    // Here you would call notificationService.updateNotification to mark intIsRead: 1
    console.log("Pressed notification:", item.id);
  };

  const renderNotificationCard = ({ item }: { item: any }) => {
    const config = getIconConfig(item.nvcharRelatedEntity);
    const isUnread = item.intIsRead === 0;

    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
        className={`flex-row p-4 mb-3 mx-6 bg-white rounded-2xl border ${isUnread ? 'border-green-200 shadow-sm' : 'border-gray-100'}`}
      >
        {/* Dynamic Icon Box */}
        <View className={`w-12 h-12 ${config.bgColor} rounded-xl items-center justify-center mr-4`}>
          <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
        </View>

        {/* Text Content */}
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-start mb-1">
            <Text className={`flex-1 text-base mr-2 ${isUnread ? 'font-extrabold text-[#111827]' : 'font-bold text-[#374151]'}`}>
              {item.nvcharTitle}
            </Text>
            <Text className="text-[10px] text-[#9CA3AF] mt-1">{item.dtDateOfCreation}</Text>
          </View>
          <Text className={`text-sm leading-5 ${isUnread ? 'text-[#4B5563]' : 'text-[#9CA3AF]'}`}>
            {item.nvcharMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      
      {/* ---------------- HEADER ---------------- */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-[#111827]">Notifications</Text>
        <TouchableOpacity className="p-2 -mr-2">
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* ---------------- CUSTOM TABS ---------------- */}
      <View className="flex-row px-6 border-b border-gray-100 mb-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="mr-6 py-3 relative"
            >
              <Text className={`font-bold ${isActive ? 'text-[#10B981]' : 'text-[#9CA3AF]'}`}>
                {tab}
              </Text>
              {isActive && (
                <View className="absolute bottom-0 left-0 right-0 h-1 bg-[#10B981] rounded-t-full" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ---------------- NOTIFICATION LIST ---------------- */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotificationCard}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 px-6">
              <MaterialCommunityIcons name="bell-sleep-outline" size={64} color="#D1D5DB" />
              <Text className="text-xl font-bold text-[#374151] mt-4">No notifications yet</Text>
              <Text className="text-center text-[#9CA3AF] mt-2">
                When you get new orders or system alerts, they will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}