import axios from "axios";
import { BASE_URL } from "@/config/apiConfig";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const directMessageService = {
  sendMessage: async (payload: { senderId: number; receiverId: number; message: string }) => {
    const response = await api.post("/SendDirectMessage", {
      sender_id: payload.senderId,
      receiver_id: payload.receiverId,
      message: payload.message,
    });
    return response.data;
  },

  getMessagesBetweenUsers: async (user1Id: number, user2Id: number) => {
    const response = await api.get("/GetDirectMessagesBetweenUsers", {
      params: { sender_id: user1Id, receiver_id: user2Id },
    });
    return response.data;
  },

  getMessagesByUser: async (userId: number) => {
    const response = await api.get("/GetDirectMessagesByUser", {
      params: { user_id: userId },
    });
    return response.data;
  },
};
