// src/features/farmer/screens/WeatherScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- DUMMY DATA (Matches your tblWeatherForecast API payload) ---
const DUMMY_WEATHER = {
  intLocationId: 1,
  intTemperature: 28,
  intMinTemperature: 22,
  intMaxTemperature: 35,
  intHumidity: 65,
  intRainfallProbability: 30,
  intWindSpeed: 12,
  nvcharWeatherCondition: "Partly Cloudy",
  locationName: "Green Valley Farm, Pune", // Using Pune as the default
  lastUpdated: "10:30 AM"
};

export default function WeatherScreen() {
  const navigation = useNavigation<any>();
  const [weatherData, setWeatherData] = useState(DUMMY_WEATHER);
  const [isLoading, setIsLoading] = useState(false);

  // This is how we WILL fetch it when the backend is connected
  useEffect(() => {
    const fetchWeather = async () => {
      /* 1. Get Farmer's Location ID from AsyncStorage
      const userStr = await AsyncStorage.getItem('@farmer_user');
      const locationId = JSON.parse(userStr).intCityId || 1;
      
      2. Call your API
      const response = await weatherService.getWeatherByLocation(locationId);
      setWeatherData(response.data);
      */
    };
    fetchWeather();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      
      {/* ---------------- HEADER ---------------- */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-4 bg-[#F9FAFB]">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <MaterialCommunityIcons name="menu" size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#111827] tracking-wider">WEATHER FORECAST</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications")}
          className="p-2 -mr-2 relative"
        >
          <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
          <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#F9FAFB]" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        
        {/* ---------------- MAIN GREEN WEATHER CARD ---------------- */}
        <View className="bg-[#10B981] rounded-3xl p-6 mb-6 shadow-lg shadow-green-500/30">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <View className="flex-row items-center mb-2">
                <MaterialCommunityIcons name="map-marker" size={16} color="white" />
                <Text className="text-white font-semibold ml-1">{weatherData.locationName}</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-white text-6xl font-extrabold">{weatherData.intTemperature}</Text>
                <Text className="text-white text-3xl font-bold mt-2">°C</Text>
              </View>
              <Text className="text-white text-lg font-medium mt-1">{weatherData.nvcharWeatherCondition}</Text>
            </View>

            <View className="items-end pt-2">
              <MaterialCommunityIcons name="weather-partly-cloudy" size={64} color="white" />
              <Text className="text-white font-medium mt-2">
                H: {weatherData.intMaxTemperature}° L: {weatherData.intMinTemperature}°
              </Text>
            </View>
          </View>

          <View className="h-[1px] bg-white/20 w-full mb-4 mt-2" />

          <View className="flex-row justify-between items-center">
            <Text className="text-white/80 text-sm">Last updated: {weatherData.lastUpdated}</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-white font-bold mr-1">View Details</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- CURRENT CONDITIONS GRID ---------------- */}
        <Text className="text-sm font-bold text-[#6B7280] tracking-widest mb-4 uppercase">Current Conditions</Text>
        
        <View className="flex-row justify-between mb-8 space-x-3">
          {/* Rain Probability */}
          <View className="flex-1 bg-white p-4 rounded-2xl items-center shadow-sm border border-gray-100">
            <MaterialCommunityIcons name="water-outline" size={28} color="#3B82F6" className="mb-2" />
            <Text className="text-[10px] font-bold text-[#9CA3AF] mb-1">RAIN PROB.</Text>
            <Text className="text-lg font-extrabold text-[#111827]">{weatherData.intRainfallProbability}%</Text>
          </View>
          
          {/* Humidity */}
          <View className="flex-1 bg-white p-4 rounded-2xl items-center shadow-sm border border-gray-100">
            <MaterialCommunityIcons name="water-percent" size={28} color="#10B981" className="mb-2" />
            <Text className="text-[10px] font-bold text-[#9CA3AF] mb-1">HUMIDITY</Text>
            <Text className="text-lg font-extrabold text-[#111827]">{weatherData.intHumidity}%</Text>
          </View>
          
          {/* Wind */}
          <View className="flex-1 bg-white p-4 rounded-2xl items-center shadow-sm border border-gray-100">
            <MaterialCommunityIcons name="weather-windy" size={28} color="#F59E0B" className="mb-2" />
            <Text className="text-[10px] font-bold text-[#9CA3AF] mb-1">WIND</Text>
            <Text className="text-lg font-extrabold text-[#111827]">{weatherData.intWindSpeed} <Text className="text-xs">km/h</Text></Text>
          </View>
        </View>

        {/* ---------------- FARMING ADVICE ---------------- */}
        <Text className="text-sm font-bold text-[#6B7280] tracking-widest mb-4 uppercase">Farming Advice</Text>
        
        <View className="bg-white rounded-3xl p-5 mb-6 shadow-sm border-l-4 border-[#10B981]">
          <View className="flex-row mb-3">
            <View className="w-12 h-12 bg-green-50 rounded-xl items-center justify-center mr-4">
              <MaterialCommunityIcons name="leaf" size={24} color="#10B981" />
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-[#111827] font-bold text-base mb-1">Daily Recommendation</Text>
            </View>
          </View>
          <Text className="text-[#4B5563] leading-relaxed mb-4">
            Based on the current humidity ({weatherData.intHumidity}%) and low rain probability, today is ideal for scheduled irrigation and fertilizer application for your crops.
          </Text>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-[#10B981] font-bold mr-1">Read full guide</Text>
            <MaterialCommunityIcons name="open-in-new" size={16} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* ---------------- LIVE TRACKING MAP ---------------- */}
        <View className="w-full h-32 bg-gray-200 rounded-3xl overflow-hidden relative items-center justify-center mb-6">
          <Image 
            source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80" }} 
            className="w-full h-full opacity-60" 
            resizeMode="cover" 
          />
          <View className="absolute bg-white px-4 py-2 rounded-full shadow-sm flex-row items-center">
            <View className="w-2.5 h-2.5 bg-[#10B981] rounded-full mr-2" />
            <Text className="text-[#111827] font-bold text-sm">Live Tracking Active</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
