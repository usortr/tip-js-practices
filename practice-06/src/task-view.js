const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

// Маркер версии, чтобы в DevTools было видно, что загрузился именно новый файл
console.debug("[PR6] task-view loaded: robust-categories-v5");

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unwrapCollection(input) {
  if (input == null) {
    return [];
  }

  if (Array.isArray(input)) {
    return input;
  }

  if (input instanceof Map) {
    return input;
  }

  if (typeof input === "object") {
    // Поддерживаем обёртки вида { data: [...] } или { categories: [...] }
    if (Array.isArray(input.data)) return input.data;
    if (Array.isArray(input.categories)) return input.categories;
    if (Array.isArray(input.items)) return input.items;

    // Поддерживаем словарь вида { 1: "Учёба", 2: "Проект" }
    // или { 1: { name: "Учёба" }, 2: { name: "Проект" } }
    return input;
  }

  return [];
}

function isSingleCategory(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Map) &&
    "id" in value &&
    "name" in value,
  );
}

function normalizeCategories(input) {
  // Одиночный объект категории — оборачиваем в массив
  if (isSingleCategory(input)) {
    return [input];
  }

  if (Array.isArray(input)) {
    return input
      .map((item, index) => {
        if (typeof item === "string") return { id: index + 1, name: item };
        if (item && typeof item === "object") return { ...item, id: item.id ?? index + 1 };
        return null;
      })
      .filter(Boolean);
  }

  if (input instanceof Map) {
    return [...input.entries()]
      .map(([id, value]) =>
        value && typeof value === "object" ? { ...value, id } : { id, name: value },
      )
      .filter((item) => item.name != null);
  }

  if (input && typeof input === "object") {
    // Обёртки { data: [...] }, { categories: [...] }, { items: [...] }
    if (Array.isArray(input.data)) return normalizeCategories(input.data);
    if (Array.isArray(input.categories)) return normalizeCategories(input.categories);
    if (Array.isArray(input.items)) return normalizeCategories(input.items);

    // Словарь { 1: "Учёба", 2: { name: "Проект" } }
    return Object.entries(input)
      .map(([key, value]) => {
        const id = Number(key);
        if (value && typeof value === "object") return { ...value, id };
        return { id, name: value };
      })
      .filter((item) => Number.isFinite(item.id) && item.name != null);
  }

  return [];
}

function getCategoryName(task, categories) {
  const categoryId = Number(task?.categoryId);
  if (!Number.isFinite(categoryId)) return "—";

  const normalized = normalizeCategories(categories);
  const category = normalized.find((item) => Number(item?.id) === categoryId);
  const name = category?.name;

  return typeof name === "string" && name.trim().length > 0 ? name.trim() : "—";
}

function createActionButton(action, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;

  const span = document.createElement("span");
  span.className = "action-label";
  span.textContent = label;

  button.append(span);
  return button;
}

export function createTaskElement(task, categories = []) {
  const li = document.createElement("li");
  li.className = "task-card";
  li.dataset.taskId = String(task.id);

  if (task.completed) {
    li.classList.add("is-completed");
  }

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = String(task.title ?? "");

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";

  const priority = document.createElement("span");
  priority.className = "task-priority";
  priority.textContent =
    PRIORITY_LABELS[task.priority] ?? String(task.priority ?? "");

  const category = document.createElement("span");
  category.className = "task-category";
  category.textContent = getCategoryName(task, categories);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggleButton = createActionButton("toggle", "Выполнена");
  toggleButton.setAttribute("aria-pressed", task.completed ? "true" : "false");

  const editButton = createActionButton("edit", "Изменить");
  const deleteButton = createActionButton("delete", "Удалить");

  actions.append(toggleButton, editButton, deleteButton);
  li.append(title, status, priority, category, actions);

  return li;
}

export function renderTaskList(listElement, tasks, categories = []) {
  const safeTasks = asArray(tasks);
  const elements = safeTasks.map((task) => createTaskElement(task, categories));
  listElement.replaceChildren(...elements);
}