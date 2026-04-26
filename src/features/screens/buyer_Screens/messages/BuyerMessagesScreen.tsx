import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseStoredUser } from "@/src/utils/authSession";
import { directMessageService, BUYER_ID_OFFSET } from "@/services/chat/directMessageService";
import { buyerAuthService } from "@/services/buyer/buyerAuthService";

const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?name=Farmer&background=E0ECFF&color=1D4ED8&size=128";

const formatConversationTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = now.toDateString() === date.toDateString();
  return sameDay
    ? date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const extractMessageList = (response: any) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const extractRecord = (response: any) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data[0] ?? null;
  if (Array.isArray(data?.data)) return data.data[0] ?? null;
  if (data?.data && typeof data.data === "object") return data.data;
  if (data && typeof data === "object") return data;
  return null;
};

export default function BuyerMessagesScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [buyerId, setBuyerId] = useState<number | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem("@buyer_user");
      const user = parseStoredUser(raw);
      const buyerId = user?.id;
      setBuyerId(buyerId ?? null);
      if (!buyerId) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      // Buyer's effective ID in the message store has BUYER_ID_OFFSET applied.
      const myOffsetId = buyerId + BUYER_ID_OFFSET;
      const res = await directMessageService.getMessagesByUser(buyerId, "buyer");
      const list = extractMessageList(res);

      // Only include messages where this buyer's offset ID is sender or receiver.
      // Counterparty is always a farmer (raw ID < BUYER_ID_OFFSET).
      const grouped: Record<number, any> = {};
      list.forEach((msg: any) => {
        const senderRaw = Number(msg.intSenderId);
        const receiverRaw = Number(msg.intReceiverId);
        if (senderRaw !== myOffsetId && receiverRaw !== myOffsetId) return;
        const farmerId = senderRaw === myOffsetId ? receiverRaw : senderRaw;
        if (farmerId <= 0 || farmerId >= BUYER_ID_OFFSET) return;
        const ts = msg.dtMessageDate ?? msg.dtDateOfCreation ?? "";
        if (!grouped[farmerId] || new Date(ts).getTime() > new Date(grouped[farmerId].timestamp).getTime()) {
          grouped[farmerId] = {
            farmerId,
            lastMessage: msg.nvcharMessage,
            lastSenderId: msg.intSenderId,
            timestamp: ts,
          };
        }
      });

      const farmerIds = Object.keys(grouped).map((k) => Number(k)).filter((id) => id > 0);
      const farmers = await Promise.all(
        farmerIds.map((id) => buyerAuthService.getFarmerById(id).catch(() => null))
      );

      const farmerMap: Record<number, any> = {};
      farmers.forEach((res, idx) => {
        const record = extractRecord(res);
        if (record) farmerMap[farmerIds[idx]] = record;
      });

      const convoList = Object.values(grouped)
        .map((item: any) => {
          const farmer = farmerMap[item.farmerId];
          const avatar =
            farmer?.nvcharProfilePhotoUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              farmer?.nvcharFullName || `Farmer ${item.farmerId}`
            )}&background=E0ECFF&color=1D4ED8&size=128`;
          return {
            ...item,
            buyerId,
            farmerName: farmer?.nvcharFullName || `Farmer #${item.farmerId}`,
            avatarUrl: buyerAuthService.resolveProfileImageUrl(avatar) || FALLBACK_AVATAR,
          };
        })
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setConversations(convoList);
    } catch (e) {
      console.log("Buyer load conversations error", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    loadConversations();
    const timer = setInterval(loadConversations, 6000);
    return () => clearInterval(timer);
  }, [isFocused, loadConversations]);

  const filteredChats = useMemo(() => {
    if (!searchQuery) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => String(c.farmerName).toLowerCase().includes(q));
  }, [searchQuery, conversations]);

  const openChatDetail = (chat: any) => {
    navigation.navigate("BuyerChat", {
      counterpartyId: chat.farmerId,
      counterpartyName: chat.farmerName,
      counterpartyAvatar: chat.avatarUrl,
      currentUserType: "buyer",
      counterpartyType: "farmer",
    });
  };

  const renderChatRow = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      className="flex-row items-center px-6 py-4 bg-white border-b border-gray-50"
      onPress={() => openChatDetail(item)}
    >
      <View className="relative">
        <Image source={{ uri: item.avatarUrl || FALLBACK_AVATAR }} className="w-14 h-14 rounded-full bg-gray-100" />
      </View>

      <View className="flex-1 ml-4 justify-center">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-lg font-bold text-[#111827] flex-1" numberOfLines={1}>
            {item.farmerName}
          </Text>
          <Text className="text-xs text-[#9CA3AF]">{formatConversationTime(item.timestamp)}</Text>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-1 flex-row items-center pr-4">
            <Text className="text-[#6B7280] text-sm" numberOfLines={1}>
              {Number(item.lastSenderId) === (buyerId ? buyerId + BUYER_ID_OFFSET : 0) ? "You: " : ""}
              {item.lastMessage || "Start a conversation"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2 bg-white">
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold text-[#111827]">Messages</Text>
        </View>
      </View>

      <View className="px-6 py-3 bg-white">
        <View className="flex-row items-center bg-[#F9FAFB] border border-gray-100 rounded-2xl px-4 h-12">
          <MaterialCommunityIcons name="magnify" size={22} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-[#111827]"
            placeholder="Search farmers..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text className="text-[#9CA3AF] text-sm mt-3 font-semibold">Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => String(item.farmerId)}
          renderItem={renderChatRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center mt-20 px-8">
              <View className="w-16 h-16 rounded-full bg-[#E0ECFF] items-center justify-center mb-4">
                <MaterialCommunityIcons name="chat-outline" size={28} color="#1D4ED8" />
              </View>
              <Text className="text-[#111827] font-extrabold text-base mb-2">No messages yet</Text>
              <Text className="text-[#9CA3AF] text-center text-sm">
                Farmer replies will appear here once you start a conversation.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
