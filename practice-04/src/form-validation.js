const ALLOWED_PRIORITIES = ["low", "medium", "high"];

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};

  // 1. Проверка ID
  const numId = Number(draft.id);
  if (editingId === null) {
    // Режим создания: ID должен быть уникальным и корректным числом
    if (!Number.isSafeInteger(numId) || numId <= 0 || String(draft.id).trim() === "") {
      errors.id = "ID должен быть положительным целым числом";
    } else if (tasks.some((t) => t.id === numId)) {
      errors.id = "Задача с таким ID уже существует";
    }
  } else {
    // Режим редактирования: ID не меняем, но проверяем, что задача существует
    if (!tasks.some((t) => t.id === editingId)) {
      errors.id = "Редактируемая задача не найдена";
    }
  }

  // 2. Проверка названия
  if (typeof draft.title !== "string" || draft.title.trim().length < 1 || draft.title.trim().length > 100) {
    errors.title = "Название должно содержать от 1 до 100 символов";
  }

  // 3. Проверка приоритета
  if (!ALLOWED_PRIORITIES.includes(draft.priority)) {
    errors.priority = "Выберите допустимый приоритет";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // Если режим редактирования, используем старый ID, иначе новый
  const finalId = editingId !== null ? editingId : numId;

  return {
    ok: true,
    value: {
      id: finalId,
      title: draft.title.trim(),
      priority: draft.priority,
    },
  };
}