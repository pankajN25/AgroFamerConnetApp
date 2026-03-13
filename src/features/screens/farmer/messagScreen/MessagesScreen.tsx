// src/features/farmer/screens/MessagesScreen.tsx
import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, SafeAreaView, 
  FlatList, Image, ScrollView
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// --- DUMMY DATA (Structured to match tblChatRoom + UI needs) ---
const DUMMY_CHAT_ROOMS = [
  {
    id: 1,
    nvcharRoomName: "Samuel Green",
    nvcharRoomType: "Direct",
    intParticipantCount: 2,
    lastMessage: "Is the organic fertilizer still availa...",
    time: "12:45 PM",
    unreadCount: 2,
    avatarUrl: "https://i.pravatar.cc/150?img=11",
    isOnline: true
  },
  {
    id: 2,
    nvcharRoomName: "Elena Rodriguez",
    nvcharRoomType: "Direct",
    intParticipantCount: 2,
    lastMessage: "The shipment for the coffee beans ha...",
    time: "Yesterday",
    unreadCount: 0,
    avatarUrl: "https://i.pravatar.cc/150?img=5",
    isOnline: false
  },
  {
    id: 3,
    nvcharRoomName: "Farmer Discussion Group", // From your API payload
    nvcharRoomType: "Group",
    intParticipantCount: 5,
    lastMessage: "Marcus: Thanks for the update on the soil p...",
    time: "Oct 24",
    unreadCount: 0,
    avatarUrl: "https://ui-avatars.com/api/?name=Farmer+Group&background=10B981&color=fff",
    isOnline: false,
    isReadIndicator: true // e.g., double blue ticks
  },
  {
    id: 4,
    nvcharRoomName: "Sarah Jenkins",
    nvcharRoomType: "Direct",
    intParticipantCount: 2,
    lastMessage: "Sent a photo",
    time: "Oct 22",
    unreadCount: 0,
    avatarUrl: "https://i.pravatar.cc/150?img=9",
    isOnline: false
  }
];

export default function MessagesScreen() {
  const navigation = useNavigation<any>();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All Chats");
  const tabs = ["All Chats", "Unread", "Buyers", "Sellers"];

  // Filter logic (Dummy implementation for now)
  const filteredChats = DUMMY_CHAT_ROOMS.filter(chat => {
    if (activeTab === "Unread" && chat.unreadCount === 0) return false;
    if (searchQuery && !chat.nvcharRoomName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openChatDetail = (chat: any) => {
    navigation.navigate("ChatDetail", {
      userName: chat.nvcharRoomName,
      isOnline: chat.isOnline,
      avatarUrl: chat.avatarUrl,
      roomId: chat.id,
      roomType: chat.nvcharRoomType,
    });
  };

  const renderChatRow = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      className="flex-row items-center px-6 py-4 bg-white border-b border-gray-50"
      onPress={() => openChatDetail(item)}
    >
      {/* Avatar Section */}
      <View className="relative">
        <Image 
          source={{ uri: item.avatarUrl }} 
          className="w-14 h-14 rounded-full bg-gray-100" 
        />
        {item.isOnline && (
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10B981] rounded-full border-2 border-white" />
        )}
      </View>

      {/* Message Info */}
      <View className="flex-1 ml-4 justify-center">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-lg font-bold text-[#111827] flex-1" numberOfLines={1}>
            {item.nvcharRoomName}
          </Text>
          <Text className={`text-xs ${item.unreadCount > 0 ? 'text-[#10B981] font-bold' : 'text-[#9CA3AF]'}`}>
            {item.time}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-1 flex-row items-center pr-4">
            {item.isReadIndicator && (
               <MaterialCommunityIcons name="check-all" size={16} color="#9CA3AF" className="mr-1" />
            )}
            <Text className="text-[#6B7280] text-sm" numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>
          
          {item.unreadCount > 0 && (
            <View className="bg-[#10B981] w-5 h-5 rounded-full items-center justify-center">
              <Text className="text-white text-[10px] font-bold">{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      
      {/* ---------------- HEADER ---------------- */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 mr-2">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-[#111827]">Messages</Text>
        </View>
        <TouchableOpacity className="p-2 -mr-2">
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* ---------------- SEARCH BAR ---------------- */}
      <View className="px-6 py-3 bg-white">
        <View className="flex-row items-center bg-[#F9FAFB] border border-gray-100 rounded-2xl px-4 h-12">
          <MaterialCommunityIcons name="magnify" size={22} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-[#111827]"
            placeholder="Search buyers & sellers..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* ---------------- TABS ---------------- */}
      <View className="px-6 pb-2 pt-1 bg-white">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full mr-2 ${
                activeTab === tab ? 'bg-[#10B981]' : 'bg-[#F9FAFB] border border-gray-100'
              }`}
            >
              <Text className={`font-semibold text-sm ${
                activeTab === tab ? 'text-white' : 'text-[#6B7280]'
              }`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ---------------- CHAT LIST ---------------- */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChatRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* ---------------- FLOATING ACTION BUTTON ---------------- */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-16 h-16 bg-[#10B981] rounded-full items-center justify-center shadow-lg shadow-green-500/40"
      >
        <MaterialCommunityIcons name="square-edit-outline" size={28} color="white" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}
