"use client";

import { useEffect } from "react";
import { refreshSession } from "@/lib/api";

// При полной перезагрузке страницы auth.store пуст (access token
// сознательно не в localStorage — см. CLAUDE.md), а refresh-кука уже может
// быть на сервере. Рендерится один раз в корневом layout, ничего не
// выводит — просто пробует восстановить сессию, чтобы Header сразу показал
// «Имя» вместо «Войти», если refresh-кука ещё действует.
export function SessionBootstrap() {
  useEffect(() => {
    void refreshSession();
  }, []);

  return null;
}
