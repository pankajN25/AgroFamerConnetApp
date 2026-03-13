import axios from "axios";
import { Platform } from "react-native";

const BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
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
    return trimmedValue;
  }

  if (trimmedValue.startsWith("/")) {
    return `${BASE_URL}${trimmedValue}`;
  }

  if (trimmedValue.startsWith("uploads/")) {
    return `${BASE_URL}/${trimmedValue}`;
  }

  return `${BASE_URL}/${trimmedValue}`;
};

const extractData = (response: any) => response?.data ?? response;

export interface AddCropPayload {
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

export const cropService = {
  addCrop: async (data: AddCropPayload) => {
    try {
      const response = await api.post("/savetblCrop", data);
      return response.data;
    } catch (error) {
      console.error("Add Crop API Error:", error);
      throw error;
    }
  },

  editCrop: async (data: Record<string, unknown>) => {
    try {
      const response = await api.post("/edittblCrop", data);
      return response.data;
    } catch (error) {
      console.error("Edit Crop API Error:", error);
      throw error;
    }
  },

  uploadCropImage: async (imageUri: string, cropId: number) => {
    const formData = new FormData();
    formData.append("crop_id", String(cropId));

    if (Platform.OS === "web") {
      const res = await fetch(imageUri);
      const blob = await res.blob();
      formData.append("image", blob, "crop.jpg");
    } else {
      const filename = imageUri.split("/").pop() || "crop.jpg";
      formData.append(
        "image",
        { uri: imageUri, name: filename, type: "image/jpeg" } as any
      );
    }

    const response = await api.post("/uploadCropImage", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  getCrops: async () => {
    try {
      const response = await api.get("/GettblCrop");
      return response.data;
    } catch (error) {
      console.error("Get Crops API Error:", error);
      throw error;
    }
  },

  getCropImages: async () => {
    try {
      const response = await api.get("/GettblCropImages");
      return response.data;
    } catch (error) {
      console.error("Get Crop Images API Error:", error);
      throw error;
    }
  },

  getCropImagesByCropId: async (cropId: number) => {
    try {
      const response = await api.post("/GettblCropImagesByCropId", { intCropId: cropId });
      return response.data;
    } catch (error) {
      console.error("Get Crop Images By Crop Id API Error:", error);
      throw error;
    }
  },

  deleteCrop: async (cropId: number) => {
    try {
      const response = await api.post("/deletetblCrop", { id: cropId });
      return response.data;
    } catch (error) {
      console.error("Delete Crop API Error:", error);
      throw error;
    }
  },

  extractCropRecord: (response: any) => {
    const data = extractData(response);

    if (Array.isArray(data)) {
      return data[0] ?? null;
    }

    if (data && typeof data === "object") {
      if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
        return data.data;
      }

      return data;
    }

    return null;
  },

  extractCropId: (response: any) => {
    const record = cropService.extractCropRecord(response);
    const id = record?.id ?? record?.intCropId ?? response?.id ?? response?.data?.id;
    return typeof id === "number" ? id : Number(id);
  },

  extractUploadedImageUrl: (response: any) => {
    const data = extractData(response);

    return (
      data?.url ||
      data?.imageUrl ||
      data?.nvcharImageUrl ||
      data?.fileUrl ||
      data?.path ||
      data?.file_path ||
      data?.image_path ||
      response?.url ||
      response?.imageUrl ||
      null
    );
  },

  extractCropImages: (response: any) => {
    const data = extractData(response);

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  },

  resolveCropImageUrl: (imageUrl?: string | null) => normalizeUrl(imageUrl),
};
