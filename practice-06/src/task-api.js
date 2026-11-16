import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(
    value && typeof value === "object" &&
    isPositiveSafeInteger(value.id) &&
    typeof value.title === "string" && value.title.trim().length >= 1 && value.title.trim().length <= 100 &&
    typeof value.completed === "boolean" &&
    ALLOWED_PRIORITIES.has(value.priority) &&
    isPositiveSafeInteger(value.categoryId)
  );
}

export function isCategory(value) {
  return Boolean(
    value && typeof value === "object" &&
    isPositiveSafeInteger(value.id) &&
    typeof value.name === "string" && value.name.trim().length >= 1 && value.name.trim().length <= 100
  );
}

function validateTasksArray(tasks) {
  if (!Array.isArray(tasks)) throw invalidResponse("Ожидался массив задач");
  const ids = new Set();
  for (const task of tasks) {
    if (!isTask(task)) throw invalidResponse("Неверная схема задачи");
    if (ids.has(task.id)) throw invalidResponse("Повторяющийся id задачи");
    ids.add(task.id);
  }
  return tasks;
}

function validateCategoriesArray(categories) {
  if (!Array.isArray(categories)) throw invalidResponse("Ожидался массив категорий");
  const ids = new Set();
  for (const cat of categories) {
    if (!isCategory(cat)) throw invalidResponse("Неверная схема категории");
    if (ids.has(cat.id)) throw invalidResponse("Повторяющийся id категории");
    ids.add(cat.id);
  }
  return categories;
}

function validateFilters(filters) {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("Фильтры должны быть объектом");
  }
  const normalized = {};
  for (const key of Object.keys(filters)) {
    if (!ALLOWED_FILTERS.has(key)) throw new TypeError(`Неизвестный фильтр: ${key}`);
    const value = filters[key];
    if (key === "completed" && typeof value !== "boolean") throw new TypeError("completed должен быть boolean");
    if (key === "priority" && !ALLOWED_PRIORITIES.has(value)) throw new TypeError("Недопустимый приоритет");
    if (key === "categoryId" && !isPositiveSafeInteger(value)) throw new TypeError("Недопустимый categoryId");
    if (key === "q") {
      if (typeof value !== "string") throw new TypeError("q должен быть строкой");
      normalized.q = value.trim();
      if (normalized.q.length > 100) throw new TypeError("q не длиннее 100 символов");
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

function unwrapEntity(value) {
  let current = value;

  for (let i = 0; i < 3; i += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      break;
    }

    if (current.data !== undefined) {
      current = current.data;
      continue;
    }

    if (current.task !== undefined) {
      current = current.task;
      continue;
    }

    if (current.item !== undefined) {
      current = current.item;
      continue;
    }

    if (current.result !== undefined) {
      current = current.result;
      continue;
    }

    break;
  }

  return current;
}

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("Некорректный клиент API");
  }

  return {
    async getTasks(filters = {}, { signal } = {}) {
      const query = validateFilters(filters);
      const response = await client.requestJson("/tasks", { query, signal });
      const rawTasks = response.data ?? response.tasks;
      if (!Array.isArray(rawTasks)) throw invalidResponse("Ожидался массив задач");
      if (!response.meta || typeof response.meta.total !== "number") throw invalidResponse("Неверная структура meta");
      const tasks = validateTasksArray(rawTasks);
      if (response.meta.total !== tasks.length) throw invalidResponse("meta.total не совпадает с длиной");
      return { tasks, meta: response.meta };
    },

    async getTaskById(id, { signal } = {}) {
      if (!isPositiveSafeInteger(id)) throw new TypeError("Некорректный id задачи");
      const response = await client.requestJson(`/tasks/${id}`, { signal });
      const rawTask = response.data ?? response.task ?? response;
      if (!isTask(rawTask)) throw invalidResponse("Неверная схема задачи");
      return rawTask;
    },

    async getCategories({ signal } = {}) {
      const response = await client.requestJson("/categories", { signal });
      const rawCategories = Array.isArray(response) ? response : (response.data ?? response.categories ?? []);
      return validateCategoriesArray(rawCategories);
    },

    async loadInitialData(filters = {}, { signal } = {}) {
      const [tasksResult, categories] = await Promise.all([
        this.getTasks(filters, { signal }),
        this.getCategories({ signal }),
      ]);
      return { tasks: tasksResult.tasks, categories, meta: tasksResult.meta };
    },

    async createTask(draft, { signal } = {}) {
      if (!draft || typeof draft !== "object") {
        throw new TypeError("Некорректный черновик");
      }

      const body = {
        title: String(draft.title ?? "").trim(),
        priority: draft.priority,
        categoryId: Number(draft.categoryId),
      };

      console.debug("[PR6] createTask body:", body);

      const response = await client.requestJson("/tasks", {
        method: "POST",
        body,
        signal,
      });

      console.debug("[PR6] createTask raw response:", response);

      const rawTask = unwrapEntity(response);

      console.debug("[PR6] createTask unwrapped task:", rawTask);

      if (!isTask(rawTask)) {
        throw invalidResponse("Неверная схема созданной задачи");
      }

      return rawTask;
    },

    async updateTask(id, changes, { signal } = {}) {
      if (!isPositiveSafeInteger(id)) throw new TypeError("Некорректный id задачи");
      if (!changes || typeof changes !== "object") throw new TypeError("Некорректные изменения");
      const body = {};
      if (changes.title !== undefined) body.title = changes.title.trim();
      if (changes.priority !== undefined) body.priority = changes.priority;
      if (changes.categoryId !== undefined) body.categoryId = changes.categoryId;
      if (changes.completed !== undefined) body.completed = changes.completed;
      const response = await client.requestJson(`/tasks/${id}`, { method: "PATCH", body, signal });
      const rawTask = response.data ?? response.task ?? response;
      if (!isTask(rawTask)) throw invalidResponse("Неверная схема обновлённой задачи");
      return rawTask;
    },

    async setTaskCompleted(id, completed, { signal } = {}) {
      if (!isPositiveSafeInteger(id)) throw new TypeError("Некорректный id задачи");
      if (typeof completed !== "boolean") throw new TypeError("completed должен быть boolean");
      return this.updateTask(id, { completed }, { signal });
    },

    async deleteTask(id, { signal } = {}) {
      if (!isPositiveSafeInteger(id)) {
        throw new TypeError("Некорректный id задачи");
      }

      const result = await client.requestJson(`/tasks/${id}`, {
        method: "DELETE",
        signal,
      });

      if (result != null) {
        throw invalidResponse("Для удаления ожидался ответ 204 без тела");
      }

      return null;
    },

    async resetDemoData({ signal } = {}) {
      const response = await client.requestJson("/debug/reset", {
        method: "POST",
        signal,
      });

      const confirmation = response?.data ?? response;

      if (
        !confirmation ||
        confirmation.reset !== true ||
        !Number.isSafeInteger(confirmation.total) ||
        confirmation.total < 0
      ) {
        throw invalidResponse("Неверное подтверждение сброса данных");
      }

      return {
        reset: true,
        total: confirmation.total,
      };
    },
  };
}