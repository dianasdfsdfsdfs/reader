/**
 * Доменная ошибка с HTTP-статусом.
 *
 * До этого каждый роут ловил исключение сам и возвращал `{ status: "error" }`
 * с кодом 200 — фронтенд не мог отличить успех от ошибки. Теперь сервисы
 * бросают AppError, а глобальный `.onError` в src/index.ts превращает его
 * в честный HTTP-статус.
 */
export class AppError extends Error {
    constructor(
        message: string,
        readonly status: number
    ) {
        super(message);
        this.name = "AppError";
    }
}

export const badRequest = (message: string) => new AppError(message, 400);
export const unauthorized = (message = "Unauthorized") => new AppError(message, 401);
export const forbidden = (message: string) => new AppError(message, 403);
export const notFound = (message: string) => new AppError(message, 404);
export const conflict = (message: string) => new AppError(message, 409);
