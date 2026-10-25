// Вспомогательные функции из ПР2
function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

// Исходный массив из ПР2
const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Функция из ПР2
function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) {
    return { ok: false, error: "Некорректный идентификатор задачи" };
  }
  if (typeof completed !== "boolean") {
    return { ok: false, error: "Статус выполнения должен быть логическим значением" };
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

// Проверка 1: установить true для id=4
console.log("=== Проверка 1: установить completed=true для id=4 ===");
console.log("Исходный статус задачи id=4:", demoTasks.find(t => t.id === 4).completed);

const result1 = setTaskCompleted(demoTasks, 4, true);

if (result1.ok) {
  console.log("Результат операции: ok=true");
  const updatedTask = result1.tasks.find(t => t.id === 4);
  console.log("Статус в новом массиве:", updatedTask.completed);
  console.log("Статус в исходном массиве:", demoTasks.find(t => t.id === 4).completed);
  console.log("Совпадают ли ссылки на массивы?", result1.tasks === demoTasks);
  console.log("Совпадают ли ссылки на объект задачи?", updatedTask === demoTasks.find(t => t.id === 4));
} else {
  console.log("Ошибка:", result1.error);
}

// Проверка 2: попытка изменить несуществующую задачу id=777
console.log("\n=== Проверка 2: попытка изменить id=777 ===");
const result2 = setTaskCompleted(demoTasks, 777, true);

if (result2.ok) {
  console.log("Результат операции: ok=true (НЕ ОЖИДАЛОСЬ)");
} else {
  console.log("Результат операции: ok=false");
  console.log("Сообщение об ошибке:", result2.error);
  console.log("Исходный массив не изменён, длина:", demoTasks.length);
}