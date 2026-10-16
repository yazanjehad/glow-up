import { get, post } from "../../http/http.client";
import { DeleteOTPResponse } from "./user.types";


export const UserPackagesService = {

  async RequestDeleteOTP(): Promise<DeleteOTPResponse> {
    const res = await post<DeleteOTPResponse>(
      `/users/me/delete/request-otp`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  },
  async VerifyDeleteOTP(code: string, reason: string): Promise<DeleteOTPResponse> {
    const res = await post<DeleteOTPResponse>(
      `/users/me/delete`,
      {
        code: code,
        reason: reason,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  },
};
