import axios from "axios";
import { BASE_URL } from "@/config/apiConfig";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

export const razorpayService = {
  createOrder: async (payload: {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, any>;
  }) => {
    const res = await api.post("/razorpay/create-order", payload);
    return res.data;
  },

  verifyPaymentAndCreateOrder: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    order: any;
  }) => {
    const res = await api.post("/razorpay/verify", payload);
    return res.data;
  },

  cancelOrder: async (orderId: number, reason?: string) => {
    const res = await api.post("/razorpay/cancel-order", {
      intOrderId: orderId,
      reason: reason || "Cancelled by buyer",
    });
    return res.data;
  },
};
