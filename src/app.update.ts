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

  @Hears('Создать задачу')
  async createTask(ctx: Context) {
    ctx.session.type = 'create';
    await ctx.reply('Опиши задачу: ');
  }

  @Hears('Cписок задач 📋')
  async listTask(ctx: Context) {
    const todos = await this.appService.getAll();
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

    //Создание
    if (ctx.session.type === 'create') {
      const todos = await this.appService.createTask(message);
      await ctx.reply(showList(todos));
    }

    //Готовность
    if (ctx.session.type === 'done') {
      const todos = await this.appService.doneTask(Number(message));

      if (!todos) {
        await ctx.deleteMessage();
        await ctx.reply('Такой задачи не найдено!');
        return;
      }
      await ctx.reply(showList(todos));
    }

    //Изменение
    if (ctx.session.type === 'edit') {
      const [taskId, taskName] = message.split(' | ');
      const todos = await this.appService.editTask(Number(taskId), taskName);

      if (!todos) {
        await ctx.deleteMessage();
        await ctx.reply('Такой задачи не найдено!');
        return;
      }

      await ctx.reply(showList(todos));
    }

    //Удаление
    if (ctx.session.type === 'remove') {
      const todos = await this.appService.deleteTask(Number(message));

      if (!todos) {
        await ctx.deleteMessage();
        await ctx.reply('Такой задачи не найдено!');
        return;
      }

      await ctx.reply(showList(todos));
    }
  }
}
