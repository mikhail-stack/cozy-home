"use client";

import { useEffect } from "react";
import { refreshSession } from "@/lib/api";
import { loadServerCart } from "@/store/cart.store";

// При полной перезагрузке страницы auth.store пуст (access token
// сознательно не в localStorage — см. CLAUDE.md), а refresh-кука уже может
// быть на сервере. Рендерится один раз в корневом layout, ничего не
// выводит — просто пробует восстановить сессию, чтобы Header сразу показал
// «Имя» вместо «Войти», если refresh-кука ещё действует. Вместе с сессией
// подтягивается и серверная корзина — иначе после перезагрузки страницы
// авторизованный пользователь увидел бы пустую/устаревшую локальную корзину
// вместо настоящей.
export function SessionBootstrap() {
  useEffect(() => {
    void refreshSession().then((restored) => {
      if (restored) void loadServerCart();
    });
  }, []);

  return null;
}
