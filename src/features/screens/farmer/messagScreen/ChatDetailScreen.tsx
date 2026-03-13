// src/features/farmer/screens/ChatDetailScreen.tsx
import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, SafeAreaView, 
  FlatList, Image, KeyboardAvoidingView, Platform 
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

// --- DUMMY DATA MATCHING YOUR SCREENSHOT ---
const DUMMY_MESSAGES = [
  {
    id: "1",
    text: "Hello! I saw your listing for organic Roma tomatoes. Are they still available for pickup this afternoon?",
    time: "09:41 AM",
    isSender: false, // From Buyer
    avatar: "https://i.pravatar.cc/150?img=11"
  },
  {
    id: "2",
    text: "Hi Alex! Yes, we have about 20lbs left. How many were you looking for?",
    time: "09:43 AM",
    isSender: true, // From Farmer (You)
    avatar: "https://ui-avatars.com/api/?name=Farmer&background=10B981&color=fff"
  },
  {
    id: "3",
    text: "I'll take 5lbs! Can I come by at 4 PM? Also, could you send me the exact location of the farm gate?",
    time: "09:45 AM",
    isSender: false,
    avatar: "https://i.pravatar.cc/150?img=11"
  },
  {
    id: "4",
    text: "Perfect, I'll set 5lbs aside for you. Here is the location!",
    isLocation: true, // Special type for the map card
    locationName: "Green Valley Farm Gate",
    locationImage: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80", // Placeholder map image
    time: "09:48 AM",
    isSender: true,
    avatar: "https://ui-avatars.com/api/?name=Farmer&background=10B981&color=fff"
  }
];

export default function ChatDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get chat details passed from the Messages list (fallback to dummy data)
  const chatParams = (route.params as any) || { 
    userName: "Alex Johnson", 
    isOnline: true,
    avatarUrl: "https://i.pravatar.cc/150?img=11"
  };

  const [messageText, setMessageText] = useState("");

  const handleSend = () => {
    if (!messageText.trim()) return;
    console.log("Sending message:", messageText);
    setMessageText(""); // Clear input after sending
  };

  // --- RENDER MESSAGE BUBBLES ---
  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.isSender;

    return (
      <View className={`flex-row mb-6 px-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
        
        {/* Receiver Avatar (Left) */}
        {!isMe && (
          <Image source={{ uri: item.avatar }} className="w-8 h-8 rounded-full mr-2 self-end mb-5" />
        )}

        {/* Message Bubble Container */}
        <View className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
          
          <View className={`p-4 rounded-2xl ${
            isMe 
              ? 'bg-[#00E600] rounded-br-sm' // Farmer (Green Bubble)
              : 'bg-white border border-gray-100 shadow-sm rounded-bl-sm' // Buyer (White Bubble)
          }`}>
            <Text className={`text-base leading-5 ${isMe ? 'text-white' : 'text-[#374151]'}`}>
              {item.text}
            </Text>
            
            {/* Special Location Card (If applicable) */}
            {item.isLocation && (
              <View className="mt-3 bg-white rounded-xl overflow-hidden w-60">
                <Image source={{ uri: item.locationImage }} className="w-full h-28" resizeMode="cover" />
                <View className="p-3 flex-row justify-between items-center bg-white">
                  <Text className="font-bold text-[#111827]">{item.locationName}</Text>
                  <MaterialCommunityIcons name="navigation-variant" size={20} color="#00E600" />
                </View>
              </View>
            )}
          </View>

          {/* Timestamp */}
          <Text className="text-[10px] text-[#9CA3AF] mt-1 px-1">{item.time}</Text>
        </View>

        {/* Sender Avatar (Right) */}
        {isMe && (
          <Image source={{ uri: item.avatar }} className="w-8 h-8 rounded-full ml-2 self-end mb-5" />
        )}

      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
      >
        
        {/* ---------------- HEADER ---------------- */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm z-10">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
              <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>
            
            <Image source={{ uri: chatParams.avatarUrl }} className="w-10 h-10 rounded-full ml-1" />
            
            <View className="ml-3">
              <Text className="text-lg font-bold text-[#111827]">{chatParams.userName}</Text>
              <Text className={`text-xs font-semibold ${chatParams.isOnline ? 'text-[#00E600]' : 'text-[#9CA3AF]'}`}>
                {chatParams.isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity className="p-2">
              <MaterialCommunityIcons name="phone" size={22} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2 ml-1">
              <MaterialCommunityIcons name="dots-vertical" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- CHAT MESSAGES ---------------- */}
        <FlatList
          data={DUMMY_MESSAGES}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />

        {/* ---------------- INPUT BAR ---------------- */}
        <View className="px-4 py-3 bg-white border-t border-gray-100 flex-row items-center mb-2">
          
          <TouchableOpacity className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full mr-2">
            <MaterialCommunityIcons name="plus" size={24} color="#4B5563" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center bg-[#F9FAFB] border border-gray-200 rounded-full px-4 min-h-[48px]">
            <TextInput
              className="flex-1 text-base text-[#111827] max-h-24"
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={messageText}
              onChangeText={setMessageText}
            />
            <TouchableOpacity className="p-1">
              <MaterialCommunityIcons name="emoticon-happy-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={handleSend}
            className="w-12 h-12 items-center justify-center bg-[#00E600] rounded-full ml-2 shadow-sm"
          >
            <MaterialCommunityIcons name="send" size={20} color="white" className="ml-1" />
          </TouchableOpacity>
          
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}