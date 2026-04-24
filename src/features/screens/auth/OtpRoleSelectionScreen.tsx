import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OtpRoleSelectionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phoneNumber = route.params?.phoneNumber || "";
  const phoneVerified = Boolean(route.params?.phoneVerified);

  const [selectedRole, setSelectedRole] = useState<"buyer" | "farmer" | null>(null);

  const handleContinue = () => {
    if (selectedRole === "buyer") {
      navigation.navigate("BuyerRegister" as never, {
        prefillPhone: phoneNumber,
        phoneVerified,
      } as never);
    }
    if (selectedRole === "farmer") {
      navigation.navigate("FarmerRegister" as never, {
        prefillPhone: phoneNumber,
        phoneVerified,
      } as never);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <View className="items-center px-6 pt-10 pb-6">
        <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-5">
          <MaterialCommunityIcons name="leaf" size={40} color="#16A34A" />
        </View>
        <Text className="text-3xl font-extrabold text-[#111827] mb-2">Choose your role</Text>
        <Text className="text-center text-[#6B7280] leading-5 px-4">
          Complete registration to continue
        </Text>
      </View>

      <View className="flex-1 px-5">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSelectedRole("farmer")}
          style={{
            borderWidth: 2,
            borderColor: selectedRole === "farmer" ? "#16A34A" : "#E5E7EB",
            backgroundColor: selectedRole === "farmer" ? "#F0FDF4" : "#FFFFFF",
            borderRadius: 20,
            padding: 20,
            marginBottom: 14,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-2xl bg-green-100 items-center justify-center mr-4">
              <MaterialCommunityIcons name="sprout" size={28} color="#16A34A" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-[#111827] mb-1">Farmer</Text>
              <Text className="text-[#6B7280] text-sm leading-5">
                List crops, manage inventory & connect with buyers
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSelectedRole("buyer")}
          style={{
            borderWidth: 2,
            borderColor: selectedRole === "buyer" ? "#3B82F6" : "#E5E7EB",
            backgroundColor: selectedRole === "buyer" ? "#EFF6FF" : "#FFFFFF",
            borderRadius: 20,
            padding: 20,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-2xl bg-blue-100 items-center justify-center mr-4">
              <MaterialCommunityIcons name="storefront-outline" size={28} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-[#111827] mb-1">Buyer</Text>
              <Text className="text-[#6B7280] text-sm leading-5">
                Browse crops and order directly from farms
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View className="px-5 pb-8 pt-5">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedRole}
          className="flex-row justify-center items-center h-14 rounded-xl"
          style={{
            backgroundColor: selectedRole === "buyer" ? "#3B82F6" : selectedRole === "farmer" ? "#16A34A" : "#D1D5DB",
            shadowColor: selectedRole ? "#0F172A" : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: selectedRole ? 0.25 : 0,
            shadowRadius: 8,
            elevation: selectedRole ? 5 : 0,
          }}
        >
          <Text className="text-base font-bold mr-2" style={{ color: selectedRole ? "white" : "#9CA3AF" }}>
            Continue
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={selectedRole ? "white" : "#9CA3AF"} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
