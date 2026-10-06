import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { addTask, findTaskById, removeTask, setTaskCompleted, updateTask } from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderEmptyState, renderSummary, renderTaskList } from "./task-view.js";
import { validateTaskDraft } from "./form-validation.js";
import { loadTasks, removeSavedTasks, saveTasks } from "./task-storage.js";

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  priorityFilters: document.querySelector("#priority-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
  storageStatus: document.querySelector("#storage-status"),
  
  form: document.querySelector("#task-form"),
  formHeading: document.querySelector("#form-heading"),
  formMode: document.querySelector("#form-mode"),
  formMessage: document.querySelector("#form-message"),
  submitBtn: document.querySelector("#form-submit"),
  cancelBtn: document.querySelector("#cancel-edit"),
  resetBtn: document.querySelector("#reset-data"),
};

const params = new URLSearchParams(window.location.search);
const isVariant = params.get("dataset") === "variant";
const isCheckRun = params.get("mode") === "check";
const initialTasks = isVariant ? variantTasks : demoTasks;
const datasetName = isVariant ? "variant" : "demo";
const storageKey = isCheckRun
  ? `tip-js-practice-04:checks:${datasetName}`
  : `tip-js-practice-04:${datasetName}`;

const loadResult = loadTasks(window.localStorage, storageKey, initialTasks);
let currentTasks = loadResult.tasks;
let currentFilter = "all";
let currentPriorityFilter = "all";
let editingId = null;

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

if (!loadResult.ok) {
  elements.storageStatus.classList.add("is-warning");
  elements.storageStatus.textContent = loadResult.error;
} else if (loadResult.source === "storage") {
  elements.storageStatus.textContent = "Данные восстановлены из localStorage.";
} else {
  elements.storageStatus.textContent = "Загружен исходный набор задач.";
}

function applyFilters(tasks) {
  // Сначала применяем фильтр по статусу (используя функцию из ПР3)
  const byStatus = getVisibleTasks(tasks, currentFilter);
  // Затем применяем фильтр по приоритету
  if (currentPriorityFilter === "all") {
    return byStatus;
  }
  return byStatus.filter((task) => task.priority === currentPriorityFilter);
}

function renderApp() {
  const visibleTasks = applyFilters(currentTasks);
  
  renderTaskList(elements.list, visibleTasks);
  renderSummary(elements.summary, currentTasks, visibleTasks.length);
  renderEmptyState(elements.empty, currentTasks.length, visibleTasks.length);

  // Обновляем активные кнопки статуса
  elements.filters.querySelectorAll("button[data-filter]").forEach((btn) => {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle("is-active", isActive);
    btn.ariaPressed = isActive ? "true" : "false";
  });

  // Обновляем активные кнопки приоритета
  elements.priorityFilters.querySelectorAll("button[data-priority]").forEach((btn) => {
    const isActive = btn.dataset.priority === currentPriorityFilter;
    btn.classList.toggle("is-active", isActive);
    btn.ariaPressed = isActive ? "true" : "false";
  });
}

function clearFieldError(name) {
  const input = elements.form.elements.namedItem(name);
  const message = elements.form.querySelector(`[data-error-for="${name}"]`);
  if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
    input.setCustomValidity("");
    input.removeAttribute("aria-invalid");
  }
  if (message) message.textContent = "";
}

function clearFormErrors() {
  for (const name of ["id", "title", "priority"]) clearFieldError(name);
  elements.formMessage.textContent = "";
}

function showFormErrors(errors) {
  clearFormErrors();
  for (const [name, text] of Object.entries(errors)) {
    const input = elements.form.elements.namedItem(name);
    const message = elements.form.querySelector(`[data-error-for="${name}"]`);
    if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
      input.setCustomValidity(text);
      input.setAttribute("aria-invalid", "true");
    }
    if (message) message.textContent = text;
  }
  elements.form.reportValidity();
}

function setFormMode(id = null) {
  clearFormErrors();
  
  const idInput = elements.form.elements.namedItem("id");
  const titleInput = elements.form.elements.namedItem("title");
  const priorityInput = elements.form.elements.namedItem("priority");

  if (id === null) {
    editingId = null;
    elements.form.reset();
    idInput.disabled = false;
    elements.formHeading.textContent = "Добавление задачи";
    elements.formMode.textContent = "Режим создания новой задачи.";
    elements.submitBtn.textContent = "Добавить задачу";
    elements.cancelBtn.hidden = true;
    idInput.focus();
  } else {
    const task = findTaskById(currentTasks, id);
    if (!task) {
      elements.message.textContent = "Ошибка: задача для редактирования не найдена";
      return;
    }
    editingId = id;
    idInput.value = task.id;
    idInput.disabled = true;
    titleInput.value = task.title;
    priorityInput.value = task.priority;
    
    elements.formHeading.textContent = "Редактирование задачи";
    elements.formMode.textContent = `Режим изменения задачи #${task.id}.`;
    elements.submitBtn.textContent = "Сохранить изменения";
    elements.cancelBtn.hidden = false;
    titleInput.focus();
  }
}

function persistCurrentTasks(successMessage) {
  const saved = saveTasks(window.localStorage, storageKey, currentTasks);
  elements.storageStatus.classList.toggle("is-warning", !saved.ok);
  elements.storageStatus.textContent = saved.ok ? "Изменения сохранены в localStorage." : saved.error;
  elements.message.textContent = saved.ok ? successMessage : `${successMessage} ${saved.error}`;
  renderApp();
  return saved;
}

function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(`[data-task-id="${id}"] button[data-action="${action}"]`);
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const draft = {
    id: formData.get("id"),
    title: formData.get("title"),
    priority: formData.get("priority"),
  };

  const validation = validateTaskDraft(draft, currentTasks, editingId);
  if (!validation.ok) {
    showFormErrors(validation.errors);
    return;
  }

  let result;
  if (editingId === null) {
    result = addTask(currentTasks, validation.value.id, validation.value.title, validation.value.priority);
  } else {
    result = updateTask(currentTasks, editingId, validation.value.title, validation.value.priority);
  }

  if (result && result.ok) {
    currentTasks = result.tasks;
    persistCurrentTasks(editingId === null ? "Задача добавлена." : "Задача обновлена.");
    setFormMode(null);
  } else {
    elements.message.textContent = `Ошибка: ${result?.error || "Неизвестная ошибка"}`;
  }
}

function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-action]");
  if (!button || !elements.list.contains(button)) return;

  const action = button.dataset.action;
  const card = button.closest("li[data-task-id]");
  if (!card) return;

  const id = Number(card.dataset.taskId);
  if (!Number.isSafeInteger(id) || id <= 0) return;

  if (action === "edit") {
    setFormMode(id);
    return;
  }

  const task = findTaskById(currentTasks, id);
  if (!task) return;

  let result;
  if (action === "toggle") {
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else if (action === "delete") {
    result = removeTask(currentTasks, id);
    if (editingId === id) {
      setFormMode(null);
    }
  }

  if (result && result.ok) {
    currentTasks = result.tasks;
    persistCurrentTasks(action === "toggle" ? "Статус изменён." : "Задача удалена.");
    restoreTaskFocus(id, action);
  } else {
    elements.message.textContent = `Ошибка: ${result?.error}`;
  }
}

function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-filter]");
  if (!button || !elements.filters.contains(button)) return;

  const filter = button.dataset.filter;
  if (filter !== "all" && filter !== "pending" && filter !== "completed") return;

  currentFilter = filter;
  elements.message.textContent = "";
  renderApp();
}

function handlePriorityFilterClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-priority]");
  if (!button || !elements.priorityFilters.contains(button)) return;

  const priority = button.dataset.priority;
  if (priority !== "all" && priority !== "low" && priority !== "medium" && priority !== "high") return;

  currentPriorityFilter = priority;
  elements.message.textContent = "";
  renderApp();
}

function handleResetClick() {
  const removed = removeSavedTasks(window.localStorage, storageKey);
  if (!removed.ok) {
    elements.message.textContent = `Ошибка сброса: ${removed.error}`;
    return;
  }
  currentTasks = initialTasks.map((task) => ({ ...task }));
  currentFilter = "all";
  currentPriorityFilter = "all";
  setFormMode(null);
  elements.storageStatus.classList.remove("is-warning");
  elements.storageStatus.textContent = "Локальные изменения удалены.";
  elements.message.textContent = "Данные сброшены к исходному набору.";
  renderApp();
}

// Сбрасываем ошибку поля, как только пользователь начинает вводить новый текст
elements.form.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
    const name = event.target.name;
    if (name) clearFieldError(name);
  }
});

// Подписки
elements.form.addEventListener("submit", handleFormSubmit);
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);
elements.priorityFilters.addEventListener("click", handlePriorityFilterClick);
elements.resetBtn.addEventListener("click", handleResetClick);
elements.cancelBtn.addEventListener("click", () => setFormMode(null));

setFormMode(null);
renderApp();