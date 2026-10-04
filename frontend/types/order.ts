// Форма ответа backend (backend/src/modules/orders/) — один тип на
// GET /api/orders/my (без `user`) и на админский GET /api/orders/:id
// (с `user`, когда заказ оформлен не гостем).
export type OrderStatus = "new" | "processing" | "done" | "cancelled";

export interface OrderItemLine {
  quantity: number;
  price: number;
  product: { id: string; name: string; images: string[] };
}

export interface Order {
  id: string;
  number: number;
  name: string;
  phone: string;
  comment: string | null;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
  items: OrderItemLine[];
  user?: { id: string; name: string; email: string } | null;
}
