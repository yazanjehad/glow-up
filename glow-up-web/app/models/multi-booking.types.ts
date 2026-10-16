export type TimeSlot = {
  start: string;
  end: string;
};

export type MultiBookingItem = {
  serviceId: string;
  employeeId: string;
  date: string;
  timeSlot: TimeSlot;
  numberOfCustomers?: number;

};

export type MultiBookingInitPayload = {
  providerId: string;
  serviceIds: string[];
};
