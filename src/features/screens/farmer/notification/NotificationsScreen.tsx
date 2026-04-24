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
        activeOpacity={0.8}
        onPress={() => handleNotificationPress(item)}
        style={{
          flexDirection: "row",
          padding: 16,
          marginBottom: 10,
          marginHorizontal: 16,
          backgroundColor: "#fff",
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: isUnread ? `${config.color}33` : "#F3F4F6",
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isUnread ? 0.07 : 0.04,
          shadowRadius: 8,
          elevation: isUnread ? 3 : 1,
        }}
      >
        {/* Left: Icon */}
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: `${config.color}18`, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
          <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
        </View>

        {/* Right: Content */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: isUnread ? "800" : "700", color: isUnread ? "#111827" : "#374151", marginRight: 8 }}>
              {item.nvcharTitle}
            </Text>
            <Text style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{item.dtDateOfCreation}</Text>
          </View>
          <Text style={{ fontSize: 13, lineHeight: 18, color: isUnread ? "#4B5563" : "#9CA3AF" }}>
            {item.nvcharMessage}
          </Text>
        </View>

        {/* Unread dot */}
        {isUnread && (
          <View style={{ position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: config.color }} />
        )}
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => n.intIsRead === 0).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>

      {/* ── Header ── */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 42, height: 42, backgroundColor: "#fff", borderRadius: 21, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#111827" }}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={{ fontSize: 11, color: "#16A34A", fontWeight: "700" }}>{unreadCount} unread</Text>
          )}
        </View>
        <TouchableOpacity style={{ width: 42, height: 42, backgroundColor: "#fff", borderRadius: 21, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
          <MaterialCommunityIcons name="check-all" size={20} color="#16A34A" />
        </TouchableOpacity>
      </View>

      {/* ── Pill Tabs ── */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 14, gap: 8 }}>
        {tabs.map(tab => {
          const active = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
                backgroundColor: active ? "#16A34A" : "#fff",
                borderWidth: active ? 0 : 1, borderColor: "#E5E7EB",
                elevation: active ? 3 : 0,
                shadowColor: active ? "#16A34A" : "transparent",
                shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 12, color: active ? "#fff" : "#6B7280" }}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Notification List ── */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotificationCard}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 80, paddingHorizontal: 32 }}>
              <View style={{ width: 80, height: 80, backgroundColor: "#F3F4F6", borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <MaterialCommunityIcons name="bell-sleep-outline" size={40} color="#D1D5DB" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#374151", marginBottom: 8 }}>No notifications yet</Text>
              <Text style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, lineHeight: 20 }}>
                When you get new orders or system alerts, they will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}