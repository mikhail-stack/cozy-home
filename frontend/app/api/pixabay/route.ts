import { NextRequest, NextResponse } from "next/server";

const PIXABAY_ENDPOINT = "https://pixabay.com/api/";

interface PixabayHit {
  webformatURL: string;
}

interface PixabayResponse {
  hits: PixabayHit[];
}

// Прокси к Pixabay: ключ живёт только на сервере (PIXABAY_API_KEY в
// .env.local), в браузер уходит только готовый URL картинки. Временное
// решение для фото товаров/Hero, пока нет реального аплоада в Cloudinary
// (backend, пункт 16 плана).
export async function GET(request: NextRequest) {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ url: null });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const seed = Number(searchParams.get("seed") ?? "0");

  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    image_type: "photo",
    // Оттенки серого — чтобы фото не ломало монохромную дизайн-систему
    // случайным ярким цветом (docs/DESIGN.md запрещает акцентные цвета).
    colors: "grayscale",
    safesearch: "true",
    per_page: "20",
  });

  const response = await fetch(`${PIXABAY_ENDPOINT}?${params.toString()}`, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return NextResponse.json({ url: null });
  }

  const data = (await response.json()) as PixabayResponse;

  if (data.hits.length === 0) {
    return NextResponse.json({ url: null });
  }

  const hit = data.hits[seed % data.hits.length];
  return NextResponse.json({ url: hit.webformatURL });
}
