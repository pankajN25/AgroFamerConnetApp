import axios from "axios";
import { BASE_URL } from "@/config/apiConfig";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export const otpAuthService = {
  sendOtp: async (phoneNumber: string) => {
    const res = await api.post("/SendPhoneOTP", { phone_number: phoneNumber });
    return res.data;
  },

  verifyOtp: async (phoneNumber: string, otpCode: string, roleHint?: "buyer" | "farmer") => {
    const res = await api.post("/VerifyPhoneOTP", {
      phone_number: phoneNumber,
      otp_code: otpCode,
      role_hint: roleHint,
    });
    return res.data;
  },

  resendOtp: async (phoneNumber: string) => {
    const res = await api.post("/ResendPhoneOTP", { phone_number: phoneNumber });
    return res.data;
  },

  checkUserByPhone: async (phoneNumber: string) => {
    const res = await api.post("/CheckUserByPhone", { phone_number: phoneNumber });
    return res.data;
  },
};
