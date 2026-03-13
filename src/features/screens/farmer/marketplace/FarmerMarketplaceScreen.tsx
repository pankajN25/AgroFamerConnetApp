// src/features/farmer/screens/FarmerMarketplaceScreen.tsx
import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, SafeAreaView, 
  ScrollView, Image, FlatList 
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// --- DUMMY DATA FOR MARKET INTELLIGENCE ---
// Later fetched via GettblCrop (averaged out by category)
const TRENDING_PRICES = [
  {
    id: "1",
    cropName: "Organic Tomatoes",
    avgPrice: 42,
    trend: "up",
    percentage: "5.2%",
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "2",
    cropName: "Red Onions",
    avgPrice: 28,
    trend: "down",
    percentage: "2.1%",
    imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "3",
    cropName: "Russet Potatoes",
    avgPrice: 22,
    trend: "up",
    percentage: "1.5%",
    imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=200&q=80"
  }
];

// --- DUMMY DATA FOR BUYER DEMANDS ---
// Later fetched from a specific "Buyer Requests" or Orders table
const BUYER_DEMANDS = [
  {
    id: "101",
    buyerName: "FreshMart Supermarkets",
    cropRequested: "Green Bell Peppers",
    quantityRequired: "500 kg",
    offerPrice: 45, // ₹ per kg
    urgency: "High",
    location: "Pune Central Warehouse",
    timePosted: "2 hours ago"
  },
  {
    id: "102",
    buyerName: "Organic Eatery Chain",
    cropRequested: "Avocados",
    quantityRequired: "150 kg",
    offerPrice: 120, 
    urgency: "Medium",
    location: "Mumbai Suburbs",
    timePosted: "5 hours ago"
  }
];

export default function FarmerMarketplaceScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Live Prices");

  // Render horizontal trending cards
  const renderTrendingCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      className="bg-white rounded-3xl p-4 mr-4 shadow-sm border border-gray-100 w-40"
      onPress={() => console.log("Navigate to CropTrendsScreen")}
    >
      <Image source={{ uri: item.imageUrl }} className="w-full h-24 rounded-2xl mb-3" resizeMode="cover" />
      <Text className="text-[#111827] font-bold text-sm mb-1" numberOfLines={1}>{item.cropName}</Text>
      
      <View className="flex-row items-end justify-between">
        <Text className="text-[#10B981] font-extrabold text-lg">₹{item.avgPrice}<Text className="text-xs font-normal text-gray-400">/kg</Text></Text>
        <View className="flex-row items-center mb-1">
          <MaterialCommunityIcons 
            name={item.trend === 'up' ? 'trending-up' : 'trending-down'} 
            size={14} 
            color={item.trend === 'up' ? '#10B981' : '#EF4444'} 
          />
          <Text className={`text-[10px] font-bold ml-1 ${item.trend === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {item.percentage}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      
      {/* ---------------- HEADER ---------------- */}
      <View className="px-6 pt-4 pb-2 bg-[#F9FAFB]">
        <Text className="text-2xl font-extrabold text-[#111827]">Marketplace</Text>
        <Text className="text-[#6B7280] text-sm mt-1">Live market insights & buyer demands</Text>
      </View>

      {/* ---------------- SEARCH BAR ---------------- */}
      <View className="px-6 py-3">
        <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 h-14 shadow-sm">
          <MaterialCommunityIcons name="magnify" size={24} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base text-[#111827]"
            placeholder="Search crops or buyers..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity className="w-10 h-10 bg-green-50 rounded-xl items-center justify-center">
            <MaterialCommunityIcons name="tune-variant" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* ---------------- SECTION 1: LIVE MARKET PRICES ---------------- */}
        <View className="mt-4">
          <View className="flex-row justify-between items-center px-6 mb-4">
            <Text className="text-lg font-bold text-[#111827]">Live Market Prices</Text>
            <TouchableOpacity>
              <Text className="text-[#10B981] font-bold text-sm">See All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
            data={TRENDING_PRICES}
            keyExtractor={item => item.id}
            renderItem={renderTrendingCard}
          />
        </View>

        {/* ---------------- PROMO BANNER ---------------- */}
        <View className="px-6 mt-8 mb-4">
          <View className="bg-[#111827] rounded-3xl p-5 relative overflow-hidden flex-row items-center justify-between shadow-lg">
            <MaterialCommunityIcons name="bullhorn" size={80} color="rgba(255,255,255,0.05)" className="absolute -right-4 -bottom-4" />
            <View className="flex-1 pr-4">
              <Text className="text-white font-bold text-lg mb-1">Boost Your Sales!</Text>
              <Text className="text-gray-400 text-xs leading-relaxed">Upgrade your crops to "Premium Grade" to appear at the top of buyer searches.</Text>
            </View>
            <TouchableOpacity className="bg-[#10B981] px-4 py-2.5 rounded-xl">
              <Text className="text-white font-bold text-sm">Upgrade</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- SECTION 2: ACTIVE BUYER DEMANDS ---------------- */}
        <View className="px-6 mt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-[#111827]">Active Buyer Demands</Text>
            <View className="bg-red-100 px-2 py-1 rounded-md">
              <Text className="text-red-600 text-xs font-bold">HOT</Text>
            </View>
          </View>

          {BUYER_DEMANDS.map((demand) => (
            <View key={demand.id} className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#10B981] mb-1 uppercase tracking-wider">WANTED</Text>
                  <Text className="text-lg font-extrabold text-[#111827] leading-tight">{demand.cropRequested}</Text>
                  <Text className="text-[#6B7280] text-sm mt-0.5">{demand.buyerName}</Text>
                </View>
                <View className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 items-center">
                  <Text className="text-xs text-gray-500 mb-0.5">Offer</Text>
                  <Text className="text-[#111827] font-bold">₹{demand.offerPrice}<Text className="text-[10px] font-normal">/kg</Text></Text>
                </View>
              </View>

              <View className="flex-row items-center mb-4 space-x-4">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="weight" size={16} color="#9CA3AF" />
                  <Text className="text-[#4B5563] font-semibold text-sm ml-1.5">{demand.quantityRequired}</Text>
                </View>
                <View className="flex-row items-center flex-1">
                  <MaterialCommunityIcons name="map-marker-outline" size={16} color="#9CA3AF" />
                  <Text className="text-[#4B5563] text-sm ml-1.5 flex-1" numberOfLines={1}>{demand.location}</Text>
                </View>
              </View>

              <View className="flex-row space-x-3">
                <TouchableOpacity className="flex-1 bg-[#F4F9F4] py-3 rounded-xl items-center border border-green-100">
                  <Text className="text-[#10B981] font-bold">Message Buyer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-1 bg-[#10B981] py-3 rounded-xl items-center shadow-sm"
                  onPress={() => console.log("Navigate to FulfillRequestScreen")}
                >
                  <Text className="text-white font-bold">I Can Supply</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}