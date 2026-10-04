import type { UserRole } from "@/store/auth.store";

// Форма строки из GET /api/users (backend/src/modules/users/) — без
// телефона и хеша пароля, не возвращаются списком. В БД нет @username,
// только telegramChatId (есть/нет, не сам хендл).
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  telegramChatId: string | null;
  role: UserRole;
  createdAt: string;
}
