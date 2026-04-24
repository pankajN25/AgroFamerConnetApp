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
    return `${BASE_URL}/uploads/tblFarmerRegister/${trimmedValue}`;
  }

  if (trimmedValue.startsWith("/")) {
    return `${BASE_URL}${trimmedValue}`;
  }

  if (trimmedValue.startsWith("uploads/")) {
    return `${BASE_URL}/${trimmedValue}`;
  }

  return `${BASE_URL}/${trimmedValue}`;
};

export interface FarmerRegisterPayload {
  nvcharFullName: string;
  nvcharPhoneNumber: string;
  nvcharEmail: string;
  nvcharPassword: string;
  nvcharProfilePhotoUrl: string;
  intcountryId: string | number;
  intstateId: string | number;
  intCityId: string | number;
  nvcharFarmingType: string;
  nvcharPreferredLanguage: string;
  ynPhoneVerified: boolean;
  nvcharDescription: string;
}

export interface FarmerLoginPayload {
  identifier: string;
  nvcharPassword: string;
}

export const authService = {
  registerFarmer: async (data: FarmerRegisterPayload) => {
    const response = await api.post("/savetblFarmerRegister", data);
    return response.data;
  },

  editFarmer: async (data: Record<string, unknown>) => {
    const response = await api.post("/edittblFarmerRegister", data);
    return response.data;
  },

  loginFarmer: async (data: FarmerLoginPayload) => {
    try {
      const response = await api.post("/GettblFarmerLoginFlexible", data);
      return response.data;
    } catch (error) {
      console.error("Login API Error:", error);
      throw error;
    }
  },

  getCountries: async () => {
    const response = await api.get("/GetCountries");
    return response.data;
  },

  getStatesByCountry: async (countryId: string | number) => {
    const response = await api.post("/GetStatesByCountry_id", { intcountryId: countryId });
    return response.data;
  },

  getCitiesByState: async (stateId: string | number) => {
    const response = await api.post("/GetCitiesByState_id", { intstateId: stateId });
    return response.data;
  },

  uploadProfilePicture: async (imageUri: string, farmerId: number | string) => {
    const formData = new FormData();
    formData.append("AddGuest_id", String(farmerId));

    if (Platform.OS === "web") {
      const res = await fetch(imageUri);
      const blob = await res.blob();
      formData.append("image", blob, "profile.jpg");
    } else {
      const filename = imageUri.split("/").pop() || "profile.jpg";
      formData.append(
        "image",
        {
          uri: imageUri,
          name: filename,
          type: "image/jpeg",
        } as any
      );
    }

    const response = await api.post("/uploadtblFarmerRegisterProfilePictureWithMeta", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
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
