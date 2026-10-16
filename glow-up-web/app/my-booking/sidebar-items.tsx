import { CalendarCheck, Clock, Archive, XCircle } from "lucide-react";

export const bookingsMenuItems = [
  { label: "bookings.all",      href: "/my-booking",                 icon: CalendarCheck },
  { label: "bookings.current",  href: "/my-booking?status=current",  icon: Clock },
  { label: "bookings.previous", href: "/my-booking?status=previous", icon: Archive },
  { label: "bookings.canceled", href: "/my-booking?status=canceled", icon: XCircle },
] as const;
