// src/features/buyer/api/orderService.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@/config/apiConfig";
import { razorpayService } from "@/services/payment/razorpayService";

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

  updateOrderStatus: async (orderId: number, status: string, description?: string) => {
    try {
      const response = await api.post("/UpdateOrderStatusWithHistory", {
        id: orderId,
        nvcharStatus: status,
        nvcharDescription: description,
      });
      return response.data;
    } catch (error) {
      console.error("Update Order Status API Error:", error);
      throw error;
    }
  },

  updateOrderAddress: async (orderId: number, address: string) => {
    try {
      const response = await api.post("/edittblOrder", {
        id: orderId,
        nvcharDeliveryAddress: address,
      });
      return response.data;
    } catch (error) {
      console.error("Update Order Address API Error:", error);
      throw error;
    }
  },

  getPaymentByOrderId: async (orderId: number) => {
    try {
      const response = await api.post("/GettblTransactionByOrderId", { intOrderId: orderId });
      return response.data;
    } catch (error) {
      console.error("Get Payment Status API Error:", error);
      return null;
    }
  },

  cancelOrder: async (orderId: number, reason?: string) => {
    try {
      return await razorpayService.cancelOrder(orderId, reason);
    } catch (error) {
      console.error("Cancel Order API Error:", error);
      throw error;
    }
  },

  placeCodOrder: async (orderData: any) => {
    try {
      const response = await api.post("/order/cod", { order: orderData });
      return response.data;
    } catch (error) {
      console.error("Place COD Order API Error:", error);
      throw error;
    }
  },

  updateTransactionStatus: async (transaction: any, status: string) => {
    try {
      const response = await api.post("/edittblTransaction", {
        id: transaction.id,
        intOrderId: transaction.intOrderId,
        nvcharTransactionNo: transaction.nvcharTransactionNo,
        floatAmount: transaction.floatAmount,
        nvcharPaymentMethod: transaction.nvcharPaymentMethod,
        nvcharPaymentStatus: status,
      });
      return response.data;
    } catch (error) {
      console.error("Update Transaction API Error:", error);
      throw error;
    }
  },
};
