export interface Customer {
  id?: string;
  name: string;
  phone?: string;
  defaultTara: number;
  defaultPrice: number;
  debtAmount?: number;
  createdAt: number;
}

export interface AppSettings {
  companyName: string;
  logoUrl: string;
  adminPhones?: string;
}

export interface Transaction {
  id: string;
  customerId?: string;
  customerName: string;
  date: string;
  time: string;
  weights: number[];
  grossWeight: number;
  taraPercentage: number;
  taraWeight: number;
  netWeight: number;
  pricePerKg: number;
  totalPrice: number;
  footnote?: string;
  isDebt?: boolean;
  createdAt: number;
}

export interface Payment {
  id?: string;
  customerId: string;
  amount: number;
  type: 'debt' | 'payment';
  date: string;
  time: string;
  notes: string;
  photoUrl?: string;
  createdAt: number;
}
