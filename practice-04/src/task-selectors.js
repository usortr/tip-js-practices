export function getVisibleTasks(tasks, filter = "all") {
  if (filter === "pending") {
    return tasks.filter((task) => !task.completed);
  }
  if (filter === "completed") {
    return tasks.filter((task) => task.completed);
  }
  // Для "all" возвращаем поверхностную копию, чтобы сохранить контракт "нового массива"
  return [...tasks];
}