import { getTaskStats } from "./task-service.js";

export function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-card";
  li.dataset.taskId = task.id;
  if (task.completed) {
    li.classList.add("is-completed");
  }

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";

  const priority = document.createElement("span");
  priority.className = "task-priority";
  const priorityMap = { low: "Низкий", medium: "Средний", high: "Высокий" };
  priority.textContent = priorityMap[task.priority] || task.priority;

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "task-actions";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.dataset.action = "toggle";
  toggleBtn.ariaPressed = task.completed ? "true" : "false";
  const toggleLabel = document.createElement("span");
  toggleLabel.className = "action-label";
  toggleLabel.textContent = "Выполнена";
  toggleBtn.append(toggleLabel);

  // НОВАЯ КНОПКА "ИЗМЕНИТЬ"
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.dataset.action = "edit";
  const editLabel = document.createElement("span");
  editLabel.className = "action-label";
  editLabel.textContent = "Изменить";
  editBtn.append(editLabel);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.dataset.action = "delete";
  const deleteLabel = document.createElement("span");
  deleteLabel.className = "action-label";
  deleteLabel.textContent = "Удалить";
  deleteBtn.append(deleteLabel);

  actionsDiv.append(toggleBtn, editBtn, deleteBtn);
  li.append(title, status, priority, actionsDiv);

  return li;
}

export function renderTaskList(listElement, tasks) {
  const elements = tasks.map((task) => createTaskElement(task));
  listElement.replaceChildren(...elements);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  const stats = getTaskStats(tasks);
  
  summaryElement.querySelector('[data-stat="total"]').textContent = stats.total;
  summaryElement.querySelector('[data-stat="completed"]').textContent = stats.completed;
  summaryElement.querySelector('[data-stat="pending"]').textContent = stats.pending;
  summaryElement.querySelector('[data-stat="progress"]').textContent = `${stats.progress.toFixed(1)}%`;
  summaryElement.querySelector('[data-stat="visible"]').textContent = visibleCount;
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (total === 0 && visibleCount === 0) {
    messageElement.textContent = "Список задач пуст.";
    messageElement.hidden = false;
  } else if (total > 0 && visibleCount === 0) {
    messageElement.textContent = "Нет задач по выбранному фильтру.";
    messageElement.hidden = false;
  } else {
    messageElement.textContent = "";
    messageElement.hidden = true;
  }
}