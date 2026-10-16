import { post, get, del } from "@/integration/http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";
import type { UploadedFileDto, UploadFileParams } from "./files.types";

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  const cleanToken = token.replace(/"/g, "");
  return cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {};
}

export const filesService = {
  uploadProviderCover: async (
    providerId: string,
    file: File,
  ): Promise<UploadedFileDto> => {
    return filesService.uploadFile({
      file,
      entityType: "PROVIDER",
      entityId: providerId,
      fileCategory: "cover",
    });
  },
  uploadFile: async (params: UploadFileParams): Promise<UploadedFileDto> => {
    const form = new FormData();

    form.append("file", params.file);

    form.append("entityType", params.entityType);
    form.append("entityId", params.entityId);
    form.append("fileCategory", params.fileCategory);

    if (params.meta) {
      for (const [k, v] of Object.entries(params.meta)) {
        if (v !== undefined && v !== null) form.append(k, String(v));
      }
    }

    const res = await post<UploadedFileDto>("/files/upload", form, {
      headers: {
        ...authHeader(),
      },
    });

    return (res as any).data?.data ?? res.data ?? res;
  },

  uploadProviderGallery: async (
    providerId: string,
    file: File,
  ): Promise<UploadedFileDto> => {
    return filesService.uploadFile({
      file,
      entityType: "PROVIDER",
      entityId: providerId,
      fileCategory: "gallery",
    });
  },
  getPublicFile: async (path: string): Promise<any> => {
    const res = await get(`/files/public`, {
      params: { path },
      headers: authHeader(),
    });

    return (res as any).data?.data ?? res.data ?? res;
  },
  deleteProviderImage: async (
    providerId: string,
    blobPath: string,
  ): Promise<any> => {
    const res = await del("/files/provider-file", {
      data: {
        providerId: providerId,
        fileCategory: "gallery",
        blobPath: blobPath,
      },
      headers: authHeader(),
    });
    return res.data;
  },
  deleteProviderFile: async (params: {
    providerId: string;
    fileCategory: "gallery" | "document";
    blobPath: string;
  }): Promise<any> => {
    const res = await del("/files/provider-file", {
      data: {
        providerId: params.providerId,
        fileCategory: params.fileCategory,
        blobPath: params.blobPath,
      },
      headers: authHeader(),
    });
    return res.data;
  },
  uploadEmployeeProfile: async (
    employeeId: string,
    file: File,
  ): Promise<UploadedFileDto> => {
    return filesService.uploadFile({
      file,
      entityType: "EMPLOYEE",
      entityId: employeeId,
      fileCategory: "profile",
    });
  },
};
