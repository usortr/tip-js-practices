export class ApiError extends Error {
  constructor(message, { kind, status = null, code = null, details = null, url = null, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

export function buildUrl(baseUrl, path, query = {}) {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(cleanPath, base);
  
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, String(value));
    }
  }
  return url.toString();
}

export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 2000 } = {}) {
  if (typeof baseUrl !== "string") {
    throw new TypeError("Некорректный baseUrl");
  }
  
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new TypeError("Некорректный baseUrl");
  }
  
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("Некорректный baseUrl");
  }
  if (url.search) {
    throw new TypeError("Некорректный baseUrl");
  }
  if (typeof fetchFn !== "function") {
    throw new TypeError("Некорректный fetchFn");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("Некорректный timeoutMs");
  }

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return {
    async requestJson(path, { query = {}, signal: externalSignal, timeoutMs: customTimeout } = {}) {
      const url = buildUrl(normalizedBaseUrl, path, query);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), customTimeout ?? timeoutMs);
      
      if (externalSignal) {
        externalSignal.addEventListener("abort", () => controller.abort());
      }

      try {
        const response = await fetchFn(url, {
          method: "GET",
          headers: { "Accept": "application/json" },
          signal: controller.signal,
        });

        if (!response || typeof response.ok !== "boolean" || !response.headers) {
          throw new ApiError("Неверный формат ответа от fetch", { kind: "invalid-response", url });
        }

        if (response.status === 204) {
          return null;
        }

        if (!response.ok) {
          let details = null;
          let code = null;
          let message = `HTTP ошибка: ${response.status}`;
          
          try {
            const errorData = await response.clone().json();
            if (errorData && typeof errorData === "object") {
              const err = errorData.error !== undefined ? errorData.error : errorData;
              code = err.code !== undefined ? err.code : null;
              details = err.details !== undefined ? err.details : null;
              if (typeof err.message === "string") {
                message = err.message;
              }
            }
          } catch {
            // Игнорируем ошибку парсинга JSON для HTTP-ошибки
          }
          
          throw new ApiError(message, {
            kind: "http",
            status: response.status,
            code,
            details,
            url,
          });
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new ApiError("Неверный формат ответа: ожидается application/json", {
            kind: "invalid-response",
            url,
          });
        }

        return await response.json();
      } catch (error) {
        if (error.name === "AbortError") {
          const kind = externalSignal?.aborted ? "aborted" : "timeout";
          throw new ApiError(kind === "timeout" ? "Превышено время ожидания" : "Запрос отменён", {
            kind,
            url,
            cause: error,
          });
        }
        if (error instanceof TypeError) {
          throw new ApiError("Сетевая ошибка", { kind: "network", url, cause: error });
        }
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError("Неизвестная ошибка при выполнении запроса", { kind: "invalid-response", url, cause: error });
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };
}