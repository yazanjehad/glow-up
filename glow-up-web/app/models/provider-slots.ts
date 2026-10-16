export type WeekDay =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";
export interface ProviderSlotItemDto {
  time: string;
  available: boolean;
}

export interface ProviderSlotsDayDto {
  date: string;
  day: WeekDay;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slotDuration: number;
  slots: ProviderSlotItemDto[];
}

export type GetProviderSlotsResponseDto = ProviderSlotsDayDto; //provider-slots.ts
