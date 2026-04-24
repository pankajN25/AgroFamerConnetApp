// src/features/farmer/api/chatService.ts
import axios from "axios";
import { BASE_URL } from "@/config/apiConfig";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ChatRoomPayload {
  nvcharRoomName: string;
  intCreatedBy: number;
  intParticipantCount: number;
  nvcharRoomType: string; // e.g., "Group" or "Direct"
}

export const chatService = {
  getChatRooms: async () => {
    try {
      const response = await api.get("/GettblChatRoom");
      return response.data;
    } catch (error) {
      console.error("Get Chat Rooms API Error:", error);
      throw error;
    }
  },

  saveChatRoom: async (data: ChatRoomPayload) => {
    try {
      const response = await api.post("/savetblChatRoom", data);
      return response.data;
    } catch (error) {
      console.error("Save Chat Room API Error:", error);
      throw error;
    }
  },

  deleteChatRoom: async (roomId: number) => {
    try {
      const response = await api.post("/deletetblChatRoom", { id: roomId });
      return response.data;
    } catch (error) {
      console.error("Delete Chat Room API Error:", error);
      throw error;
    }
  }
};