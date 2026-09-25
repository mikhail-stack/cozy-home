// Магазин работает по Украине — принимаем только украинские номера и храним
// в одном каноническом виде +380XXXXXXXXX, как бы их ни ввели: +380501234567,
// 380501234567, 0501234567, (050) 123-45-67 и т.п. Так в БД, админке, поиске
// и уведомлениях один формат.
const UA_PHONE = /^380[3-9]\d{8}$/;

export function normalizeUaPhone(input: string): string | null {
  const value = input.trim();
  // «+» — только в начале; кроме цифр допустимы пробелы, дефисы, скобки, точки.
  if (!/^\+?[\d\s\-().]+$/.test(value)) return null;

  const digits = value.replace(/\D/g, "");
  let full: string;
  if (digits.startsWith("380")) {
    full = digits;
  } else if (value.startsWith("+")) {
    return null;
  } else if (digits.startsWith("80")) {
    full = `3${digits}`;
  } else if (digits.startsWith("0")) {
    full = `38${digits}`;
  } else {
    return null;
  }

  return UA_PHONE.test(full) ? `+${full}` : null;
}
