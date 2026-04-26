import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseStoredUser } from "@/src/utils/authSession";
import { directMessageService, BUYER_ID_OFFSET } from "@/services/chat/directMessageService";

const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=E2E8F0&color=475569&size=128";

const formatTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};

const extractMessageList = (response: any) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export default function ChatThreadScreen(props: any) {
  const navigationFallback = useNavigation<any>();
  const routeFallback = useRoute<any>();
  const navigation = props?.navigation ?? navigationFallback;
  const route = props?.route ?? routeFallback;
  const isFocused = useIsFocused();
  const listRef = useRef<FlatList<any>>(null);
  const insets = useSafeAreaInsets();

  const counterpartyId = Number(route.params?.counterpartyId);
  const counterpartyName = route.params?.counterpartyName || "Chat";
  const counterpartyAvatar = route.params?.counterpartyAvatar || FALLBACK_AVATAR;
  const initialUserType = route.params?.currentUserType || "buyer";
  // counterpartyType tells us whether the OTHER person is a farmer or buyer.
  // If not provided, infer from currentUserType (farmer talks to buyer, buyer talks to farmer).
  const counterpartyType: "farmer" | "buyer" =
    route.params?.counterpartyType || (initialUserType === "farmer" ? "buyer" : "farmer");
  const tabBarOffset = Number(route.params?.tabBarHeight ?? 0);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [resolvedUserType, setResolvedUserType] = useState(initialUserType);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const storageKey = useMemo(
    () => (resolvedUserType === "farmer" ? "@farmer_user" : "@buyer_user"),
    [resolvedUserType]
  );

  useEffect(() => {
    const loadUser = async () => {
      const raw = await AsyncStorage.getItem(storageKey);
      let user = parseStoredUser(raw);
      if (!user && resolvedUserType !== "farmer") {
        const farmerRaw = await AsyncStorage.getItem("@farmer_user");
        const farmerUser = parseStoredUser(farmerRaw);
        if (farmerUser) {
          user = farmerUser;
          setResolvedUserType("farmer");
        }
      }
      setCurrentUserId(user?.id ?? null);
    };
    loadUser();
  }, [storageKey, resolvedUserType]);

  const fetchMessages = useCallback(async () => {
    if (!currentUserId || !counterpartyId) return;
    try {
      const res = await directMessageService.getMessagesBetweenUsers(
        currentUserId,
        counterpartyId,
        resolvedUserType as "farmer" | "buyer",
        counterpartyType
      );
      const list = extractMessageList(res);
      const normalized = list
        .map((msg: any) => ({
          ...msg,
          id: msg.id ?? `${msg.intSenderId}-${msg.dtMessageDate ?? msg.dtDateOfCreation}`,
        }))
        .sort((a: any, b: any) => {
          const ta = new Date(a.dtMessageDate ?? a.dtDateOfCreation ?? 0).getTime();
          const tb = new Date(b.dtMessageDate ?? b.dtDateOfCreation ?? 0).getTime();
          return ta - tb;
        });
      setMessages(normalized);
    } catch (e) {
      console.log("Fetch messages error", e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, counterpartyId]);

  useEffect(() => {
    if (!isFocused) return;
    if (!currentUserId || !counterpartyId) return;
    fetchMessages();
    const timer = setInterval(fetchMessages, 4000);
    return () => clearInterval(timer);
  }, [isFocused, currentUserId, counterpartyId, fetchMessages]);

  useEffect(() => {
    if (!messages.length) return;
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timeout);
  }, [messages.length]);

  // Effective IDs with BUYER_ID_OFFSET applied for buyers.
  const myEffectiveId =
    resolvedUserType === "buyer" && currentUserId != null
      ? currentUserId + BUYER_ID_OFFSET
      : currentUserId;

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !currentUserId || !counterpartyId || isSending) return;
    setIsSending(true);
    setInputText("");

    const optimistic = {
      id: `local-${Date.now()}`,
      intSenderId: myEffectiveId,
      intReceiverId:
        counterpartyType === "buyer"
          ? counterpartyId + BUYER_ID_OFFSET
          : counterpartyId,
      nvcharMessage: trimmed,
      dtMessageDate: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      await directMessageService.sendMessage({
        senderId: currentUserId,
        receiverId: counterpartyId,
        message: trimmed,
        senderType: resolvedUserType as "farmer" | "buyer",
        receiverType: counterpartyType,
      });
      await fetchMessages();
    } catch (e) {
      console.log("Send message error", e);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = Number(item.intSenderId) === Number(myEffectiveId);
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: isMe ? "flex-end" : "flex-start",
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
      >
        {!isMe && (
          <Image
            source={{ uri: counterpartyAvatar }}
            style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8, alignSelf: "flex-end" }}
          />
        )}
        <View style={{ maxWidth: "78%", alignItems: isMe ? "flex-end" : "flex-start" }}>
          <View
            style={{
              backgroundColor: isMe ? "#1D4ED8" : "#FFFFFF",
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 16,
              borderTopRightRadius: isMe ? 6 : 16,
              borderTopLeftRadius: isMe ? 16 : 6,
              borderWidth: isMe ? 0 : 1,
              borderColor: "#E2E8F0",
              shadowColor: "#0F172A",
              shadowOpacity: isMe ? 0.08 : 0.03,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: isMe ? 2 : 1,
            }}
          >
            <Text style={{ color: isMe ? "#FFFFFF" : "#0F172A", fontSize: 14, lineHeight: 20 }}>
              {item.nvcharMessage}
            </Text>
          </View>
          <Text style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
            {formatTime(item.dtMessageDate ?? item.dtDateOfCreation)}
          </Text>
        </View>
        {isMe && (
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              marginLeft: 8,
              backgroundColor: "#DBEAFE",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "flex-end",
            }}
          >
            <MaterialCommunityIcons name="account" size={16} color="#2563EB" />
          </View>
        )}
      </View>
    );
  };

  const headerTopPadding = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight || 0) : 0) + 6;
  const bottomInset = Math.max(tabBarOffset, insets.bottom);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F6FB" }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "#E0ECFF",
          opacity: 0.7,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 140,
          left: -90,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: "#E7F9ED",
          opacity: 0.7,
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: headerTopPadding,
            paddingBottom: 12,
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderColor: "#E2E8F0",
            shadowColor: "#0F172A",
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 3,
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6, marginRight: 6 }}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Image source={{ uri: counterpartyAvatar }} style={{ width: 38, height: 38, borderRadius: 19 }} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0F172A" }} numberOfLines={1}>
              {counterpartyName}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E", marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: "#94A3B8" }}>
                {resolvedUserType === "farmer" ? "Buyer chat" : "Farmer chat"}
              </Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text style={{ color: "#94A3B8", marginTop: 10, fontSize: 12 }}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 20 + bottomInset,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: "center", marginTop: 80, paddingHorizontal: 24 }}>
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: "#E0ECFF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <MaterialCommunityIcons name="chat-processing-outline" size={40} color="#3B82F6" />
                </View>
                <Text style={{ fontSize: 17, fontWeight: "800", color: "#0F172A", marginBottom: 6 }}>
                  Start the conversation
                </Text>
                <Text style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", lineHeight: 18 }}>
                  Ask about crop availability, delivery timing, or pricing.
                </Text>
                <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
                  {["Hi", "Is it available?", "What is the price?"].map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      onPress={() => setInputText(chip)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                      }}
                    >
                      <Text style={{ color: "#334155", fontSize: 12, fontWeight: "600" }}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
          />
        )}

        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderColor: "#E2E8F0",
            backgroundColor: "#FFFFFF",
            marginBottom: bottomInset,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F8FAFC",
              borderRadius: 24,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              style={{ flex: 1, fontSize: 14, color: "#0F172A", maxHeight: 120 }}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={isSending || !inputText.trim()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: inputText.trim() ? "#1D4ED8" : "#C7D2FE",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 8,
                shadowColor: "#1D4ED8",
                shadowOpacity: inputText.trim() ? 0.25 : 0,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: inputText.trim() ? 4 : 0,
              }}
            >
              {isSending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
