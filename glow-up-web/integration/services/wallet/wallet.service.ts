import { get, post } from "@/integration/http/http.client";

export interface WalletTransaction {
  amount: number;
  type: "CREDIT" | "DEBIT";
  description: string;
  createdAt: string;
}

export interface WalletResponse {
  userId: string;
  balance: number;
  transactions: WalletTransaction[];
}

export interface AddMoneyRequest {
  amount: number;
  description: string;
}

export const WalletService = {
  getWallet: async (): Promise<WalletResponse> => {
    const response = await get<WalletResponse>("/wallet/me");
    return response.data;
  },

  addMoney: async (data: AddMoneyRequest): Promise<WalletResponse> => {
    const response = await post<WalletResponse>("/wallet/add", data);
    return response.data;
  },
};
