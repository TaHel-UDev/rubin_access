# Rubin Access Bot

Telegram бот для управления доступами сотрудников через Directus CMS.

## Возможности

- 🔐 Управление доступами сотрудников
- 👤 Автоматическое определение сотрудников по Telegram ID/username
- 📋 Просмотр назначенных доступов
- 🔄 Автоматическая синхронизация с Directus
- 🛡️ Безопасная аутентификация

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Настройте конфигурацию в файле `config.js`:
   - Укажите токен вашего Telegram бота
   - Настройте подключение к Directus
   - Укажите названия коллекций

3. Запустите бота:
```bash
npm start
```

Для разработки с автоперезагрузкой:
```bash
npm run dev
```

## Настройка Directus

### Структура данных

Бот работает с существующей коллекцией **staff** в Directus:

1. **staff** - Сотрудники
   - `id` (Primary Key)
   - `status` (String) - Статус (published/draft) - только published доступны боту
   - `fio` (String) - ФИО сотрудника
   - `telegram_id` (String) - ID пользователя в Telegram
   - `telegram_name` (String) - Username в Telegram (с @)
   - `position` (String) - Должность
   - `department` (String) - Отдел
   - `google_email` (String) - Google почта
   - `yandex_email` (String) - Yandex почта
   - `birthday` (Date) - Дата рождения
   - `keys` (Array) - Массив доступов сотрудника

2. **keys** - Доступы (связанная таблица)
   - `id` (Primary Key)
   - `staff_id` (Many-to-One) - Ссылка на сотрудника
   - `staff_materials_id` (Many-to-One) - Ссылка на материалы доступа
   - `staff_materials_id.name` (String) - Название доступа
   - `staff_materials_id.description` (String) - Описание
   - `staff_materials_id.login` (String) - Логин
   - `staff_materials_id.password` (String) - Пароль
   - `staff_materials_id.link` (String) - Ссылка
   - `staff_materials_id.status` (String) - Статус (published/draft)

### Настройка прав доступа

Убедитесь, что API токен имеет права на чтение коллекции `staff` с полями `*,keys.*.*`.

### Запрос для получения данных

Бот использует следующий запрос к Directus:
```
GET /items/staff?fields=*,keys.*.*&filter[status][_eq]=published&filter[telegram_id][_eq]=123
```

## Команды бота

- `/start` - Начать работу с ботом
- `/myaccesses` - Показать ваши доступы
- `/refresh` - Обновить данные
- `/help` - Показать справку

## Структура проекта

```
rubin_access/
├── index.js          # Точка входа
├── bot.js            # Основная логика бота
├── directus.js       # API клиент для Directus
├── config.js         # Конфигурация
├── package.json      # Зависимости
└── README.md         # Документация
```

## Как работает

1. **Добавление сотрудника**: Администратор добавляет сотрудника в коллекцию `staff` с указанием `telegram_id` или `telegram_name`
2. **Назначение доступов**: Администратор связывает сотрудника с доступами через связанную таблицу `keys`
3. **Использование бота**: Сотрудник пишет боту, который автоматически определяет его по Telegram ID/username и показывает доступы
4. **Фильтрация**: Показываются только сотрудники и доступы со статусом `published`

## Безопасность

- Все данные передаются через защищенное HTTPS соединение
- Токены и пароли не хранятся в коде
- Используется аутентификация через Telegram ID/username
- Данные доступа отображаются только авторизованным пользователям

## Поддержка

При возникновении проблем проверьте:
1. Правильность настройки токенов в `config.js`
2. Доступность Directus API
3. Корректность структуры коллекций
4. Права доступа API токена
