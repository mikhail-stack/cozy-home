// Форма ответа backend (GET/PUT /api/about, backend/src/modules/about/).
export interface AboutAdvantage {
  icon: string;
  title: string;
  text: string;
}

export interface AboutContent {
  title: string;
  description: string;
  advantages: AboutAdvantage[];
  phone: string;
  email: string;
  updatedAt: string | null;
}
