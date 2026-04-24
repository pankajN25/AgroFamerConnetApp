import axios from "axios";
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
    return null;
  }

  const trimmedValue = value.trim().replace(/\\/g, "/");
  if (!trimmedValue || trimmedValue === "default_crop.jpg") {
    return null;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    try {
      const incoming = new URL(trimmedValue);
      const apiOrigin = new URL(BASE_URL).origin;
      if (["127.0.0.1", "localhost", "0.0.0.0", "::1"].includes(incoming.hostname)) {
        return `${apiOrigin}${incoming.pathname}${incoming.search}${incoming.hash}`;
      }
    } catch (error) {
      // fall through to return original value
    }

    return trimmedValue;
  }

  // Bare filenames from tblCrop (e.g. "banana.jpg")
  if (!trimmedValue.includes("/")) {
    return `${BASE_URL}/uploads/crops/${trimmedValue}`;
  }

  if (trimmedValue.startsWith("/")) {
    return `${BASE_URL}${trimmedValue}`;
  }

  if (trimmedValue.startsWith("uploads/")) {
    return `${BASE_URL}/${trimmedValue}`;
  }

  return `${BASE_URL}/${trimmedValue}`;
};

const extractList = (response: any) => {
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

export interface CropPayload {
  intFarmerId: number;
  nvcharCropName: string;
  intCropCategoryId: number;
  floatQuantity: number;
  floatPricePerKg: number;
  dtHarvestDate: string;
  nvcharDescription: string;
  nvcharLocation: string;
  intQualityGradeId: number;
  ynOrganic: boolean;
  nvcharCropImageUrl: string;
}

export const buyerCropService = {
  getCrops: async () => {
    const response = await api.get("/GettblCrop");
    return response.data;
  },

  getCropsByCategoryId: async (intCropCategoryId: number) => {
    const response = await api.post("/GettblCropByCategoryId", { intCropCategoryId });
    return response.data;
  },

  saveCrop: async (data: CropPayload) => {
    const response = await api.post("/savetblCrop", data);
    return response.data;
  },

  editCrop: async (data: Record<string, unknown>) => {
    const response = await api.post("/edittblCrop", data);
    return response.data;
  },

  deleteCrop: async (id: number) => {
    const response = await api.post("/deletetblCrop", { id });
    return response.data;
  },

  extractCropList: (response: any) => extractList(response),

  resolveCropImageUrl: (imageUrl?: string | null) => normalizeUrl(imageUrl),
};
