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

const extractData = (response: any) => response?.data ?? response;

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

  if (Array.isArray(response?.data?.rows)) {
    return response.data.rows;
  }

  if (response?.status === "success" && Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

const pickString = (...values: any[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
};

export interface AddCropPayload {
  intFarmerId: number;
  nvcharCropName: string;
  intCropCategoryId: number;
  floatQuantity: number;
  floatPricePerKg: number;
  dtHarvestDate: string;
  nvcharDescription: string;
  nvcharLocation: string;
  floatLatitude?: number | null;
  floatLongitude?: number | null;
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
    // ✅ Correct field name from API docs: intCropId (not crop_id)
    formData.append("intCropId", String(cropId));

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

    // ✅ Correct endpoint from API docs: /uploadtblCropImageWithMeta (not /uploadCropImage)
    const response = await api.post("/uploadtblCropImageWithMeta", formData, {
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

  getCropCategories: async () => {
    try {
      const response = await api.get("/GetmstCropCategory");
      return response.data;
    } catch (error) {
      console.error("Get Crop Categories API Error:", error);
      throw error;
    }
  },

  getCropImages: async () => {
    try {
      const response = await api.get("/GettblCropImages");
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        // Endpoint missing on this backend; treat as empty list.
        return { status: "not found", data: [] };
      }
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
    return extractList(response);
  },

  extractCropCategories: (response: any) => {
    return extractList(response);
  },

  extractImageUrl: (record: any) => {
    const raw = pickString(
      record?.nvcharImageUrl,
      record?.nvcharImageURL,
      record?.imageUrl,
      record?.imageURL,
      record?.nvcharCropImageUrl,
      record?.nvcharCropImageURL,
      record?.cropImageUrl,
      record?.crop_image_url,
      record?.url,
      record?.fileUrl,
      record?.path,
      record?.file_path,
      record?.image_path
    );

    return normalizeUrl(raw);
  },

  resolveCropImageUrl: (imageUrl?: string | null) => normalizeUrl(imageUrl),
};
