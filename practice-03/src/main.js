import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { findTaskById, setTaskCompleted, removeTask } from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderTaskList, renderSummary, renderEmptyState } from "./task-view.js";

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
  undoBtn: document.querySelector("#undo-delete-btn"), // Новая кнопка
};

const isVariant = new URLSearchParams(window.location.search).get("dataset") === "variant";
const initialTasks = isVariant ? variantTasks : demoTasks;
let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";

// СОСТОЯНИЕ ДЛЯ ДОП. ЗАДАНИЯ: храним последнюю удаленную задачу и её индекс
let lastDeletedRecord = null; 

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

function renderApp() {
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter);
  
  renderTaskList(elements.list, visibleTasks);
  renderSummary(elements.summary, currentTasks, visibleTasks.length);
  renderEmptyState(elements.empty, currentTasks.length, visibleTasks.length);

  const filterButtons = elements.filters.querySelectorAll("button[data-filter]");
  filterButtons.forEach((btn) => {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle("is-active", isActive);
    btn.ariaPressed = isActive ? "true" : "false";
  });
}

function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");
  if (!button || !elements.list.contains(button)) return;

  const action = button.dataset.action;
  if (action !== "toggle" && action !== "delete") return;

  const card = button.closest("li[data-task-id]");
  if (!card) return;

  const id = Number(card.dataset.taskId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    elements.message.textContent = "Ошибка: некорректный идентификатор задачи";
    return;
  }

  const task = findTaskById(currentTasks, id);
  if (!task) {
    elements.message.textContent = "Ошибка: задача не найдена";
    return;
  }

  let result;
  if (action === "toggle") {
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else if (action === "delete") {
    // ДОП. ЗАДАНИЕ: запоминаем задачу и её текущий индекс ПЕРЕД удалением
    const indexToDelete = currentTasks.indexOf(task);
    lastDeletedRecord = { task: { ...task }, index: indexToDelete };
    
    result = removeTask(currentTasks, id);
    
    // Активируем кнопку отмены, если удаление прошло успешно
    if (result.ok) {
      elements.undoBtn.disabled = false;
    }
  }

  if (result && result.ok) {
    currentTasks = result.tasks;
    elements.message.textContent = "";
    renderApp();
    restoreTaskFocus(id, action);
  } else if (result && !result.ok) {
    elements.message.textContent = `Ошибка: ${result.error}`;
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

// ДОП. ЗАДАНИЕ: Обработчик кнопки отмены
function handleUndoClick() {
  if (!lastDeletedRecord) return;

  // Вставляем задачу обратно ровно в тот индекс, откуда она была удалена
  currentTasks.splice(lastDeletedRecord.index, 0, lastDeletedRecord.task);
  
  // Сбрасываем запись об отмене и блокируем кнопку
  lastDeletedRecord = null;
  elements.undoBtn.disabled = true;
  elements.message.textContent = "Удаление отменено.";
  
  renderApp();
}

function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`,
  );
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

// Подписки
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);
elements.undoBtn.addEventListener("click", handleUndoClick); // Слушаем кнопку отмены

try {
  renderApp();
} catch (error) {
  elements.message.textContent = `Ошибка запуска: ${error.message}`;
  console.error(error);
}