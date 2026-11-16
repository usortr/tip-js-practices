import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

console.debug("[PR6] app-controller loaded: diagnostic-v6");

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  if (!api || typeof api !== "object" || !view || typeof view !== "object") {
    throw new TypeError("Некорректные зависимости контроллера");
  }
  if (
    typeof api.loadInitialData !== "function" ||
    typeof api.getTasks !== "function" ||
    typeof api.createTask !== "function" ||
    typeof api.updateTask !== "function" ||
    typeof api.setTaskCompleted !== "function" ||
    typeof api.deleteTask !== "function"
  ) {
    throw new TypeError("API не содержит необходимых методов");
  }
  if (
    typeof view.setListState !== "function" ||
    typeof view.setTasks !== "function" ||
    typeof view.setTotal !== "function" ||
    typeof view.setMutationPending !== "function"
  ) {
    throw new TypeError("View не содержит необходимых методов");
  }

  let tasks = [];
  let categories = [];
  let currentFilters = {};
  let editingId = null;
  let activeController = null;
  let categoriesLoaded = false;
  let readyPromise = null;

  function callView(name, ...args) {
    if (typeof view[name] === "function") {
      view[name](...args);
    }
  }

  function abortPrevious() {
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  }

  function createSignal() {
    abortPrevious();
    activeController = new AbortController();
    return activeController.signal;
  }

  function getTasksFromResult(result) {
    return Array.isArray(result?.tasks) ? result.tasks : [];
  }

  function getTotalFromResult(result, nextTasks) {
    return Number.isSafeInteger(result?.meta?.total)
      ? result.meta.total
      : nextTasks.length;
  }

  function renderTaskState(nextTasks, total) {
    tasks = nextTasks;
    callView("setTasks", tasks, categories);
    callView("setTotal", total);
    callView("setListState", tasks.length === 0 ? "empty" : "ready");
  }

  function handleLoadError(error, signal) {
    if (error instanceof ApiError && error.kind === "aborted") return;
    if (signal?.aborted) return;
    callView("setListState", "error", messageForError(error));
    callView("setMutationPending", false);
  }

  async function loadInitial(filters) {
    const signal = createSignal();
    currentFilters = { ...filters };
    callView("setListState", "loading");
    callView("setMutationPending", true);

    try {
      const result = await api.loadInitialData(filters, { signal });
      if (signal.aborted) return;

      const nextCategories = Array.isArray(result?.categories) ? result.categories : [];
      const nextTasks = getTasksFromResult(result);
      const total = getTotalFromResult(result, nextTasks);

      categories = nextCategories;
      categoriesLoaded = true;

      callView("setCategories", categories);
      renderTaskState(nextTasks, total);
      callView("setMutationPending", false);

      console.debug("[PR6] loadInitial done, categories:", categories.length);
    } catch (error) {
      handleLoadError(error, signal);
    }
  }

  async function loadTasks(filters) {
    if (!categoriesLoaded) {
      return loadInitial(filters);
    }
    const signal = createSignal();
    currentFilters = { ...filters };
    callView("setListState", "loading");
    callView("setMutationPending", true);

    try {
      const result = await api.getTasks(filters, { signal });
      if (signal.aborted) return;
      const nextTasks = getTasksFromResult(result);
      const total = getTotalFromResult(result, nextTasks);
      renderTaskState(nextTasks, total);
      callView("setMutationPending", false);
    } catch (error) {
      handleLoadError(error, signal);
    }
  }

  async function refreshAfterMutation(filters = currentFilters) {
    if (!categoriesLoaded) {
      return loadInitial(filters);
    }
    const signal = createSignal();
    callView("setListState", "loading");
    callView("setMutationPending", true);

    try {
      const result = await api.getTasks(filters, { signal });
      if (signal.aborted) return;
      const nextTasks = getTasksFromResult(result);
      const total = getTotalFromResult(result, nextTasks);
      console.debug("[PR6] refreshAfterMutation filters:", filters);
      console.debug("[PR6] refreshAfterMutation ids:", nextTasks.map((t) => t.id));
      renderTaskState(nextTasks, total);
      callView("setMutationPending", false);
    } catch (error) {
      handleLoadError(error, signal);
    }
  }

  return {
    async start(filters = {}) {
      readyPromise = loadInitial(filters);
      await readyPromise;
    },

    async applyFilters(filters) {
      await loadTasks(filters);
    },

    async refresh() {
      await loadTasks(currentFilters);
    },

    async submit(draft) {
      console.debug("[PR6] submit called, draft:", draft);
      console.debug("[PR6] submit categoriesLoaded:", categoriesLoaded, "categories.length:", categories.length);

      // Ждём загрузки категорий, если они ещё не пришли
      if (!categoriesLoaded && readyPromise) {
        console.debug("[PR6] submit waiting for readyPromise...");
        await readyPromise;
        console.debug("[PR6] submit readyPromise resolved, categories.length:", categories.length);
      }

      const result = validateDraft(draft, categories);
      console.debug("[PR6] submit validation result:", result);

      if (!result.valid) {
        callView("showFormErrors", result.errors);
        return;
      }

      callView("showFormErrors", {});
      callView("setMutationPending", true);

      try {
        if (editingId === null) {
          const countBefore = tasks.length;
          let lostResponse = false;

          try {
            await api.createTask(result.value);
          } catch (error) {
            const aborted =
              error instanceof ApiError &&
              (error.kind === "network" || error.kind === "aborted");
            if (!aborted) throw error;
            // Preflight/ответ отменён средой iframe, но POST мог дойти до
            // сервера. Не ретраим тело (риск дубликата) — перечитаем состояние.
            lostResponse = true;
          }

          editingId = null;
          callView("setFormTask", null);
          currentFilters = {};
          callView("setFilters", {});
          await refreshAfterMutation({});

          if (!lostResponse) {
            callView("notify", "Задача создана.", "success");
          } else if (tasks.length > countBefore) {
            callView("notify", "Задача сохранена на сервере.", "success");
          } else {
            callView("notify", "Не удалось связаться с сервером.", "error");
            callView("setMutationPending", false);
            return;
          }
        } else {
          const updated = await api.updateTask(editingId, result.value);
          console.debug("[PR6] updated task:", updated);
          callView("notify", "Задача обновлена.", "success");
          editingId = null;
          callView("setFormTask", null);
          await refreshAfterMutation(currentFilters);
        }
      } catch (error) {
        console.log("[DIAG] submit catch:", error.kind, "|", error.message, "| cause:", error.cause?.message); // ← новая строка
        callView("notify", messageForError(error), "error");
        callView("setMutationPending", false);
      }
    },

    beginEdit(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        callView("notify", "Задача не найдена для редактирования.", "error");
        return;
      }
      editingId = id;
      callView("setFormTask", task);
    },

    cancelEdit() {
      editingId = null;
      callView("setFormTask", null);
      callView("showFormErrors", {});
    },

    async toggleTask(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        callView("notify", "Задача не найдена.", "error");
        return;
      }
      callView("setMutationPending", true);
      try {
        const updated = await api.setTaskCompleted(id, !task.completed);
        console.debug("[PR6] toggled task:", updated);
        callView("notify", "Статус изменён.", "success");
        await refreshAfterMutation(currentFilters);
      } catch (error) {
        callView("notify", messageForError(error), "error");
        callView("setMutationPending", false);
      }
    },

    async deleteTask(id) {
      callView("setMutationPending", true);
      try {
        await api.deleteTask(id);
        if (editingId === id) {
          editingId = null;
          callView("setFormTask", null);
        }
        callView("notify", "Задача удалена.", "success");
        await refreshAfterMutation(currentFilters);
      } catch (error) {
        callView("notify", messageForError(error), "error");
        callView("setMutationPending", false);
      }
    },

    async resetData() {
      callView("setMutationPending", true);
      try {
        const confirmation = await api.resetDemoData();
        console.debug("[PR6] reset confirmation:", confirmation);
        editingId = null;
        callView("setFormTask", null);
        callView("notify", "Данные сброшены к исходным.", "success");
        await refreshAfterMutation(currentFilters);
      } catch (error) {
        callView("notify", messageForError(error), "error");
        callView("setMutationPending", false);
      }
    },

    destroy() {
      abortPrevious();
    },
  };
}