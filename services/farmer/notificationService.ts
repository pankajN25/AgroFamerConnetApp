// src/features/farmer/api/notificationService.ts
import axios from "axios";
import { Platform } from "react-native";

const BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const notificationService = {
  getNotificationsByFarmerId: async (farmerId: number) => {
    try {
      const response = await api.post("/GettblNotificationByFarmerId", { intFarmerId: farmerId });
      return response.data;
    } catch (error) {
      console.error("Get Notifications Error:", error);
      throw error;
    }
  },

  // Used to mark a notification as read (intIsRead: 1)
  updateNotification: async (data: any) => {
    try {
      const response = await api.post("/edittblNotification", data);
      return response.data;
    } catch (error) {
      console.error("Update Notification Error:", error);
      throw error;
    }
  }
};