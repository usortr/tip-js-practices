"use strict";

const totalTasks = 12;
const completedTasks = 5;
const dailyLimit = 3;

// 1. Проверка типов (отлавливаем строки вместо чисел)
if (typeof totalTasks !== 'number' || typeof completedTasks !== 'number') {
    console.log("Ошибка: вместо числа передана строка.");
} else if (typeof dailyLimit !== 'number') {
    console.log("Ошибка: дневная норма задана строкой.");
}
// 2. Проверка на NaN (так как typeof NaN === 'number')
else if (Number.isNaN(totalTasks) || Number.isNaN(completedTasks) || Number.isNaN(dailyLimit)) {
    console.log("Ошибка: недопустимое числовое значение.");
}
// 3. Проверка на целые числа (для задач)
else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
    console.log("Ошибка: дробное количество.");
}
// 4. Проверка на целое число (для дневной нормы)
else if (!Number.isInteger(dailyLimit)) {
    console.log("Ошибка: дробной дневной нормы быть не должно.");
}
// 5. Проверка на отрицательные значения
else if (totalTasks < 0 || completedTasks < 0) {
    console.log("Ошибка: отрицательное количество.");
}
// 6. Проверка верхней границы для totalTasks
else if (totalTasks > 1000) {
    console.log("Ошибка: превышена верхняя граница.");
}
// 7. Логическая проверка: выполнено не может быть больше общего количества
else if (completedTasks > totalTasks) {
    console.log("Ошибка: выполнено больше, чем существует.");
}
// 8. Проверка нижней границы для dailyLimit (должна быть >= 1, чтобы не было бесконечного цикла)
else if (dailyLimit < 1) {
    console.log("Ошибка: дневная норма должна быть не меньше 1.");
}
// 9. Проверка верхней границы для dailyLimit
else if (dailyLimit > 1000) {
    console.log("Ошибка: превышена верхняя граница нормы.");
}

else {
    const remainingTasks = totalTasks - completedTasks;
    console.log(`Осталось задач: ${remainingTasks}`);

    // Особый случай: работать не над чем
    if (remainingTasks === 0) {
        if (totalTasks === 0) {
            console.log("Задач пока нет.");
        } else {
            console.log("Все задачи уже выполнены.");
        }
        console.log("Потребуется дней: 0");
    } 
    // Основной случай: рассчитываем план по дням
    else {
        let day = 0;
        let currentRemaining = remainingTasks;

        // Цикл выполняется, пока есть хотя бы одна невыполненная задача
        while (currentRemaining > 0) {
            day++;
            // Math.min выбирает меньшее из двух: либо дневную норму, либо то, что осталось
            const tasksToday = Math.min(dailyLimit, currentRemaining);
            
            currentRemaining -= tasksToday;
            console.log(`День ${day}: выполнено ${tasksToday}, осталось ${currentRemaining}`);
        }

        console.log(`Потребуется дней: ${day}`);
    }
}