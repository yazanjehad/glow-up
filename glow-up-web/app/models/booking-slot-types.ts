export type SlotStatus = "available" | "unavailable";

// Booking slot day item type -- DayPill component uses this
export type DayItem = {
  id: string;
  dayKey: string;
  date: number;
  status: SlotStatus;
};
// Booking slot time item type -- TimePill component uses this
export type TimeItem = {
  id: string;
  label: string;
  status: SlotStatus;
};
