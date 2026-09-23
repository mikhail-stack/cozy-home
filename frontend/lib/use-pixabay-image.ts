"use client";

import { useEffect, useState } from "react";

interface PixabayImageResponse {
  url: string | null;
}

// Ходит на собственный /api/pixabay (не напрямую в Pixabay) — ключ
// остаётся на сервере, см. app/api/pixabay/route.ts.
export function usePixabayImage(query: string, seed = 0): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/pixabay?q=${encodeURIComponent(query)}&seed=${seed}`)
      .then((response) => response.json() as Promise<PixabayImageResponse>)
      .then((data) => {
        if (!cancelled) setUrl(data.url);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [query, seed]);

  return url;
}
