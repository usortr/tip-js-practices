function calculateProgress(totalTasks, completedTasks) {
  // Проверка типов
  if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
    console.log("Ошибка: аргументы должны быть целыми числами");
    return;
  }

  // Проверка диапазонов
  if (totalTasks < 0 || totalTasks > 1000) {
    console.log("Ошибка: totalTasks должен быть от 0 до 1000");
    return;
  }
  if (completedTasks < 0 || completedTasks > totalTasks) {
    console.log("Ошибка: completedTasks должен быть от 0 до totalTasks");
    return;
  }

  // Особый случай: обе нули
  if (totalTasks === 0 && completedTasks === 0) {
    console.log("Задач пока нет");
    return;
  }

  const remaining = totalTasks - completedTasks;
  const progress = (completedTasks / totalTasks) * 100;

  let status;
  if (completedTasks === 0) {
    status = "Не начато";
  } else if (completedTasks === totalTasks) {
    status = "Завершено";
  } else {
    status = "В работе";
  }

  console.log(`Осталось: ${remaining}`);
  console.log(`Прогресс: ${progress.toFixed(1)}%`);
  console.log(`Статус: ${status}`);
}

// Три проверочных запуска
console.log("=== Проверка 1: (12, 5) ===");
calculateProgress(12, 5);

console.log("\n=== Проверка 2: (0, 0) ===");
calculateProgress(0, 0);

console.log("\n=== Проверка 3: (5, 6) ===");
calculateProgress(5, 6);