"use strict";

const totalTasks = 9;
const completedTasks = 9;

// 1. Проверка типа данных (отлов строк, boolean и т.д.)
if (typeof totalTasks !== 'number' || typeof completedTasks !== 'number') {
    console.log("Ошибка: вместо числа передана строка.");
}
// 2. Проверка на NaN (должна идти после проверки типа, так как typeof NaN === 'number')
else if (Number.isNaN(totalTasks) || Number.isNaN(completedTasks)) {
    console.log("Ошибка: недопустимое числовое значение.");
}
// 3. Проверка на целые числа (отлов дробных значений)
else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
    console.log("Ошибка: дробное количество.");
}
// 4. Проверка на отрицательные значения
else if (totalTasks < 0 || completedTasks < 0) {
    console.log("Ошибка: отрицательное количество.");
}
// 5. Проверка верхней границы для totalTasks
else if (totalTasks > 1000) {
    console.log("Ошибка: превышена верхняя граница.");
}
// 6. Логическая проверка: выполнено не может быть больше общего количества
else if (completedTasks > totalTasks) {
    console.log("Ошибка: выполнено больше, чем существует.");
}
// 7. Особый случай: задач нет вообще (защита от деления на ноль)
else if (totalTasks === 0 && completedTasks === 0) {
    console.log("Задач пока нет.");
}
// 8. Основной расчёт для валидных данных
else {
    const remainingTasks = totalTasks - completedTasks;
    const progress = (completedTasks / totalTasks) * 100;
    
    // Определение статуса по исходным количествам, а не по округлённому проценту
    let status;
    if (completedTasks === 0) {
        status = "Не начато";
    } else if (completedTasks === totalTasks) {
        status = "Завершено";
    } else {
        status = "В работе";
    }

    // Вывод результатов
    console.log(`Всего задач: ${totalTasks}`);
    console.log(`Выполнено: ${completedTasks}`);
    console.log(`Осталось: ${remainingTasks}`);
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
    console.log(`Статус: ${status}`);
}