// src/features/buyer/api/orderService.ts
import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const LOCAL_ORDERS_KEY = "@buyer_local_orders";

export const orderService = {
  // 1. Save the new order to the database
  placeOrder: async (orderData: any) => {
    try {
      const response = await api.post("/savetblOrder", orderData);
      return response.data;
    } catch (error) {
      console.error("Place Order API Error:", error);
      throw error;
    }
  },

  // 2. Fetch all orders for the logged-in buyer
  getOrdersByBuyerId: async (buyerId: number) => {
    try {
      const response = await api.post("/GettblOrderByBuyerId", { intBuyerId: buyerId });
      return response.data;
    } catch (error) {
      console.error("Get Buyer Orders API Error:", error);
      throw error;
    }
  },

  getLocalOrders: async () => {
    try {
      const orders = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
      return orders ? JSON.parse(orders) : [];
    } catch (error) {
      console.error("Get Local Buyer Orders Error:", error);
      return [];
    }
  },

  saveLocalOrder: async (orderData: any) => {
    try {
      const existingOrders = await orderService.getLocalOrders();
      const updatedOrders = [orderData, ...existingOrders];
      await AsyncStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updatedOrders));
      return updatedOrders;
    } catch (error) {
      console.error("Save Local Buyer Order Error:", error);
      throw error;
    }
  },
};
