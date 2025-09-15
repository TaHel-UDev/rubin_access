const AccessBot = require('./bot');
const config = require('./config');
const http = require('http');

// Создаем и запускаем бота
const bot = new AccessBot();

// Создаем простой веб-сервер для проверки работы
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'ok', 
    message: 'Rubin Access Bot is running',
    timestamp: new Date().toISOString()
  }));
});

// Запускаем сервер
server.listen(config.server.port, () => {
  console.log(`🌐 Сервер запущен на порту ${config.server.port}`);
});

// Обработка завершения процесса
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT. Завершение работы...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM. Завершение работы...');
  process.exit(0);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанное отклонение Promise:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Необработанное исключение:', error);
  process.exit(1);
});

// Запускаем бота
bot.start().catch((error) => {
  console.error('❌ Критическая ошибка при запуске бота:', error);
  process.exit(1);
});
