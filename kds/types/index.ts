export interface OrderItem {
  index: number;
  name: string;
  qty: number;
  note: string;
  modifiers: string;
  completed?: boolean;
}

export interface Order {
  id: string;
  created_at: string;
  state: string;
  ticket_name: string;
  items: OrderItem[];
}
