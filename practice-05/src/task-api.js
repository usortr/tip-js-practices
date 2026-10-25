import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    isPositiveSafeInteger(value.id) &&
    typeof value.title === "string" &&
    value.title.trim().length >= 1 &&
    value.title.trim().length <= 100 &&
    typeof value.completed === "boolean" &&
    ALLOWED_PRIORITIES.has(value.priority) &&
    isPositiveSafeInteger(value.categoryId)
  );
}

function isCategory(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    isPositiveSafeInteger(value.id) &&
    typeof value.name === "string" &&
    value.name.trim().length >= 1 &&
    value.name.trim().length <= 100
  );
}

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("Некорректный клиент API");
  }

  function validateFilters(filters) {
    if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
      throw new TypeError("Фильтры должны быть объектом");
    }
    const normalized = {};
    for (const key of Object.keys(filters)) {
      if (!ALLOWED_FILTERS.has(key)) {
        throw new TypeError(`Неизвестный фильтр: ${key}`);
      }
      const value = filters[key];
      if (key === "completed" && typeof value !== "boolean") {
        throw new TypeError("Фильтр completed должен быть boolean");
      }
      if (key === "priority" && !ALLOWED_PRIORITIES.has(value)) {
        throw new TypeError("Недопустимый приоритет в фильтре");
      }
      if (key === "categoryId" && !isPositiveSafeInteger(value)) {
        throw new TypeError("Недопустимый categoryId в фильтре");
      }
      if (key === "q") {
        if (typeof value !== "string") {
          throw new TypeError("Параметр q должен быть строкой");
        }
        normalized.q = value.trim();
        if (normalized.q.length > 100) {
          throw new TypeError("Параметр q не должен быть длиннее 100 символов");
        }
      } else {
        normalized[key] = value;
      }
    }
    return normalized;
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

  return {
    async getTasks(filters = {}) {
      const query = validateFilters(filters);
      const response = await client.requestJson("/tasks", { query });
      
      const rawTasks = response.data ?? response.tasks;
      if (!Array.isArray(rawTasks)) {
        throw invalidResponse("Ожидался массив задач");
      }
      if (!response.meta || typeof response.meta.total !== "number") {
        throw invalidResponse("Неверная структура ответа задач");
      }
      
      const tasks = validateTasksArray(rawTasks);
      
      // Сопоставляем meta.total с реальной длиной коллекции
      if (response.meta.total !== tasks.length) {
        throw invalidResponse("meta.total не совпадает с длиной коллекции задач");
      }
      
      return { tasks, meta: response.meta };
    },

    async getTaskById(id) {
      if (!isPositiveSafeInteger(id)) {
        throw new TypeError("Некорректный id задачи");
      }
      const response = await client.requestJson(`/tasks/${id}`);
      const rawTask = response.data ?? response.task ?? response;
      
      if (!isTask(rawTask)) throw invalidResponse("Неверная схема задачи");
      return rawTask;
    },

    async getCategories() {
      const response = await client.requestJson("/categories");
      const rawCategories = Array.isArray(response) ? response : (response.data ?? response.categories ?? []);
      return validateCategoriesArray(rawCategories);
    },

    async loadInitialData(filters = {}) {
      const [tasksResult, categories] = await Promise.all([
        this.getTasks(filters),
        this.getCategories(),
      ]);
      return {
        tasks: tasksResult.tasks,
        categories,
        meta: tasksResult.meta,
      };
    },
  };
}