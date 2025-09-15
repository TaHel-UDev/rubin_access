const TelegramBot = require('node-telegram-bot-api');
const DirectusAPI = require('./directus');
const config = require('./config');

class AccessBot {
  constructor() {
    this.bot = new TelegramBot(config.telegram.token, { polling: true });
    this.directus = new DirectusAPI();
    this.userSessions = new Map(); // Хранение сессий пользователей
    
    this.setupHandlers();
  }

  setupHandlers() {
    // Команда /start
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id;
      const username = msg.from.username || msg.from.first_name;

      try {
        // Проверяем, есть ли сотрудник в базе
        let employee = await this.directus.getEmployeeByTelegramId(telegramId, msg.from.username);
        
        if (!employee) {
          // Если сотрудника нет, сообщаем об этом
          await this.bot.sendMessage(chatId, 
            `👋 Привет, ${username}!\n\n` +
            `Я бот для управления доступами сотрудников.\n\n` +
            `❌ Вы не найдены в базе сотрудников.\n` +
            `Обратитесь к администратору для добавления вашего Telegram ID в систему.\n\n` +
            `Ваш Telegram ID: \`${telegramId}\`\n` +
            `Ваш username: @${username || 'не указан'}`
          );
        } else {
          // Если сотрудник найден, приветствуем
          await this.bot.sendMessage(chatId, 
            `👋 Добро пожаловать, ${employee.fio}!\n\n` +
            `📋 Должность: ${employee.position}\n` +
            `🏢 Отдел: ${employee.department}\n\n` +
            `Используйте /myaccesses для просмотра ваших доступов.\n` +
            `Используйте /help для списка команд.`
          );
        }
      } catch (error) {
        await this.bot.sendMessage(chatId, 
          '❌ Произошла ошибка при подключении к системе. Попробуйте позже.'
        );
        console.error('Ошибка в команде /start:', error);
      }
    });


    // Команда /myaccesses
    this.bot.onText(/\/myaccesses/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id;

      try {
        // Получаем данные сотрудника
        const employee = await this.directus.getEmployeeByTelegramId(telegramId, msg.from.username);
        
        if (!employee) {
          await this.bot.sendMessage(chatId, 
            '❌ Вы не найдены в базе сотрудников.\n' +
            'Обратитесь к администратору для добавления вашего Telegram ID в систему.\n\n' +
            `Ваш Telegram ID: \`${telegramId}\`\n` +
            `Ваш username: @${msg.from.username || 'не указан'}`
          );
          return;
        }

        // Получаем доступы сотрудника
        const accesses = this.directus.getEmployeeAccesses(employee);
        
        if (accesses.length === 0) {
          await this.bot.sendMessage(chatId, 
            '📋 У вас пока нет назначенных доступов.\n' +
            'Обратитесь к администратору для получения доступов.'
          );
          return;
        }

        // Формируем сообщение с доступами
        let message = `🔑 Ваши доступы (${employee.fio}):\n\n`;
        
        accesses.forEach((access, index) => {
          message += `${index + 1}. **${access.name}**\n`;
          message += `   📝 ${access.description || 'Описание отсутствует'}\n`;
          
          // Добавляем данные для доступа
          if (access.login) {
            message += `   🔐 Логин: \`${access.login}\`\n`;
          }
          if (access.password) {
            message += `   🔑 Пароль: \`${access.password}\`\n`;
          }
          if (access.link) {
            message += `   🔗 Ссылка: ${access.link}\n`;
          }
          
          message += '\n';
        });

        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        
      } catch (error) {
        await this.bot.sendMessage(chatId, 
          '❌ Ошибка при получении доступов. Попробуйте позже.'
        );
        console.error('Ошибка в команде /myaccesses:', error);
      }
    });

    // Команда /help
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      const helpMessage = 
        '🤖 **Доступные команды:**\n\n' +
        '/start - Начать работу с ботом\n' +
        '/myaccesses - Показать ваши доступы\n' +
        '/refresh - Обновить данные\n' +
        '/help - Показать это сообщение\n\n' +
        '💡 **Как пользоваться:**\n' +
        '1. Администратор добавит ваш Telegram ID в систему\n' +
        '2. Администратор назначит вам доступы\n' +
        '3. Используйте /myaccesses для просмотра доступов\n\n' +
        '📞 **Если вас нет в системе:**\n' +
        'Обратитесь к администратору с вашим Telegram ID';

      await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });

    // Команда /refresh
    this.bot.onText(/\/refresh/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        // Проверяем подключение к Directus
        const isConnected = await this.directus.testConnection();
        
        if (isConnected) {
          await this.bot.sendMessage(chatId, '✅ Подключение к системе восстановлено!');
        } else {
          await this.bot.sendMessage(chatId, '❌ Нет подключения к системе. Обратитесь к администратору.');
        }
      } catch (error) {
        await this.bot.sendMessage(chatId, '❌ Ошибка при проверке подключения.');
        console.error('Ошибка в команде /refresh:', error);
      }
    });

    // Обработка неизвестных команд
    this.bot.on('message', (msg) => {
      if (msg.text && msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        this.bot.sendMessage(chatId, 
          '❓ Неизвестная команда. Используйте /help для списка доступных команд.'
        );
      }
    });

    // Обработка ошибок
    this.bot.on('polling_error', (error) => {
      console.error('Ошибка polling:', error);
    });
  }

  // Запуск бота
  async start() {
    try {
      // Проверяем подключение к Directus
      const isConnected = await this.directus.testConnection();
      
      if (!isConnected) {
        console.error('❌ Не удалось подключиться к Directus API');
        process.exit(1);
      }
      
      console.log('✅ Бот успешно запущен!');
      console.log('✅ Подключение к Directus установлено');
    } catch (error) {
      console.error('❌ Ошибка при запуске бота:', error);
      process.exit(1);
    }
  }
}

module.exports = AccessBot;
