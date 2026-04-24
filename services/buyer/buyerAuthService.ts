// src/features/auth/api/buyerAuthService.ts
import axios from "axios";
import { Platform } from "react-native";
import { BASE_URL } from "@/config/apiConfig";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

const extractList = (response: any): any[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

const normalizeUrl = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const trimmedValue = value.trim().replace(/\\/g, "/");
  if (!trimmedValue || trimmedValue === "default_profile.jpg") {
    return "";
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    try {
      const incoming = new URL(trimmedValue);
      const apiOrigin = new URL(BASE_URL).origin;
      if (["127.0.0.1", "localhost", "0.0.0.0", "::1"].includes(incoming.hostname)) {
        return `${apiOrigin}${incoming.pathname}${incoming.search}${incoming.hash}`;
      }
    } catch {
      // fall through
    }

    return trimmedValue;
  }

  if (!trimmedValue.includes("/")) {
    return `${BASE_URL}/uploads/tblBuyerRegister/${trimmedValue}`;
  }

  if (trimmedValue.startsWith("/")) {
    return `${BASE_URL}${trimmedValue}`;
  }

  if (trimmedValue.startsWith("uploads/")) {
    return `${BASE_URL}/${trimmedValue}`;
  }

  return `${BASE_URL}/${trimmedValue}`;
};

export interface BuyerRegisterPayload {
  nvcharFullName: string;
  nvcharEmail: string;
  nvcharPhoneNumber: string;
  nvcharPassword?: string;
  nvcharAddress: string;
  nvcharCity: string;
  nvcharState: string;
  nvcharCountry: string;
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

  editBuyer: async (data: Record<string, unknown>) => {
    const response = await api.post("/edittblBuyerRegister", data);
    return response.data;
  },

  getFarmerById: async (intFarmerId: number) => {
    try {
      // Backend doesn't expose /GettblFarmerRegisterById in some setups.
      // Fetch all and filter to avoid 404 logs.
      const response = await api.get("/GettblFarmerRegister");
      const list = extractList(response.data ?? response);
      const match = list.find((f: any) => Number(f?.id) === Number(intFarmerId));
      return { status: match ? "success" : "not found", data: match ?? null };
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

  uploadBuyerProfilePhoto: async (imageUri: string, buyerId: number | string) => {
    const formData = new FormData();
    formData.append("buyer_id", String(buyerId));

    if (Platform.OS === "web") {
      const res = await fetch(imageUri);
      const blob = await res.blob();
      formData.append("image", blob, "profile.jpg");
    } else {
      const rawName = imageUri.split("/").pop() || "profile.jpg";
      const filename = rawName.includes(".") ? rawName : `${rawName}.jpg`;
      formData.append(
        "image",
        {
          uri: imageUri,
          name: filename,
          type: "image/jpeg",
        } as any
      );
    }

    const response = await fetch(`${BASE_URL}/uploadtblBuyerRegisterProfilePictureWithMeta`, {
      method: "POST",
      body: formData,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        data?.detail ||
        data?.message ||
        data?.error ||
        `Upload failed with status ${response.status}`;
      throw new Error(message);
    }

    return data;
  },

  extractProfileImageUrl: (response: any) => {
    const raw = (
      response?.url ||
      response?.imageUrl ||
      response?.nvcharProfilePhotoUrl ||
      response?.fileUrl ||
      response?.path ||
      response?.data?.url ||
      response?.data?.imageUrl ||
      response?.data?.nvcharProfilePhotoUrl ||
      response?.data?.fileUrl ||
      response?.data?.path ||
      ""
    );
    return normalizeUrl(raw);
  },

  resolveProfileImageUrl: (value?: string | null) => normalizeUrl(value),
};
