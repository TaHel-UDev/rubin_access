// Конфигурация бота
const config = {
  // Настройки Telegram бота
  telegram: {
    token: '8284368676:AAHZElVWM-Ti-S4Ed9D208Tdq3NLoMYFJtk', // Замените на токен вашего бота
  },
  
  // Настройки Directus
  directus: {
    url: 'https://api.rubinloft.ru',
    // Для аутентификации можно использовать статический токен или логин/пароль
    // В зависимости от настроек вашего Directus
    token: 'gfH4q150IbKbgj_9rkbfqNO9GNO6SZiL', // Замените на токен доступа к Directus
  },
  
  // Настройки базы данных (коллекции в Directus)
  collections: {
    staff: 'staff', // Коллекция сотрудников
    // Доступы хранятся в связанной таблице keys через staff_materials_id
  },
  
  // Настройки бота
  bot: {
    commands: {
      start: '/start',
      help: '/help',
      myAccesses: '/myaccesses',
      refresh: '/refresh'
    }
  }
};

module.exports = config;
