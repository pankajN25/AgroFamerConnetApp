// src/features/auth/screens/SplashScreen.tsx
import { useEffect } from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseStoredUser } from "@/src/utils/authSession";

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const buyerUser = parseStoredUser(await AsyncStorage.getItem("@buyer_user"));
      const farmerUser = parseStoredUser(await AsyncStorage.getItem("@farmer_user"));

      if (buyerUser?.id) {
        navigation.navigate("BuyerTabs" as never);
        return;
      }

      if (farmerUser?.id) {
        navigation.navigate("FarmerTabs" as never);
        return;
      }

      navigation.navigate("RoleSelection" as never);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View className="flex-1 bg-[#F4F9F4] items-center justify-between py-12">
      {/* ... KEEP ALL THE UI CODE WE WROTE EARLIER EXACTLY THE SAME ... */}
      
      <View className="flex-1 items-center justify-center mt-10">
        <View className="w-36 h-36 rounded-full bg-white/60 border-8 border-green-50 items-center justify-center mb-6 shadow-sm">
          <View className="w-24 h-24 rounded-full bg-[#00E600] items-center justify-center shadow-lg shadow-green-400/50">
            <MaterialCommunityIcons name="leaf" size={50} color="white" />
          </View>
        </View>
        <Text className="text-4xl font-extrabold text-[#111827]">
          Agro<Text className="text-[#00E600]">Connect</Text>
        </Text>
        <Text className="text-[#6B7280] font-medium mt-3 text-base">
          Direct Market Access for Farmers
        </Text>
      </View>

      <View className="w-full px-12 pb-6">
        <View className="flex-row justify-between mb-2">
          <Text className="text-[#9CA3AF] font-bold text-xs tracking-widest">INITIALISING</Text>
          <Text className="text-[#00E600] font-bold text-xs">65%</Text>
        </View>
        <View className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
          <View className="w-[65%] h-full bg-[#00E600] rounded-full" />
        </View>
        <View className="flex-row items-center justify-center">
          <MaterialCommunityIcons name="shield-check" size={16} color="#9CA3AF" />
          <Text className="text-[#9CA3AF] text-xs font-semibold ml-2 tracking-wide">
            SECURE AGRI-NETWORK
          </Text>
        </View>
      </View>
    </View>
  );
}
