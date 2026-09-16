"use strict";

const totalTasksInput = " 12 ";
const completedTasksInput = "5";

// 1. Убедимся, что переданы именно строки (это защитит от null, undefined, чисел и объектов)
if (typeof totalTasksInput !== 'string' || typeof completedTasksInput !== 'string') {
    console.log("Ошибка: входные данные должны быть строками.");
} else {
    // 2. Удаляем пробелы по краям
    const totalTrimmed = totalTasksInput.trim();
    const completedTrimmed = completedTasksInput.trim();

    // 3. Отклоняем пустой ввод или строку, состоящую только из пробелов
    if (totalTrimmed === "" || completedTrimmed === "") {
        console.log("Ошибка: пустой ввод недопустим.");
    } else {
        // 4. Преобразуем очищенные строки в числа
        const totalTasks = Number(totalTrimmed);
        const completedTasks = Number(completedTrimmed);

        // 5. Проверка на NaN и Infinity (Number.isFinite отсекает оба этих значения)
        if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks)) {
            console.log("Ошибка: недопустимое числовое значение (NaN или Infinity).");
        }
        // 6. Проверка на целые числа (отсекает дробные, например "2.5")
        else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
            console.log("Ошибка: количество задач должно быть целым числом.");
        }
        // 7. Проверка на отрицательные значения
        else if (totalTasks < 0 || completedTasks < 0) {
            console.log("Ошибка: отрицательное количество недопустимо.");
        }
        // 8. Проверка верхней границы
        else if (totalTasks > 1000) {
            console.log("Ошибка: превышена верхняя граница (максимум 1000).");
        }
        // 9. Логическая проверка: выполнено не может быть больше общего количества
        else if (completedTasks > totalTasks) {
            console.log("Ошибка: выполнено больше, чем существует.");
        }
        // 10. Успешный случай (включая специальную обработку 0, 0)
        else {
            if (totalTasks === 0 && completedTasks === 0) {
                console.log("Задач пока нет.");
            } else {
                const remainingTasks = totalTasks - completedTasks;
                const progress = (completedTasks / totalTasks) * 100;
                
                let status;
                if (completedTasks === 0) {
                    status = "Не начато";
                } else if (completedTasks === totalTasks) {
                    status = "Завершено";
                } else {
                    status = "В работе";
                }

                console.log(`Всего задач: ${totalTasks}`);
                console.log(`Выполнено: ${completedTasks}`);
                console.log(`Осталось: ${remainingTasks}`);
                console.log(`Прогресс: ${progress.toFixed(1)}%`);
                console.log(`Статус: ${status}`);
            }
        }
    }
}