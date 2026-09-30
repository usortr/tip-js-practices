// Вспомогательная функция для проверки ID
function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

// Вспомогательная функция для проверки названия
function isValidTitle(title) {
  if (typeof title !== "string") return false;
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

// Вспомогательная функция для проверки приоритета
function isValidPriority(priority) {
  return priority === "low" || priority === "medium" || priority === "high";
}

export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) {
    return { ok: false, error: "Некорректный идентификатор задачи" };
  }
  if (!isValidTitle(title)) {
    return { ok: false, error: "Название должно быть строкой от 1 до 100 символов" };
  }
  if (!isValidPriority(priority)) {
    return { ok: false, error: "Недопустимый приоритет" };
  }

  return {
    ok: true,
    task: {
      id,
      title: title.trim(),
      completed: false,
      priority,
    },
  };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => !task.completed);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : (completed / total) * 100;
  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  if (!isValidId(id)) {
    return { ok: false, error: "Некорректный идентификатор задачи" };
  }
  if (findTaskById(tasks, id)) {
    return { ok: false, error: "Задача с таким идентификатором уже существует" };
  }
  
  const creationResult = createTask(id, title, priority);
  if (!creationResult.ok) {
    return creationResult;
  }

  return { ok: true, tasks: [...tasks, creationResult.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) {
    return { ok: false, error: "Некорректный идентификатор задачи" };
  }
  if (typeof completed !== "boolean") {
    return { ok: false, error: "Статус выполнения должен быть логическим значением (true/false)" };
  }
  
  const task = findTaskById(tasks, id);
  if (!task) {
    return { ok: false, error: "Задача не найдена" };
  }

  return {
    ok: true,
    tasks: tasks.map((t) => (t.id === id ? { ...t, completed } : t)),
  };
}

export function renameTask(tasks, id, title) {
  if (!isValidId(id)) {
    return { ok: false, error: "Некорректный идентификатор задачи" };
  }
  if (!isValidTitle(title)) {
    return { ok: false, error: "Название должно быть строкой от 1 до 100 символов" };
  }

  const task = findTaskById(tasks, id);
  if (!task) {
    return { ok: false, error: "Задача не найдена" };
  }

  return {
    ok: true,
    tasks: tasks.map((t) => (t.id === id ? { ...t, title: title.trim() } : t)),
  };
}

export function removeTask(tasks, id) {
  if (!isValidId(id)) {
    return { ok: false, error: "Некорректный идентификатор задачи" };
  }
  
  const task = findTaskById(tasks, id);
  if (!task) {
    return { ok: false, error: "Задача не найдена" };
  }

  return {
    ok: true,
    tasks: tasks.filter((t) => t.id !== id),
  };
}

// === ДОПОЛНИТЕЛЬНОЕ ЗАДАНИЕ (Вариант Б) ===
export function getPrioritySummary(tasks) {
  const summary = {
    low: { total: 0, pending: 0 },
    medium: { total: 0, pending: 0 },
    high: { total: 0, pending: 0 },
  };

  for (const task of tasks) {
    if (summary[task.priority]) {
      summary[task.priority].total += 1;
      if (!task.completed) {
        summary[task.priority].pending += 1;
      }
    }
  }

  return summary;
}