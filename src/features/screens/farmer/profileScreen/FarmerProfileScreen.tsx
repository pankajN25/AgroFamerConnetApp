import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { farmerOrderService } from "@/services/farmer/farmerOrderService";
import { authService } from "@/services/farmer/authService";

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditProfileModal({
  visible, user, onClose, onSave,
}: { visible: boolean; user: any; onClose: () => void; onSave: (u: any) => void }) {
  const [name, setName]       = useState(user?.nvcharFullName || "");
  const [phone, setPhone]     = useState(user?.nvcharPhoneNumber || "");
  const [farmType, setFarmType] = useState(user?.nvcharFarmingType || "");
  const [desc, setDesc]       = useState(user?.nvcharDescription || "");

  useEffect(() => {
    if (visible) {
      setName(user?.nvcharFullName || "");
      setPhone(user?.nvcharPhoneNumber || "");
      setFarmType(user?.nvcharFarmingType || "");
      setDesc(user?.nvcharDescription || "");
    }
  }, [visible, user]);

  const save = () => {
    if (!name.trim()) { Alert.alert("Validation", "Full name is required."); return; }
    onSave({ nvcharFullName: name.trim(), nvcharPhoneNumber: phone.trim(), nvcharFarmingType: farmType.trim(), nvcharDescription: desc.trim() });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F9F4" }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: "#9CA3AF", fontSize: 15, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827" }}>Edit Profile</Text>
            <TouchableOpacity onPress={save}>
              <Text style={{ color: "#16A34A", fontSize: 15, fontWeight: "700" }}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {[
              { label: "Full Name", value: name, set: setName, icon: "account-outline", kb: "default" as const },
              { label: "Phone Number", value: phone, set: setPhone, icon: "phone-outline", kb: "phone-pad" as const },
              { label: "Farming Type", value: farmType, set: setFarmType, icon: "sprout-outline", kb: "default" as const },
            ].map(f => (
              <View key={f.label} style={{ marginBottom: 16 }}>
                <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: "#E5E7EB" }}>
                  <MaterialCommunityIcons name={f.icon as any} size={18} color="#9CA3AF" />
                  <TextInput style={{ flex: 1, marginLeft: 10, fontSize: 15, color: "#111827" }} value={f.value} onChangeText={f.set} keyboardType={f.kb} placeholderTextColor="#D1D5DB" />
                </View>
              </View>
            ))}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>About / Description</Text>
              <View style={{ backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#E5E7EB" }}>
                <TextInput style={{ fontSize: 15, color: "#111827", minHeight: 72 }} value={desc} onChangeText={setDesc} multiline textAlignVertical="top" placeholder="Describe your farm..." placeholderTextColor="#D1D5DB" />
              </View>
            </View>
            <Text style={{ color: "#9CA3AF", fontSize: 12, textAlign: "center" }}>Email and location can only be changed by contacting support.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FarmerProfileScreen() {
  const navigation = useNavigation<any>();
  const isFocused  = useIsFocused();
  const fadeAnim   = useRef(new Animated.Value(0)).current;

  const [user, setUser]             = useState<any>(null);
  const [cropCount, setCropCount]   = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [editVisible, setEditVisible] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      const raw = await AsyncStorage.getItem("@farmer_user");
      if (!raw) return;
      const u = JSON.parse(raw);
      setUser(u);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

      if (u?.id) {
        try {
          const [crops, orders] = await Promise.all([
            farmerOrderService.getCropsByFarmerId(u.id),
            farmerOrderService.getOrdersByFarmerId(u.id),
          ]);
          setCropCount(crops.length);
          setOrderCount(orders.filter((o: any) => o.nvcharStatus === "Completed").length);
        } catch {}
      }
    })();
  }, [isFocused]);

  const rawProfilePhoto = user?.nvcharProfilePhotoUrl || "";
  const isLocalPhoto = rawProfilePhoto.startsWith("file:") || rawProfilePhoto.startsWith("content:");
  const resolvedProfilePhoto = isLocalPhoto
    ? rawProfilePhoto
    : authService.resolveProfileImageUrl(rawProfilePhoto);

  const resolvedAvatarUrl = authService.resolveProfileImageUrl(user?.avatarUrl || "");

  const avatarUri = resolvedProfilePhoto ||
    resolvedAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nvcharFullName || "F")}&background=16A34A&color=ffffff&size=200&bold=true`;

  const location = user
    ? [user.cityName, user.stateName, user.countryName].filter(Boolean).join(", ") ||
      user.nvcharLocation || "Your Farm Location"
    : "";

  const handleChangePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Allow photo library access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      const updated = { ...user, nvcharProfilePhotoUrl: uri };
      await AsyncStorage.setItem("@farmer_user", JSON.stringify(updated));
      setUser(updated);
    }
  };

  const handleSaveEdit = async (changes: any) => {
    const updated = { ...user, ...changes };
    await AsyncStorage.setItem("@farmer_user", JSON.stringify(updated));
    setUser(updated);
    setEditVisible(false);
    Alert.alert("Saved", "Profile updated successfully.");
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out", style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["@farmer_user"]);
          let n: any = navigation;
          while (n?.getParent?.()) n = n.getParent();
          n.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "FarmerLogin" }] }));
        },
      },
    ]);
  };

  const nav = (screen: string) => {
    const parent = navigation.getParent();
    (parent ?? navigation).navigate(screen);
  };

  // ── Reusable row ────────────────────────────────────────────────────────
  const MenuRow = ({ icon, iconBg, iconColor, label, sub, right, onPress, danger }: any) => (
    <TouchableOpacity
      onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: "#F9FAFB" }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: danger ? "#FEF2F2" : iconBg, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <MaterialCommunityIcons name={icon} size={18} color={danger ? "#EF4444" : iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: danger ? "#EF4444" : "#111827" }}>{label}</Text>
        {sub ? <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{sub}</Text> : null}
      </View>
      {right ?? <MaterialCommunityIcons name="chevron-right" size={20} color={danger ? "#FECACA" : "#D1D5DB"} />}
    </TouchableOpacity>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 20, paddingHorizontal: 20 }}>
      {title}
    </Text>
  );

  const Section = ({ children }: { children: React.ReactNode }) => (
    <View style={{ marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#F3F4F6" }}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F9F4" }}>
      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <View style={{ backgroundColor: "#16A34A", paddingTop: 28, paddingBottom: 56, paddingHorizontal: 20, overflow: "hidden", position: "relative" }}>
          <View style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.07)" }} />
          <View style={{ position: "absolute", bottom: -30, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)" }} />
          <View style={{ position: "absolute", top: 30, right: 80, width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.05)" }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>My Profile</Text>
            <TouchableOpacity onPress={() => setEditVisible(true)} style={{ backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 8 }}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "center" }}>
            <View style={{ position: "relative", marginBottom: 14 }}>
              <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: "rgba(255,255,255,0.85)" }} />
              <TouchableOpacity
                onPress={handleChangePhoto}
                style={{ position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#16A34A" }}
              >
                <MaterialCommunityIcons name="camera" size={14} color="#16A34A" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center" }} numberOfLines={1}>
              {user?.nvcharFullName || "Farmer"}
            </Text>
            {location ? (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color="rgba(255,255,255,0.75)" />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginLeft: 4 }} numberOfLines={1}>{location}</Text>
              </View>
            ) : null}
            {user?.nvcharFarmingType ? (
              <View style={{ marginTop: 10, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons name="check-decagram" size={13} color="#86EFAC" />
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", marginLeft: 5 }}>{user.nvcharFarmingType}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── STATS CARD (overlaps hero) ───────────────────────────────── */}
        <View style={{ marginHorizontal: 20, marginTop: -28, backgroundColor: "#fff", borderRadius: 20, flexDirection: "row", shadowColor: "#166534", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 10 }}>
          {[
            { value: String(cropCount), label: "Active Crops", icon: "sprout-outline", color: "#16A34A" },
            { value: String(orderCount), label: "Orders Done", icon: "receipt-text-outline", color: "#2563EB" },
            { value: "4.8", label: "Rating", icon: "star-outline", color: "#F59E0B" },
          ].map((s, i, arr) => (
            <View key={s.label} style={{ flex: 1, alignItems: "center", paddingVertical: 16, borderRightWidth: i < arr.length - 1 ? 1 : 0, borderColor: "#F3F4F6" }}>
              <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
              <Text style={{ color: "#111827", fontSize: 20, fontWeight: "800", marginTop: 4 }}>{s.value}</Text>
              <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "600", marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── QUICK ACTIONS ─────────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", marginHorizontal: 16, marginTop: 20, gap: 10 }}>
          {[
            { icon: "sprout-outline",           label: "My Crops",   color: "#16A34A", bg: "#F0FDF4", onPress: () => nav("MyCrops") },
            { icon: "receipt-text-outline",      label: "Orders",     color: "#2563EB", bg: "#EFF6FF", onPress: () => nav("Orders") },
            { icon: "storefront-outline",        label: "Market",     color: "#7C3AED", bg: "#F5F3FF", onPress: () => nav("Marketplace") },
          ].map(a => (
            <TouchableOpacity key={a.label} onPress={a.onPress} activeOpacity={0.75}
              style={{ flex: 1, alignItems: "center", backgroundColor: a.bg, borderRadius: 16, paddingVertical: 14 }}>
              <MaterialCommunityIcons name={a.icon as any} size={24} color={a.color} />
              <Text style={{ color: a.color, fontSize: 11, fontWeight: "700", marginTop: 6 }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CONTACT INFO ──────────────────────────────────────────────── */}
        <SectionTitle title="Contact Details" />
        <Section>
          {[
            { icon: "email-outline", label: "Email", value: user?.nvcharEmail },
            { icon: "phone-outline", label: "Phone", value: user?.nvcharPhoneNumber },
            { icon: "sprout-outline", label: "Farming Type", value: user?.nvcharFarmingType },
          ].filter(r => r.value).map((row, i, arr) => (
            <View key={row.label} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderColor: "#F9FAFB" }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <MaterialCommunityIcons name={row.icon as any} size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "600" }}>{row.label}</Text>
                <Text style={{ color: "#111827", fontSize: 14, fontWeight: "500", marginTop: 1 }} numberOfLines={1}>{row.value}</Text>
              </View>
            </View>
          ))}
        </Section>

        {/* ── BUSINESS ──────────────────────────────────────────────────── */}
        <SectionTitle title="Farm Management" />
        <Section>
          <MenuRow icon="sprout" iconBg="#F0FDF4" iconColor="#16A34A" label="My Crops" sub="Manage your inventory" onPress={() => nav("MyCrops")} />
          <MenuRow icon="plus-circle-outline" iconBg="#ECFDF5" iconColor="#10B981" label="Add New Crop" sub="List a crop for sale" onPress={() => nav("AddCrop")} />
          <MenuRow icon="chart-bar" iconBg="#F5F3FF" iconColor="#7C3AED" label="Earnings & Analytics" sub="View your revenue reports" onPress={() => Alert.alert("Coming Soon", "Analytics dashboard is under development.")} />
        </Section>

        {/* ── ACCOUNT ───────────────────────────────────────────────────── */}
        <SectionTitle title="Account" />
        <Section>
          <MenuRow icon="account-edit-outline" iconBg="#EFF6FF" iconColor="#3B82F6" label="Edit Profile" sub="Update name, phone, farming type" onPress={() => setEditVisible(true)} />
          <MenuRow icon="bell-outline" iconBg="#FEF3C7" iconColor="#D97706" label="Push Notifications" sub="Order updates and alerts"
            right={
              <Switch value={notifEnabled} onValueChange={setNotifEnabled}
                trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }} thumbColor={notifEnabled ? "#16A34A" : "#9CA3AF"} />
            }
          />
          <MenuRow icon="shield-check-outline" iconBg="#ECFDF5" iconColor="#10B981" label="Privacy & Security" sub="Password and permissions" onPress={() => Alert.alert("Privacy", "Password change coming soon.")} />
        </Section>

        {/* ── SUPPORT ───────────────────────────────────────────────────── */}
        <SectionTitle title="Support" />
        <Section>
          <MenuRow icon="help-circle-outline" iconBg="#F5F3FF" iconColor="#8B5CF6" label="Help Center" sub="FAQs and how-to guides"
            onPress={() => Alert.alert("Help Center", "Contact us at:\nsupport@agroconnect.in\n\nHelpline: 1800-XXX-XXXX")} />
          <MenuRow icon="star-outline" iconBg="#FFF7ED" iconColor="#F59E0B" label="Rate the App" sub="Share your feedback"
            onPress={() => Alert.alert("Rate Us", "Thank you for your feedback! We appreciate it.")} />
          <MenuRow icon="information-outline" iconBg="#F3F4F6" iconColor="#6B7280" label="About AgroConnect" sub="Version 1.0.0"
            onPress={() => Alert.alert("AgroConnect", "Version 1.0.0\n\nConnecting farmers and buyers for a better agricultural ecosystem.\n\n© 2025 AgroConnect")} />
        </Section>

        {/* ── ACCOUNT ID ────────────────────────────────────────────────── */}
        <View style={{ marginHorizontal: 16, marginTop: 20, backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#F3F4F6", flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <MaterialCommunityIcons name="identifier" size={18} color="#6B7280" />
          </View>
          <View>
            <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "600" }}>Farmer Account ID</Text>
            <Text style={{ color: "#374151", fontSize: 13, fontWeight: "700", marginTop: 1 }}>#{user?.id || "—"}</Text>
          </View>
        </View>

        {/* ── LOGOUT ────────────────────────────────────────────────────── */}
        <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FEF2F2", borderRadius: 18, paddingVertical: 15, borderWidth: 1, borderColor: "#FECACA" }}>
            <MaterialCommunityIcons name="logout-variant" size={20} color="#EF4444" />
            <Text style={{ color: "#EF4444", fontSize: 15, fontWeight: "700", marginLeft: 8 }}>Log Out</Text>
          </TouchableOpacity>
        </View>

      </Animated.ScrollView>

      <EditProfileModal visible={editVisible} user={user} onClose={() => setEditVisible(false)} onSave={handleSaveEdit} />
    </SafeAreaView>
  );
}
