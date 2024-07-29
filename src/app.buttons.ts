import { Markup } from 'telegraf';

export function actionButtons() {
  return Markup.keyboard([
    ['Список задач 📋', 'Редактировать 🖊️', 'Завершить  💚'],
    ['Удалить ❌'],
  ]).resize();
}
