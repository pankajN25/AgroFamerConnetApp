import axios from "axios";
import { BASE_URL } from "@/config/apiConfig";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export interface GoogleLoginPayload {
  id_token?: string;
  access_token?: string;
  client_id?: string;
}

export interface GoogleCompleteRegistrationPayload {
  id_token?: string;
  access_token?: string;
  client_id?: string;
  role: "farmer" | "buyer";
  nvcharFullName: string;
  nvcharPhoneNumber: string;
  nvcharPassword: string;
  nvcharLocation?: string;
  nvcharAddress?: string;
  intcountryId?: string;
  intstateId?: string;
  intCityId?: string;
  nvcharFarmingType?: string;
  nvcharPreferredLanguage?: string;
  nvcharDescription?: string;
}

export const googleAuthService = {
  /**
   * Step 1 — verify token, check if user exists.
   * Returns auth_type: "farmer_login" | "buyer_login" | "register"
   */
  googleLogin: async (payload: GoogleLoginPayload) => {
    const res = await api.post("/GoogleLogin", payload);
    return res.data;
  },

  /**
   * Step 2 — called only when auth_type === "register".
   * Creates farmer or buyer record linked to the Google account.
   */
  googleCompleteRegistration: async (payload: GoogleCompleteRegistrationPayload) => {
    const res = await api.post("/GoogleCompleteRegistration", payload);
    return res.data;
  },
};
