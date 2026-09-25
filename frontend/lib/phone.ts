// Только украинские номера; единый вид ввода — «+380 50 123 45 67». Бэкенд
// нормализует по тем же правилам до +380501234567 (backend/src/lib/phone.ts).

// Маска ввода: понимает вставку и ввод в любом виде (0501234567, 380501234567,
// +380 50 123 45 67) и всегда возвращает «+380 XX XXX XX XX» (по мере набора —
// его начало). Удаление по одному символу работает: форматирующие пробелы
// пересобираются из цифр.
export function formatPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("0")) digits = `38${digits}`;
  // Начало «3», «38», «380» — это уже набор кода страны, иначе добавляем его сами.
  else if (!"380".startsWith(digits.slice(0, 3))) digits = `380${digits}`;
  digits = digits.slice(0, 12);

  const groups = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 8), digits.slice(8, 10)];
  return `+${[...groups, digits.slice(10, 12)].filter(Boolean).join(" ")}`;
}

// Соответствует маске выше и бэкенду: код страны 380, дальше код региона/
// оператора 3x–9x и ещё 7 цифр.
export const PHONE_PATTERN = "\\+380 [3-9]\\d \\d{3} \\d{2} \\d{2}";

export const isValidPhone = (value: string) => new RegExp(`^${PHONE_PATTERN}$`).test(value);
