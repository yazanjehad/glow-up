export type SalonDetails = {
  id: string;
  name: string;

  description?: string;

  rating: number;
  reviews: number;

  isOpen: boolean;
  openUntil?: string;

  servesMen?: boolean;
  servesWomen?: boolean;

  location?: string;
};

export type OrderServiceItem = {
  id: string;
  name: string;
  price: number;
};

export type OrderPackageItem = {
  id: string;
  name: string;
  price: number;
};

export type BookingOrderDetails = {
  services: OrderServiceItem[];
  packages?: OrderPackageItem[];

  subtotal?: number;
  tax?: number;
  discount?: number;
  totalPrice: number;
  totalDuration: number;
};
