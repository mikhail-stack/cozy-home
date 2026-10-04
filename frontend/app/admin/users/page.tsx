"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore, type UserRole } from "@/store/auth.store";
import type { AdminUser } from "@/types/user";
import { Input } from "@/components/ui/Input";

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

// Реализовано (пункт 23, подэтап users): реальный GET/PATCH/DELETE
// /api/users вместо lib/mock-users.ts (там был выдуманный telegram:
// "@handle" и registeredAt — в БД только telegramChatId и createdAt).
// Поиск — на сервере (q), как в /admin/orders. Часть серверных правил
// (нельзя менять свою роль/удалять себя — backend/src/modules/users/)
// предупреждается на клиенте отключением своей строки; правило про
// «последнего администратора» клиенту заранее знать неоткуда — его
// 409-сообщение просто показывается как есть.
export default function AdminUsersPage() {
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (search.trim()) params.set("q", search.trim());

    let cancelled = false;

    apiFetch<UsersResponse>(`/users?${params.toString()}`)
      .then((result) => {
        if (cancelled) return;
        setUsers(result.users);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setUsers([]);
        setLoadError(
          error instanceof ApiError ? error.message : "Не удалось загрузить пользователей",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [search]);

  const handleRoleChange = (id: string, role: UserRole) => {
    setActionError(null);
    setPendingId(id);
    apiFetch<AdminUser>(`/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    })
      .then((updated) => {
        setUsers((current) => current?.map((user) => (user.id === id ? updated : user)) ?? current);
      })
      .catch((error: unknown) => {
        setActionError(error instanceof ApiError ? error.message : "Не удалось сменить роль");
      })
      .finally(() => setPendingId(null));
  };

  const handleDelete = (user: AdminUser) => {
    if (!window.confirm(`Удалить пользователя «${user.name}»?`)) return;
    setActionError(null);
    setPendingId(user.id);
    apiFetch<void>(`/users/${user.id}`, { method: "DELETE" })
      .then(() => {
        setUsers((current) => current?.filter((item) => item.id !== user.id) ?? current);
      })
      .catch((error: unknown) => {
        setActionError(
          error instanceof ApiError ? error.message : "Не удалось удалить пользователя",
        );
      })
      .finally(() => setPendingId(null));
  };

  return (
    <div className="flex flex-col gap-24">
      <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">Пользователи</h1>

      <label className="flex max-w-[320px] flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">
          Поиск по имени/email
        </span>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Анна или anna@..."
        />
      </label>

      {loadError && (
        <p className="font-lunar text-caption tracking-caption text-stone">{loadError}</p>
      )}
      {actionError && (
        <p className="font-lunar text-caption tracking-caption text-stone">{actionError}</p>
      )}

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
            {users === null && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-stone">
                  Загрузка…
                </td>
              </tr>
            )}
            {users?.map((user) => {
              const isSelf = user.id === currentUserId;
              const isPending = pendingId === user.id;
              return (
                <tr key={user.id} className="border-b border-ash">
                  <td className="py-8 pr-16">{user.name}</td>
                  <td className="py-8 pr-16">{user.email}</td>
                  <td className="py-8 pr-16">{user.telegramChatId ? "Привязан" : "Не привязан"}</td>
                  <td className="py-8 pr-16">
                    <select
                      value={user.role}
                      disabled={isSelf || isPending}
                      onChange={(event) =>
                        handleRoleChange(user.id, event.target.value as UserRole)
                      }
                      className="rounded-lg border border-graphite bg-ash px-12 py-4 font-lunar text-body-sm tracking-body-sm text-obsidian focus:border-cobalt-ink focus:outline-none disabled:opacity-50"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="py-8 pr-16">
                    {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="py-8">
                    <button
                      type="button"
                      disabled={isSelf || isPending}
                      onClick={() => handleDelete(user)}
                      className="hover:underline disabled:no-underline disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              );
            })}
            {users?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-stone">
                  Ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
