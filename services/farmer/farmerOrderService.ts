import axios from "axios";
import { BASE_URL } from "@/config/apiConfig";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const extractList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

export const farmerOrderService = {
  getOrdersByFarmerId: async (farmerId: number) => {
    const res = await api.post("/GettblOrderByFarmerId", { intFarmerId: farmerId });
    return extractList(res.data);
  },

  getBuyerById: async (buyerId: number) => {
    const res = await api.post("/GettblBuyerRegisterById", { id: buyerId });
    return res.data;
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    const res = await api.post("/UpdateOrderStatusWithHistory", {
      id: orderId,
      nvcharStatus: status,
      nvcharDescription: `Status updated to ${status}`,
    });
    return res.data;
  },

  getPaymentByOrderId: async (orderId: number) => {
    const res = await api.post("/GettblTransactionByOrderId", { intOrderId: orderId });
    return res.data;
  },

  updateTransactionStatus: async (transaction: any, status: string) => {
    const res = await api.post("/edittblTransaction", {
      id: transaction.id,
      intOrderId: transaction.intOrderId,
      nvcharTransactionNo: transaction.nvcharTransactionNo,
      floatAmount: transaction.floatAmount,
      nvcharPaymentMethod: transaction.nvcharPaymentMethod,
      nvcharPaymentStatus: status,
    });
    return res.data;
  },

  getCropsByFarmerId: async (farmerId: number) => {
    const res = await api.post("/GettblCropByFarmerId", { intFarmerId: farmerId });
    return extractList(res.data);
  },
};
