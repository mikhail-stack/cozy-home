"use client";

import { useState } from "react";
import { MOCK_ADMIN_USERS, type AdminUser } from "@/lib/mock-users";
import type { UserRole } from "@/store/auth.store";

// Данные — мок, смена роли и удаление не сохраняются между
// перезагрузками. Реальные пользователи появятся с Users-модулем
// backend (пункт 20 плана).
export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_ADMIN_USERS);

  const handleRoleChange = (id: string, role: UserRole) => {
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, role } : user)));
  };

  const handleDelete = (user: AdminUser) => {
    if (window.confirm(`Удалить пользователя «${user.name}»?`)) {
      setUsers((current) => current.filter((item) => item.id !== user.id));
    }
  };

  return (
    <div className="flex flex-col gap-24">
      <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">Пользователи</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-lunar text-body-sm tracking-body-sm text-obsidian">
          <thead>
            <tr className="border-b border-ash text-left">
              <th className="py-8 pr-16">Имя</th>
              <th className="py-8 pr-16">Email</th>
              <th className="py-8 pr-16">Telegram</th>
              <th className="py-8 pr-16">Роль</th>
              <th className="py-8 pr-16">Дата регистрации</th>
              <th className="py-8">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-ash">
                <td className="py-8 pr-16">{user.name}</td>
                <td className="py-8 pr-16">{user.email}</td>
                <td className="py-8 pr-16">{user.telegram ?? "—"}</td>
                <td className="py-8 pr-16">
                  <select
                    value={user.role}
                    onChange={(event) => handleRoleChange(user.id, event.target.value as UserRole)}
                    className="rounded-lg border border-graphite bg-ash px-12 py-4 font-lunar text-body-sm tracking-body-sm text-obsidian focus:border-cobalt-ink focus:outline-none"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="py-8 pr-16">{user.registeredAt}</td>
                <td className="py-8">
                  <button type="button" onClick={() => handleDelete(user)} className="hover:underline">
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
