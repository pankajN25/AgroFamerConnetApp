import axios from "axios";
import { BASE_URL } from "@/config/apiConfig";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Buyer IDs in messages are offset by this constant to avoid collision with farmer IDs,
// since both tables use separate SQLite auto-increment sequences starting at 1.
export const BUYER_ID_OFFSET = 100000;

export const directMessageService = {
  // Call with raw IDs; specify who is the buyer so the offset is applied correctly.
  sendMessage: async (payload: {
    senderId: number;
    receiverId: number;
    message: string;
    senderType: "farmer" | "buyer";
    receiverType: "farmer" | "buyer";
  }) => {
    const effectiveSender =
      payload.senderType === "buyer"
        ? payload.senderId + BUYER_ID_OFFSET
        : payload.senderId;
    const effectiveReceiver =
      payload.receiverType === "buyer"
        ? payload.receiverId + BUYER_ID_OFFSET
        : payload.receiverId;
    const response = await api.post("/SendDirectMessage", {
      sender_id: effectiveSender,
      receiver_id: effectiveReceiver,
      message: payload.message,
    });
    return response.data;
  },

  // Pass raw IDs + types; offset is applied internally.
  getMessagesBetweenUsers: async (
    user1Id: number,
    user2Id: number,
    user1Type: "farmer" | "buyer",
    user2Type: "farmer" | "buyer"
  ) => {
    const effective1 = user1Type === "buyer" ? user1Id + BUYER_ID_OFFSET : user1Id;
    const effective2 = user2Type === "buyer" ? user2Id + BUYER_ID_OFFSET : user2Id;
    const response = await api.get("/GetDirectMessagesBetweenUsers", {
      params: { sender_id: effective1, receiver_id: effective2 },
    });
    return response.data;
  },

  // Pass raw userId + type; offset applied for buyers.
  getMessagesByUser: async (userId: number, userType: "farmer" | "buyer") => {
    const effectiveId = userType === "buyer" ? userId + BUYER_ID_OFFSET : userId;
    const response = await api.get("/GetDirectMessagesByUser", {
      params: { user_id: effectiveId },
    });
    return response.data;
  },
};
