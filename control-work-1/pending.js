// Исходный массив из ПР2
const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Функция из ПР2
function getPendingTasks(tasks) {
  return tasks.filter((task) => !task.completed);
}

// Проверка 1: для demoTasks
console.log("=== Проверка 1: demoTasks ===");
const pendingFromDemo = getPendingTasks(demoTasks);
console.log("Результат:", pendingFromDemo.map((task) => task.id));
console.log("Ожидалось: [4, 7]");
console.log("Совпадает:", JSON.stringify(pendingFromDemo.map((t) => t.id)) === JSON.stringify([4, 7]));

// Проверка 2: для пустого массива
console.log("\n=== Проверка 2: пустой массив ===");
const pendingFromEmpty = getPendingTasks([]);
console.log("Результат:", pendingFromEmpty);
console.log("Ожидалось: []");
console.log("Совпадает:", pendingFromEmpty.length === 0);

// Проверка 3: исходный массив не изменился
console.log("\n=== Проверка 3: исходный массив сохранён ===");
console.log("Длина demoTasks:", demoTasks.length);
console.log("Ожидалось: 4");
console.log("Совпадает:", demoTasks.length === 4);