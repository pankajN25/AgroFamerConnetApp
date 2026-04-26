import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseStoredUser } from "@/src/utils/authSession";
import { directMessageService, BUYER_ID_OFFSET } from "@/services/chat/directMessageService";
import { farmerOrderService } from "@/services/farmer/farmerOrderService";

const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?name=Buyer&background=DBEAFE&color=1D4ED8&size=128";

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

export default function MessagesScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [farmerId, setFarmerId] = useState<number | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem("@farmer_user");
      const user = parseStoredUser(raw);
      const farmerId = user?.id;
      setFarmerId(farmerId ?? null);
      if (!farmerId) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const res = await directMessageService.getMessagesByUser(farmerId, "farmer");
      const list = extractMessageList(res);

      // Buyer IDs in messages are stored with BUYER_ID_OFFSET applied.
      // Farmer IDs are stored as-is (< BUYER_ID_OFFSET).
      // Only show conversations where the counterparty is a buyer (> BUYER_ID_OFFSET).
      const grouped: Record<number, any> = {};
      list.forEach((msg: any) => {
        const senderRaw = Number(msg.intSenderId);
        const receiverRaw = Number(msg.intReceiverId);
        const counterpartyOffsetId =
          senderRaw === Number(farmerId) ? receiverRaw : senderRaw;

        // Skip if counterparty is not a buyer (no offset applied means it's a farmer)
        if (counterpartyOffsetId <= BUYER_ID_OFFSET) return;

        const realBuyerId = counterpartyOffsetId - BUYER_ID_OFFSET;
        const ts = msg.dtMessageDate ?? msg.dtDateOfCreation ?? "";

        if (!grouped[realBuyerId] || new Date(ts).getTime() > new Date(grouped[realBuyerId].timestamp).getTime()) {
          grouped[realBuyerId] = {
            buyerId: realBuyerId,
            counterpartyOffsetId,
            lastMessage: msg.nvcharMessage,
            lastSenderId: msg.intSenderId,
            timestamp: ts,
            lastMessageId: msg.id,
          };
        }
      });

      const buyerIds = Object.keys(grouped).map((k) => Number(k)).filter((id) => id > 0);
      const buyers = await Promise.all(
        buyerIds.map((id) => farmerOrderService.getBuyerById(id).catch(() => null))
      );

      const buyerMap: Record<number, any> = {};
      buyers.forEach((res, idx) => {
        const record = extractRecord(res);
        if (record) buyerMap[buyerIds[idx]] = record;
      });

      const convoList = Object.values(grouped)
        .map((item: any) => {
          const buyer = buyerMap[item.buyerId];
          const avatar = buyer?.nvcharProfilePhotoUrl?.startsWith("http")
            ? buyer.nvcharProfilePhotoUrl
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                buyer?.nvcharFullName || `Buyer ${item.buyerId}`
              )}&background=DBEAFE&color=1D4ED8&size=128`;
          return {
            ...item,
            buyerName: buyer?.nvcharFullName || `Buyer #${item.buyerId}`,
            avatarUrl: avatar || FALLBACK_AVATAR,
          };
        })
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setConversations(convoList);
    } catch (e) {
      console.log("Load conversations error", e);
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
    return conversations.filter((c) => String(c.buyerName).toLowerCase().includes(q));
  }, [searchQuery, conversations]);

  const openChatDetail = (chat: any) => {
    navigation.navigate("ChatDetail", {
      // Pass the real buyer ID; ChatThreadScreen applies the offset when needed.
      counterpartyId: chat.buyerId,
      counterpartyName: chat.buyerName,
      counterpartyAvatar: chat.avatarUrl,
      currentUserType: "farmer",
      counterpartyType: "buyer",
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
            {item.buyerName}
          </Text>
          <Text className="text-xs text-[#9CA3AF]">{formatConversationTime(item.timestamp)}</Text>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-1 flex-row items-center pr-4">
            <Text className="text-[#6B7280] text-sm" numberOfLines={1}>
              {Number(item.lastSenderId) === Number(farmerId) ? "You: " : ""}
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
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 mr-2">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-[#111827]">Messages</Text>
        </View>
      </View>

      <View className="px-6 py-3 bg-white">
        <View className="flex-row items-center bg-[#F9FAFB] border border-gray-100 rounded-2xl px-4 h-12">
          <MaterialCommunityIcons name="magnify" size={22} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-[#111827]"
            placeholder="Search buyers..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
          <Text className="text-[#9CA3AF] text-sm mt-3 font-semibold">Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => String(item.buyerId)}
          renderItem={renderChatRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center mt-20 px-8">
              <View className="w-16 h-16 rounded-full bg-[#ECFDF5] items-center justify-center mb-4">
                <MaterialCommunityIcons name="chat-outline" size={28} color="#16A34A" />
              </View>
              <Text className="text-[#111827] font-extrabold text-base mb-2">No messages yet</Text>
              <Text className="text-[#9CA3AF] text-center text-sm">
                Buyer messages will appear here once they start a conversation.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
