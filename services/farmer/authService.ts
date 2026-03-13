import axios from "axios";
import { Platform } from "react-native";

const BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

  uploadProfilePicture: async (imageUri: string) => {
    const formData = new FormData();
    formData.append("AddGuest_id", "1");

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
    return (
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
  },
};
