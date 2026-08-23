export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Student';
  department?: string | null;
  microsoftId?: string | null;
}

export interface Category {
  id: number;
  name: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  department?: string | null;
  discountPct?: number | null;
  categoryId: number;
  category?: Category;
  createdBy?: number | null;
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: number;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: Product;
}

export interface Order {
  id: number;
  userId: number;
  totalPrice: number;
  discountApplied: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  items: OrderItem[];
  user?: {
    id: number;
    name: string;
    email: string;
    department?: string | null;
  };
}
