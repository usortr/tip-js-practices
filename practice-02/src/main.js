import { demoTasks, variantTasks, variantNumber } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
  getPrioritySummary, // Доп. задание
} from "./task-service.js";

console.log("=== ОБЩИЙ СЦЕНАРИЙ ===");
let currentTasks = demoTasks;

// 1. Исходное состояние
let stats = getTaskStats(currentTasks);
console.log(`1. Исходно: Всего ${stats.total}, выполнено ${stats.completed}, осталось ${stats.pending}. Прогресс: ${stats.total === 0 ? "Задач пока нет" : stats.progress.toFixed(1) + "%"}`);

// 2. Добавить задачу id = 20
let res = addTask(currentTasks, 20, "Добавить проверку", "high");
if (res.ok) {
  currentTasks = res.tasks;
  console.log("2. Задача 20 добавлена.");
} else {
  console.error("Ошибка добавления:", res.error);
}

// 3. Выполнить задачу id = 4
res = setTaskCompleted(currentTasks, 4, true);
if (res.ok) {
  currentTasks = res.tasks;
  console.log("3. Задача 4 выполнена.");
}

// 4. Переименовать задачу id = 10
res = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (res.ok) {
  currentTasks = res.tasks;
  console.log("4. Задача 10 переименована.");
}

// 5. Удалить задачу id = 7
res = removeTask(currentTasks, 7);
if (res.ok) {
  currentTasks = res.tasks;
  console.log("5. Задача 7 удалена.");
}

// 6. Обработка отказа (попытка добавить задачу с существующим id = 1)
res = addTask(currentTasks, 1, "Дубликат", "low");
if (!res.ok) {
  console.log(`6. Ожидаемый отказ при добавлении дубликата: "${res.error}"`);
}

// 7. Проверка сохранности исходного demoTasks
console.log("7. Исходный demoTasks не изменён (длина):", demoTasks.length, "(ожидалось 4)");
stats = getTaskStats(currentTasks);
console.log(`Итоговая сводка: Всего ${stats.total}, выполнено ${stats.completed}, осталось ${stats.pending}. Прогресс: ${stats.progress.toFixed(1)}%`);
console.log("Итоговые ID:", currentTasks.map(t => t.id).join(", "));


console.log("\n=== ИНДИВИДУАЛЬНЫЙ ВАРИАНТ (Вариант " + variantNumber + ") ===");
let variantCurrent = variantTasks;
let vStats = getTaskStats(variantCurrent);
console.log(`1. Исходный прогресс варианта: ${vStats.total === 0 ? "0.0%" : vStats.progress.toFixed(1) + "%"}`);

// 2. Добавить задачу id = 80 
res = addTask(variantCurrent, 80, "Специфическая задача варианта", "low");
if (res.ok) {
  variantCurrent = res.tasks;
  console.log("2. Задача 80 добавлена.");
}

// 3. Установить completed = true для id = 11
res = setTaskCompleted(variantCurrent, 11, true);
if (res.ok) {
  variantCurrent = res.tasks;
  console.log("3. Задача 11 выполнена.");
}

// 4. Переименовать id = 23
res = renameTask(variantCurrent, 23, "Обновлённое название задачи 23");
if (res.ok) {
  variantCurrent = res.tasks;
  console.log("4. Задача 23 переименована.");
}

// 5. Удалить id = 37
res = removeTask(variantCurrent, 37);
if (res.ok) {
  variantCurrent = res.tasks;
  console.log("5. Задача 37 удалена.");
}

// 6. Попытка повторно добавить id = 80
res = addTask(variantCurrent, 80, "Повторная задача", "low");
if (!res.ok) {
  console.log(`6. Ожидаемый отказ при повторном добавлении 80: "${res.error}"`);
}

// 7. Фиксация итогов и проверка сохранности variantTasks
console.log("7. Исходный variantTasks не изменён (длина):", variantTasks.length, "(ожидалось 6)");
console.log("Итоговые ID варианта:", variantCurrent.map(t => t.id).join(", "));


console.log("\n=== СОБСТВЕННЫЕ ПРОВЕРКИ ===");
// Проверка 1: Добавление задачи после удаления другой
let testTasks = [{ id: 1, title: "A", completed: false, priority: "low" }];
testTasks = removeTask(testTasks, 1).tasks;
testTasks = addTask(testTasks, 2, "B", "medium").tasks;
console.log("1. Добавление после удаления:", testTasks.length === 1 && testTasks[0].id === 2 ? "Пройдено" : "Не пройдено");

// Проверка 2: Изменение первой и последней записи в массиве из 3 элементов
let multiTasks = [
  { id: 1, title: "First", completed: false, priority: "low" },
  { id: 2, title: "Mid", completed: false, priority: "medium" },
  { id: 3, title: "Last", completed: false, priority: "high" },
];
multiTasks = renameTask(multiTasks, 1, "First Renamed").tasks;
multiTasks = renameTask(multiTasks, 3, "Last Renamed").tasks;
const firstOk = multiTasks[0].title === "First Renamed" && multiTasks[0].id === 1;
const lastOk = multiTasks[2].title === "Last Renamed" && multiTasks[2].id === 3;
console.log("2. Переименование первой и последней:", firstOk && lastOk ? "Пройдено" : "Не пройдено");

// Проверка 3: Дополнительное задание (Сводка по приоритетам)
const prioritySummary = getPrioritySummary(demoTasks);
const summaryOk = prioritySummary.medium.total === 2 && prioritySummary.medium.pending === 0;
console.log("3. Сводка по приоритетам (medium total=2, pending=0):", summaryOk ? "Пройдено" : "Не пройдено");