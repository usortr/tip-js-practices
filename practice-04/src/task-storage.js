export const STORAGE_VERSION = 1;

function isValidTask(value) {
  return (
    value &&
    Number.isSafeInteger(value.id) && value.id > 0 &&
    typeof value.title === "string" && value.title.trim().length >= 1 && value.title.trim().length <= 100 &&
    typeof value.completed === "boolean" &&
    (value.priority === "low" || value.priority === "medium" || value.priority === "high")
  );
}

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const ids = new Set();
  for (const task of value) {
    if (!isValidTask(task)) return false;
    if (ids.has(task.id)) return false; // Проверка на уникальность
    ids.add(task.id);
  }
  return true;
}

export function loadTasks(storage, key, fallbackTasks) {
  try {
    const raw = storage.getItem(key);
    if (raw === null) {
      return { ok: true, source: "initial", tasks: structuredClone(fallbackTasks) };
    }
    const parsed = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION || !isValidTaskList(parsed.tasks)) {
      throw new Error("Неверная схема или версия данных");
    }
    return { ok: true, source: "storage", tasks: structuredClone(parsed.tasks) };
  } catch (error) {
    return { 
      ok: false, 
      source: "fallback", 
      tasks: structuredClone(fallbackTasks), 
      error: "Не удалось загрузить данные, использован резервный набор" 
    };
  }
}

export function saveTasks(storage, key, tasks) {
  try {
    if (!isValidTaskList(tasks)) {
      return { ok: false, error: "Невозможно сохранить некорректные данные" };
    }
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: "Ошибка сохранения в хранилище" };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: "Ошибка очистки хранилища" };
  }
}