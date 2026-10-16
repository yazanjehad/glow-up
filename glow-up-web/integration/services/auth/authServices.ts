import { OTP_TOKEN_KEY, TOKEN_KEY } from "@/app/models/constants";
import { post, get ,patch} from "../../http/http.client";
import type {
  RequestOtpResponseDto,
  VerifyOtpResponsedDto,
  CreateProfileResponseDto,
  ProfileDto,
  RequestOTPDto,
  VerifyOTPDto,
  ProviderProfileDto,
} from "./auth.types";

export const PROVIDER_ID_KEY = "providerId";

function getTokenLS(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export const authServices = {
  requestOTP: async (data: RequestOTPDto): Promise<boolean> => {
    const apiResponse = await post("/auth/otp/request", data);
    const responseData: RequestOtpResponseDto =
      (await apiResponse.data) as RequestOtpResponseDto;
    return !!responseData.message;
  },
  updateProviderProfile: async (data: Partial<ProviderProfileDto>) => {
  const token = getTokenLS();
  const providerId = localStorage.getItem(PROVIDER_ID_KEY);

  if (!providerId) {
    throw new Error("Provider ID not found");
  }

  const apiResponse = await patch(
    `/providers/${providerId}`,
    data,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  const responseData = apiResponse.data;

  // تحديث provider المخزن في localStorage
  const storedProvider = localStorage.getItem("provider");
  if (storedProvider) {
    const provider = JSON.parse(storedProvider);
    const updatedProvider = { ...provider, ...data };
    localStorage.setItem("provider", JSON.stringify(updatedProvider));
  }

  return responseData;
},

  getProviderMe: async (): Promise<any> => {
    const token = getTokenLS();
    const apiResponse = await get("/providers/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return apiResponse.data;
  },

  verifyOTP: async (data: VerifyOTPDto): Promise<VerifyOtpResponsedDto> => {
    const apiResponse = await post("/auth/customer/verify-otp", data);
    const responseData: VerifyOtpResponsedDto =
      apiResponse.data as VerifyOtpResponsedDto;

    if (responseData.nextAction === "LOGIN" && responseData.accessToken) {
      localStorage.setItem(TOKEN_KEY, responseData.accessToken);
      localStorage.setItem("user", JSON.stringify(responseData.user));

      // Handle EMPLOYEE login - store providerId from user data
      const userRole = responseData.user?.role;
      if (userRole === "EMPLOYEE") {
        const providerId = responseData.user?.providerId || "";
        if (providerId) {
          localStorage.setItem(PROVIDER_ID_KEY, providerId);
        }
      }
    }

    return responseData;
  },

  verifyProviderOTP: async (
    data: VerifyOTPDto,
  ): Promise<VerifyOtpResponsedDto> => {
    const apiResponse = await post("/auth/provider/verify-otp", data);
    const responseData: VerifyOtpResponsedDto =
      apiResponse.data as VerifyOtpResponsedDto;

    // CREATE_ACCOUNT
    if (responseData.nextAction === "CREATE_ACCOUNT" && responseData.otpToken) {
      localStorage.setItem(OTP_TOKEN_KEY, responseData.otpToken ?? "");
      localStorage.setItem("user", JSON.stringify(responseData.user));
      localStorage.removeItem(PROVIDER_ID_KEY);
      return responseData;
    }

    if (responseData.nextAction === "LOGIN" && responseData.accessToken) {
      localStorage.setItem(TOKEN_KEY, responseData.accessToken);
      localStorage.setItem("user", JSON.stringify(responseData.user));

      const userRole = responseData.user?.role;

      if (userRole === "EMPLOYEE") {
        // Employee login - store providerId from user data
        const providerId = responseData.user?.providerId || "";
        if (providerId) {
          localStorage.setItem(PROVIDER_ID_KEY, providerId);
        }
      } else {
        // Provider login - fetch provider details
        try {
          const provider = await authServices.getProviderMe();
          const providerId = provider?._id || "";

          localStorage.setItem(PROVIDER_ID_KEY, providerId);
          localStorage.setItem("provider", JSON.stringify(provider));
        } catch (err) {
          console.error(" Failed to fetch /providers/me", err);
          localStorage.removeItem(PROVIDER_ID_KEY);
        }
      }
    }

    return responseData;
  },

  createCustomerProfile: async (
    data: ProfileDto,
    otpToken: string,
  ): Promise<CreateProfileResponseDto> => {
    const apiResponse = await post("/auth/customer/create-profile", data, {
      headers: {
        Authorization: `Bearer ${otpToken}`,
      },
    });

    const responseData: CreateProfileResponseDto =
      (await apiResponse.data) as CreateProfileResponseDto;

    localStorage.setItem(TOKEN_KEY, responseData.accessToken);
    localStorage.setItem("user", JSON.stringify(responseData.user));
    return responseData;
  },

  createProviderProfile: async (
    data: ProviderProfileDto,
  ): Promise<CreateProfileResponseDto> => {
    const apiResponse = await post("/auth/provider/create-profile", data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(OTP_TOKEN_KEY)}`,
      },
    });

    const responseData: CreateProfileResponseDto =
      (await apiResponse.data) as CreateProfileResponseDto;

    localStorage.setItem(TOKEN_KEY, responseData.accessToken);
    localStorage.setItem("user", JSON.stringify(responseData.user));

    try {
      const provider = await authServices.getProviderMe();
      const providerId = provider?._id || "";
      localStorage.setItem(PROVIDER_ID_KEY, providerId);
      localStorage.setItem("provider", JSON.stringify(provider));
    } catch (err) {
      console.error(
        "❌ Failed to fetch /providers/me after create profile",
        err,
      );
      localStorage.removeItem(PROVIDER_ID_KEY);
    }

    return responseData;
  },
};

export const getToken = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
};

export const getProviderId = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PROVIDER_ID_KEY) || "";
};


/** استخراج userId من الـ JWT (نفس اللي الباكند يستخدمه لـ senderId) */
function getUserIdFromToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload)) as { userId?: string; sub?: string };
    const id = decoded?.userId ?? decoded?.sub ?? null;
    return id != null ? String(id) : null;
  } catch {
    return null;
  }
}

/** معرف المستخدم الحالي — نفضل من التوكن عشان يطابق senderId اللي الباكند يرجعه */
export function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  const fromToken = getUserIdFromToken();
  if (fromToken) return fromToken;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw) as { id?: string; _id?: string; userId?: string; sub?: string };
    const id = u?.id ?? u?._id ?? u?.userId ?? u?.sub ?? null;
    return id != null ? String(id) : null;
  } catch {
    return null;
  }
}
