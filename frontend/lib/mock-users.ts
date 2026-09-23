import type { UserRole } from "@/store/auth.store";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  telegram: string | null;
  role: UserRole;
  registeredAt: string;
}

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: "1",
    name: "Анна Коваленко",
    email: "anna@example.com",
    telegram: null,
    role: "user",
    registeredAt: "2026-08-29",
  },
  {
    id: "2",
    name: "Игорь Петренко",
    email: "igor@example.com",
    telegram: "@igorpetrenko",
    role: "user",
    registeredAt: "2026-08-15",
  },
  {
    id: "3",
    name: "Мария Савчук",
    email: "admin@cozyhome.ua",
    telegram: "@maria_admin",
    role: "admin",
    registeredAt: "2026-08-01",
  },
];
