// src/features/auth/api/buyerAuthService.ts
import axios from "axios";
import { Platform } from "react-native";

const BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface BuyerRegisterPayload {
  nvcharFullName: string;
  nvcharEmail: string;
  nvcharPhoneNumber: string;
  nvcharPassword?: string;
  nvcharAddress: string;
  intCityId: number;
  intstateId: number;
  intcountryId: number;
  nvcharProfilePhotoUrl: string;
  ynPhoneVerified: boolean;
}

export interface BuyerLoginPayload {
  identifier: string;
  nvcharPassword: string;
}

export const buyerAuthService = {
  // Connects to your /savetblBuyerRegister FastAPI route
  registerBuyer: async (data: BuyerRegisterPayload) => {
    try {
      const response = await api.post("/savetblBuyerRegister", data);
      return response.data;
    } catch (error) {
      console.error("Buyer Registration API Error:", error);
      throw error;
    }
  },

  getFarmerById: async (intFarmerId: number) => {
    try {
      const response = await api.post("/GettblFarmerRegisterById", { id: intFarmerId });
      return response.data;
    } catch (error) {
      console.error("Get Farmer By Id API Error:", error);
      throw error;
    }
  },

  loginBuyer: async (data: BuyerLoginPayload) => {
    const loginEndpoints = [
      "/GettblBuyerLoginFlexible",
      "/GettblBuyerLogin",
      "/GetBuyerLogin",
    ];

    let lastError: unknown;

    for (const endpoint of loginEndpoints) {
      try {
        const response = await api.post(endpoint, data);
        return response.data;
      } catch (error: any) {
        const statusCode = error?.response?.status;

        if (statusCode && statusCode !== 404) {
          console.error("Buyer Login API Error:", error);
          throw error;
        }

        lastError = error;
      }
    }

    console.error("Buyer Login API Error:", lastError);
    throw lastError;
  },
};
