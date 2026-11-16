const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, categories) {
  const errors = {};

  // title
  if (!draft || typeof draft.title !== "string" || draft.title.trim().length < 1 || draft.title.trim().length > 100) {
    errors.title = "Название: от 1 до 100 символов после trim";
  }

  // priority
  if (!draft || !ALLOWED_PRIORITIES.has(draft.priority)) {
    errors.priority = "Приоритет: low, medium или high";
  }

  // categoryId
  const catId = Number(draft?.categoryId);
  if (!Number.isSafeInteger(catId) || catId <= 0) {
    errors.categoryId = "Выберите категорию";
  } else if (!categories.some((c) => c.id === catId)) {
    errors.categoryId = "Категория не найдена";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, value: null, errors };
  }

  return {
    valid: true,
    value: { title: draft.title.trim(), priority: draft.priority, categoryId: catId },
    errors: {},
  };
}