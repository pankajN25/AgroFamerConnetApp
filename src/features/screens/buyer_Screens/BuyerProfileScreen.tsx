import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { parseStoredUser } from "@/src/utils/authSession";
import { buyerAuthService } from "@/services/buyer/buyerAuthService";

// ─── Types ───────────────────────────────────────────────────────────────────
interface BuyerUser {
  id: number;
  nvcharFullName: string;
  nvcharEmail: string;
  nvcharPhoneNumber: string;
  nvcharAddress: string;
  nvcharCity?: string;
  nvcharState?: string;
  nvcharCountry?: string;
  nvcharProfilePhotoUrl?: string;
  [key: string]: any;
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditProfileModal({
  visible,
  buyer,
  onClose,
  onSave,
}: {
  visible: boolean;
  buyer: BuyerUser | null;
  onClose: () => void;
  onSave: (updated: Partial<BuyerUser>) => void;
}) {
  const [name, setName]       = useState(buyer?.nvcharFullName || "");
  const [phone, setPhone]     = useState(buyer?.nvcharPhoneNumber || "");
  const [address, setAddress] = useState(buyer?.nvcharAddress || "");

  useEffect(() => {
    if (visible) {
      setName(buyer?.nvcharFullName || "");
      setPhone(buyer?.nvcharPhoneNumber || "");
      setAddress(buyer?.nvcharAddress || "");
    }
  }, [visible, buyer]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Full name is required.");
      return;
    }
    onSave({ nvcharFullName: name.trim(), nvcharPhoneNumber: phone.trim(), nvcharAddress: address.trim() });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7FB" }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>

          {/* Header */}
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 16,
            borderBottomWidth: 1, borderColor: "#F3F4F6",
          }}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: "#9CA3AF", fontSize: 15, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: "#111827", fontSize: 17, fontWeight: "800" }}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={{ color: "#1D4ED8", fontSize: 15, fontWeight: "700" }}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

            {[
              { label: "Full Name", value: name, setter: setName, placeholder: "Your full name", icon: "account-outline", kb: "default" as const },
              { label: "Phone Number", value: phone, setter: setPhone, placeholder: "+91 00000 00000", icon: "phone-outline", kb: "phone-pad" as const },
            ].map((field) => (
              <View key={field.label} style={{ marginBottom: 16 }}>
                <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {field.label}
                </Text>
                <View style={{
                  flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
                  borderRadius: 14, paddingHorizontal: 14, height: 52,
                  borderWidth: 1, borderColor: "#E5E7EB",
                }}>
                  <MaterialCommunityIcons name={field.icon as any} size={18} color="#9CA3AF" />
                  <TextInput
                    style={{ flex: 1, marginLeft: 10, fontSize: 15, color: "#111827" }}
                    value={field.value}
                    onChangeText={field.setter}
                    placeholder={field.placeholder}
                    placeholderTextColor="#D1D5DB"
                    keyboardType={field.kb}
                  />
                </View>
              </View>
            ))}

            {/* Address multiline */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Delivery Address
              </Text>
              <View style={{
                flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fff",
                borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                borderWidth: 1, borderColor: "#E5E7EB",
              }}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#9CA3AF" style={{ marginTop: 2 }} />
                <TextInput
                  style={{ flex: 1, marginLeft: 10, fontSize: 15, color: "#111827", minHeight: 72 }}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Your delivery address"
                  placeholderTextColor="#D1D5DB"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            <Text style={{ color: "#9CA3AF", fontSize: 12, textAlign: "center", marginTop: 8 }}>
              Email and location can only be changed by contacting support.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BuyerProfileScreen() {
  const navigation   = useNavigation<any>();
  const isFocused    = useIsFocused();
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  const [buyer, setBuyer]               = useState<BuyerUser | null>(null);
  const [orderCount, setOrderCount]     = useState(0);
  const [editVisible, setEditVisible]   = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  // Load buyer + order count
  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      try {
        const user = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));
        if (!user?.id) {
          navigation.reset({ index: 0, routes: [{ name: "BuyerLogin" }] });
          return;
        }
        setBuyer(user as BuyerUser);

        const localOrdersRaw = await AsyncStorage.getItem("@buyer_local_orders");
        const localOrders = localOrdersRaw ? JSON.parse(localOrdersRaw) : [];
        setOrderCount(Array.isArray(localOrders) ? localOrders.length : 0);

        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      } catch (e) {
        console.log("Profile load error", e);
      }
    })();
  }, [isFocused]);

  // Avatar URI
  const rawProfilePhoto = buyer?.nvcharProfilePhotoUrl || "";
  const isLocalPhoto = rawProfilePhoto.startsWith("file:") || rawProfilePhoto.startsWith("content:");
  const resolvedProfilePhoto = isLocalPhoto
    ? rawProfilePhoto
    : buyerAuthService.resolveProfileImageUrl(rawProfilePhoto);
  const resolvedAvatarUrl = buyerAuthService.resolveProfileImageUrl(buyer?.avatarUrl || "");

  const avatarUri = resolvedProfilePhoto ||
    resolvedAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(buyer?.nvcharFullName || "B")}&background=1D4ED8&color=ffffff&size=200&bold=true`;

  // Change avatar
  const handleChangePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      if (!buyer?.id) {
        Alert.alert("Profile", "Buyer ID not found. Please log in again.");
        return;
      }
      const uri = result.assets[0].uri;
      try {
        const response = await buyerAuthService.uploadBuyerProfilePhoto(uri, buyer.id);
        const uploadedUrl = buyerAuthService.extractProfileImageUrl(response);
        if (!uploadedUrl) {
          Alert.alert("Upload Failed", "Could not update profile photo. Please try again.");
          return;
        }
        const updated = { ...buyer!, nvcharProfilePhotoUrl: uploadedUrl };
        await buyerAuthService.editBuyer({ id: buyer.id, nvcharProfilePhotoUrl: uploadedUrl });
        await AsyncStorage.setItem("@buyer_user", JSON.stringify(updated));
        setBuyer(updated);
      } catch (e) {
        Alert.alert("Upload Failed", "Could not upload profile photo. Please try again.");
      }
    }
  };

  // Save edited profile
  const handleSaveEdit = async (changes: Partial<BuyerUser>) => {
    const updated = { ...buyer!, ...changes };
    await AsyncStorage.setItem("@buyer_user", JSON.stringify(updated));
    setBuyer(updated);
    setEditVisible(false);
    Alert.alert("Saved", "Your profile has been updated.");
  };

  // Logout
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("@buyer_user");
          setTimeout(() => {
            const parent = navigation.getParent();
            parent ? parent.navigate("RoleSelection") : navigation.navigate("RoleSelection");
          }, 80);
        },
      },
    ]);
  };

  const location = [buyer?.nvcharCity, buyer?.nvcharState, buyer?.nvcharCountry]
    .filter(Boolean).join(", ");

  // ── Reusable row ──────────────────────────────────────────────────────────
  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: "#F9FAFB" }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <MaterialCommunityIcons name={icon as any} size={18} color="#3B82F6" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "600" }}>{label}</Text>
        <Text style={{ color: "#111827", fontSize: 14, fontWeight: "500", marginTop: 1 }} numberOfLines={2}>{value || "—"}</Text>
      </View>
    </View>
  );

  const MenuRow = ({
    icon, iconBg, iconColor, label, sub, right, onPress,
  }: {
    icon: string; iconBg: string; iconColor: string;
    label: string; sub?: string; right?: React.ReactNode; onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: "#F9FAFB" }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: iconBg, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <MaterialCommunityIcons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#111827", fontSize: 14, fontWeight: "600" }}>{label}</Text>
        {sub ? <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 1 }}>{sub}</Text> : null}
      </View>
      {right ?? <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />}
    </TouchableOpacity>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7FB" }}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >

        {/* ══ HERO CARD ════════════════════════════════════════════════════ */}
        <View style={{ backgroundColor: "#1D4ED8", paddingTop: 28, paddingBottom: 60, paddingHorizontal: 20, position: "relative", overflow: "hidden" }}>
          {/* Decorative circles */}
          <View style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.06)" }} />
          <View style={{ position: "absolute", top: 20, right: 60, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.06)" }} />
          <View style={{ position: "absolute", bottom: -20, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)" }} />

          {/* Top row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>My Profile</Text>
            <TouchableOpacity
              onPress={() => setEditVisible(true)}
              style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 8 }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar + name */}
          <View style={{ alignItems: "center" }}>
            <View style={{ position: "relative", marginBottom: 14 }}>
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: "rgba(255,255,255,0.9)" }}
              />
              <TouchableOpacity
                onPress={handleChangePhoto}
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
                  borderWidth: 2, borderColor: "#1D4ED8",
                }}
              >
                <MaterialCommunityIcons name="camera" size={15} color="#1D4ED8" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center" }} numberOfLines={1}>
              {buyer?.nvcharFullName || "Buyer"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 3, textAlign: "center" }} numberOfLines={1}>
              {buyer?.nvcharEmail || ""}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
              <MaterialCommunityIcons name="check-decagram" size={14} color="#86EFAC" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", marginLeft: 5 }}>Verified Buyer</Text>
            </View>
          </View>
        </View>

        {/* ══ STATS CARD (overlaps hero) ═══════════════════════════════════ */}
        <View style={{ marginHorizontal: 20, marginTop: -28, backgroundColor: "#fff", borderRadius: 20, flexDirection: "row", shadowColor: "#1E3A5F", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 }}>
          {[
            { value: String(orderCount), label: "Orders", icon: "receipt-text-outline", color: "#3B82F6" },
            { value: "0",  label: "Saved",  icon: "heart-outline",        color: "#EF4444" },
            { value: "4.8", label: "Rating", icon: "star-outline",         color: "#F59E0B" },
          ].map((stat, i, arr) => (
            <View
              key={stat.label}
              style={{
                flex: 1, alignItems: "center", paddingVertical: 16,
                borderRightWidth: i < arr.length - 1 ? 1 : 0, borderColor: "#F3F4F6",
              }}
            >
              <MaterialCommunityIcons name={stat.icon as any} size={20} color={stat.color} />
              <Text style={{ color: "#111827", fontSize: 20, fontWeight: "800", marginTop: 4 }}>{stat.value}</Text>
              <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "600", marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ══ QUICK ACTIONS ═════════════════════════════════════════════════ */}
        <View style={{ flexDirection: "row", marginHorizontal: 20, marginTop: 20, gap: 10 }}>
          {[
            { icon: "receipt-text-outline", label: "My Orders",   color: "#3B82F6", bg: "#EFF6FF", onPress: () => navigation.navigate("Orders") },
            { icon: "store-search-outline", label: "Browse",      color: "#10B981", bg: "#ECFDF5", onPress: () => navigation.navigate("Browse", { screen: "BuyerMarketplaceHome" }) },
            { icon: "headset",              label: "Support",     color: "#8B5CF6", bg: "#F5F3FF", onPress: () => Alert.alert("Support", "Email us at support@agroconnect.in") },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={a.onPress}
              activeOpacity={0.75}
              style={{ flex: 1, alignItems: "center", backgroundColor: a.bg, borderRadius: 16, paddingVertical: 14 }}
            >
              <MaterialCommunityIcons name={a.icon as any} size={24} color={a.color} />
              <Text style={{ color: a.color, fontSize: 11, fontWeight: "700", marginTop: 6 }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ══ CONTACT INFO ══════════════════════════════════════════════════ */}
        <View style={{ marginHorizontal: 20, marginTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>
              Contact Details
            </Text>
            <TouchableOpacity onPress={() => setEditVisible(true)}>
              <Text style={{ color: "#3B82F6", fontSize: 12, fontWeight: "700" }}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#F3F4F6" }}>
            <InfoRow icon="email-outline"         label="Email Address"    value={buyer?.nvcharEmail || "—"} />
            <InfoRow icon="phone-outline"          label="Phone Number"     value={buyer?.nvcharPhoneNumber || "—"} />
            <InfoRow icon="map-marker-outline"     label="Delivery Address" value={buyer?.nvcharAddress || "—"} />
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <MaterialCommunityIcons name="city-variant-outline" size={18} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "600" }}>Location</Text>
                <Text style={{ color: "#111827", fontSize: 14, fontWeight: "500", marginTop: 1 }}>{location || "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ══ SETTINGS ══════════════════════════════════════════════════════ */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Preferences
          </Text>
          <View style={{ backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#F3F4F6" }}>
            <MenuRow
              icon="account-edit-outline" iconBg="#EFF6FF" iconColor="#3B82F6"
              label="Edit Profile" sub="Update name, phone, address"
              onPress={() => setEditVisible(true)}
            />
            <MenuRow
              icon="bell-outline" iconBg="#FEF3C7" iconColor="#D97706"
              label="Push Notifications" sub="Order updates and offers"
              right={
                <Switch
                  value={notifEnabled}
                  onValueChange={setNotifEnabled}
                  trackColor={{ false: "#E5E7EB", true: "#BFDBFE" }}
                  thumbColor={notifEnabled ? "#1D4ED8" : "#9CA3AF"}
                />
              }
            />
            <MenuRow
              icon="chat-processing-outline" iconBg="#EFF6FF" iconColor="#1D4ED8"
              label="Messages" sub="Chat with farmers"
              onPress={() => navigation.navigate("Messages")}
            />
            <MenuRow
              icon="shield-check-outline" iconBg="#ECFDF5" iconColor="#10B981"
              label="Privacy & Security" sub="Password and data settings"
              onPress={() => Alert.alert("Privacy", "Password change coming soon.")}
            />
          </View>
        </View>

        {/* ══ SUPPORT ═══════════════════════════════════════════════════════ */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Support
          </Text>
          <View style={{ backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#F3F4F6" }}>
            <MenuRow
              icon="help-circle-outline" iconBg="#F5F3FF" iconColor="#8B5CF6"
              label="Help Center" sub="FAQs and how-to guides"
              onPress={() => Alert.alert("Help Center", "For support, email:\nsupport@agroconnect.in\n\nOr call: 1800-XXX-XXXX")}
            />
            <MenuRow
              icon="star-outline" iconBg="#FFF7ED" iconColor="#F59E0B"
              label="Rate the App" sub="Share your feedback"
              onPress={() => Alert.alert("Rate Us", "Thank you! We appreciate your feedback.")}
            />
            <MenuRow
              icon="information-outline" iconBg="#F3F4F6" iconColor="#6B7280"
              label="About AgroConnect" sub="Version 1.0.0"
              onPress={() => Alert.alert("AgroConnect", "Version 1.0.0\n\nConnecting farmers and buyers for a better agricultural ecosystem.\n\n© 2025 AgroConnect")}
            />
          </View>
        </View>

        {/* ══ ACCOUNT ID ════════════════════════════════════════════════════ */}
        <View style={{ marginHorizontal: 20, marginTop: 20, backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#F3F4F6", flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <MaterialCommunityIcons name="identifier" size={18} color="#6B7280" />
          </View>
          <View>
            <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "600" }}>Account ID</Text>
            <Text style={{ color: "#374151", fontSize: 13, fontWeight: "700", marginTop: 1 }}>#{buyer?.id || "—"}</Text>
          </View>
        </View>

        {/* ══ LOGOUT ════════════════════════════════════════════════════════ */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center",
              backgroundColor: "#FEF2F2", borderRadius: 18, paddingVertical: 15,
              borderWidth: 1, borderColor: "#FECACA",
            }}
          >
            <MaterialCommunityIcons name="logout-variant" size={20} color="#EF4444" />
            <Text style={{ color: "#EF4444", fontSize: 15, fontWeight: "700", marginLeft: 8 }}>Log Out</Text>
          </TouchableOpacity>
        </View>

      </Animated.ScrollView>

      {/* ══ EDIT MODAL ════════════════════════════════════════════════════ */}
      <EditProfileModal
        visible={editVisible}
        buyer={buyer}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveEdit}
      />
    </SafeAreaView>
  );
}
