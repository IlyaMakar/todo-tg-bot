import {
  Ctx,
  Hears,
  InjectBot,
  Message,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { actionButtons } from './app.buttons';
import { AppService } from './app.service';
import { showList } from './app.utils';
import { Context } from './context.interface';

const todos = [
  {
    id: 1,
    name: 'Купить',
    isCompleted: false,
  },
  {
    id: 2,
    name: 'помыть',
    isCompleted: false,
  },
  {
    id: 3,
    name: 'Поговорить',
    isCompleted: true,
  },
];

@Update()
export class AppUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly appService: AppService,
  ) {}

  @Start()
  async startCommand(ctx: Context) {
    await ctx.reply('Hi! Friend');
    await ctx.reply('Что ты хочешь сделать?', actionButtons());
  }

  @Hears('Cписок задач 📋')
  async listTask(ctx: Context) {
    await ctx.deleteMessage();
    await ctx.reply(showList(todos));
  }

  @Hears('Завершить  💚')
  async doneTask(ctx: Context) {
    ctx.session.type = 'done';
    await ctx.deleteMessage();
    await ctx.reply('Напиши ID задачи:');
  }
  @Hears('Редактировать 🖊️')
  async editTask(ctx: Context) {
    ctx.session.type = 'edit';
    await ctx.deleteMessage();
    await ctx.replyWithHTML(
      'Напиши ID задачи и новое название: \n\n' +
        'В формате - <b>1 | Новое название</b>',
    );
  }
  @Hears('Удалить ❌')
  async removeTask(ctx: Context) {
    ctx.session.type = 'remove';
    await ctx.deleteMessage();
    await ctx.reply('Напиши ID задачи:');
  }

  @On('text')
  async getMessege(@Message('text') message: string, @Ctx() ctx: Context) {
    if (!ctx.session.type) return;

    //Готовность
    if (ctx.session.type === 'done') {
      const todo = todos.find((t) => t.id === Number(message));

      if (!todo) {
        await ctx.deleteMessage();
        await ctx.reply('Такой задачи не найдено!');
        return;
      }

      todo.isCompleted = !todo.isCompleted;
      await ctx.reply(showList(todos));
    }

    //Изменение
    if (ctx.session.type === 'edit') {
      const [taskId, taskName] = message.split(' | ');
      const todo = todos.find((t) => t.id === Number(taskId));

      if (!todo) {
        await ctx.deleteMessage();
        await ctx.reply('Такой задачи не найдено!');
        return;
      }

      todo.name = taskName;
      await ctx.reply(showList(todos));
    }

    //Удаление
    if (ctx.session.type === 'remove') {
      const todo = todos.find((t) => t.id === Number(message));
      if (!todo) {
        await ctx.deleteMessage();
        await ctx.reply('Такой задачи не найдено!');
        return;
      }

      await ctx.reply(showList(todos.filter((t) => t.id !== Number(message))));
    }
  }
}
