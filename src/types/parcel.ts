export type TPaymentData = {
  email: string;
  amount: number;
  parcelId: string;
};

export type TParcelData = {
  type: string;
  name: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  description?: string;
};

export type TShipdayParcelData = {
  orderNumber: string;
  customerName: string;
  customerAddress: any;
  customerEmail: string;
  customerPhoneNumber: string;
  restaurantName: string;
  restaurantAddress: any;
  restaurantPhoneNumber: string;
  totalOrderCost: number;
};

