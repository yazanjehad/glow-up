export type SupportCategoryApi =
  | "PAYMENT_ISSUE"
  | "TECHNICAL_ISSUE"
  | "BOOKING_ISSUE"
  | "ACCOUNT_ISSUE"
  | "REPORT_PROVIDER"
  | "REPORT_EMPLOYEE"
  | "GENERAL_INQUIRY";

export const SUPPORT_CATEGORIES: SupportCategoryApi[] = [
  "PAYMENT_ISSUE",
  "TECHNICAL_ISSUE",
  "BOOKING_ISSUE",
  "ACCOUNT_ISSUE",
  "REPORT_PROVIDER",
  "REPORT_EMPLOYEE",
  "GENERAL_INQUIRY",
];
export type SupportStatusApi = "OPEN" | "CLOSED" | "RESOLVED";

export interface SupportMessageApiDto {
  _id: string;
  senderId: string;
  senderRole: string;
  message: string;
  isInternalNote: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportApiDto {
  _id: string;
  createdBy: string;
  createdByRole: string;
  status: SupportStatusApi;
  priority: string;
  category: SupportCategoryApi;
  subject: string;
  messages: SupportMessageApiDto[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface SupportUi {
  id: string;
  title: string;
  category: SupportCategoryApi;
  status: SupportStatusApi;
  lastMessage: string;
  createdAt: string;
}
export const mapApiToSupportUi = (dto: SupportApiDto): SupportUi => ({
  id: dto._id ?? "",
  title: dto.subject ?? "",
  category: dto.category,
  status: dto.status,
  lastMessage:
    dto.messages && dto.messages.length > 0
      ? dto.messages[dto.messages.length - 1].message
      : "",
  createdAt: dto.createdAt ?? "",
});
