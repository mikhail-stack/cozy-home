// Ошибка с HTTP-статусом: error.middleware превращает её в ответ
// { message }, который фронтенд читает в lib/api.ts.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
