export const MIN_PASSWORD_LENGTH = 8;

// Общие клиентские проверки для /register и /reset-password — тексты
// ошибок дословно из docs/cozy-home-tz.md, раздел 6.
export function getPasswordError(password: string, confirmPassword: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return "Пароль должен содержать минимум 8 символов";
  }
  if (password !== confirmPassword) {
    return "Пароли не совпадают";
  }
  return null;
}
