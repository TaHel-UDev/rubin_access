const axios = require('axios');
const config = require('./config');

class DirectusAPI {
  constructor() {
    this.baseURL = config.directus.url;
    this.token = config.directus.token;
    
    // Создаем экземпляр axios с базовой конфигурацией
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'RubinAccessBot/1.0',
        'Accept': 'application/json',
        'Origin': 'https://api.rubinloft.ru',
        'Referer': 'https://api.rubinloft.ru'
      },
      timeout: 10000, // 10 секунд таймаут
      withCredentials: false // Отключаем cookies
    });
  }

  // Получить сотрудника по Telegram ID или username
  async getEmployeeByTelegramId(telegramId, username = null) {
    try {
      console.log(`🔍 Ищем сотрудника: telegram_id=${telegramId}, username=${username}`);
      
      // Сначала ищем по telegram_id
      let response = await this.api.get(`/items/${config.collections.staff}`, {
        params: {
          fields: '*,keys.staff_materials_id.*',
          filter: {
            status: {
              _eq: 'published'
            },
            telegram_id: {
              _eq: telegramId
            }
          }
        }
      });
      
      console.log(`📊 Ответ от Directus (по telegram_id):`, response.status);
      console.log(`📊 Данные ответа:`, JSON.stringify(response.data, null, 2));
      let employee = response.data.data && response.data.data.length > 0 ? response.data.data[0] : null;
      
      // Если не найден по ID и есть username, ищем по username
      if (!employee && username) {
        // Убираем @ из username если есть
        const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
        
        console.log(`🔍 Ищем по username: @${cleanUsername}`);
        
        response = await this.api.get(`/items/${config.collections.staff}`, {
          params: {
            fields: '*,keys.*.*',
            filter: {
              status: {
                _eq: 'published'
              },
              telegram_name: {
                _eq: `@${cleanUsername}`
              }
            }
          }
        });
        
        console.log(`📊 Ответ от Directus (по username):`, response.status);
        console.log(`📊 Данные ответа (username):`, JSON.stringify(response.data, null, 2));
        employee = response.data.data && response.data.data.length > 0 ? response.data.data[0] : null;
      }
      
      if (employee) {
        console.log(`✅ Сотрудник найден: ${employee.fio}`);
      } else {
        console.log(`❌ Сотрудник не найден`);
      }
      
      return employee;
    } catch (error) {
      console.error('❌ Ошибка при получении сотрудника:', error.response?.status, error.response?.statusText);
      console.error('❌ Детали ошибки:', error.response?.data);
      
      if (error.response?.status === 401) {
        throw new Error('Ошибка аутентификации в Directus. Проверьте токен доступа.');
      } else if (error.response?.status === 403) {
        throw new Error('Нет прав доступа к коллекции staff. Проверьте права токена.');
      } else {
        throw new Error(`Ошибка Directus API: ${error.response?.status} ${error.response?.statusText}`);
      }
    }
  }

  // Получить доступы сотрудника (keys уже включены в данные сотрудника)
  getEmployeeAccesses(employee) {
    try {
      console.log('🔍 Обрабатываем доступы для сотрудника:', employee.fio);
      console.log('🔑 Исходные keys:', employee.keys ? employee.keys.length : 'нет');
      console.log('🔑 Полная структура keys:', JSON.stringify(employee.keys, null, 2));
      
      if (!employee || !employee.keys) {
        console.log('❌ Нет данных сотрудника или keys');
        return [];
      }

      // Проверяем, является ли keys массивом ID или объектов
      if (Array.isArray(employee.keys) && employee.keys.length > 0 && typeof employee.keys[0] === 'number') {
        console.log('⚠️ Keys содержит только ID, нужно получить полные данные');
        return [];
      }

      // Выводим детали каждого ключа
      employee.keys.forEach((key, index) => {
        console.log(`🔑 Ключ ${index + 1}:`, {
          id: key.id,
          staff_materials_id: key.staff_materials_id ? {
            id: key.staff_materials_id.id,
            name: key.staff_materials_id.name,
            status: key.staff_materials_id.status
          } : 'нет данных'
        });
      });

      // Фильтруем только опубликованные доступы
      const publishedAccesses = employee.keys.filter(key => {
        const hasMaterials = key.staff_materials_id;
        const isPublished = hasMaterials && key.staff_materials_id.status === 'published';
        
        console.log(`🔍 Ключ ${key.id}: hasMaterials=${hasMaterials}, isPublished=${isPublished}`);
        
        return hasMaterials && isPublished;
      }).map(key => key.staff_materials_id);
      
      console.log('✅ Опубликованные доступы:', publishedAccesses.length);
      
      return publishedAccesses;
    } catch (error) {
      console.error('❌ Ошибка при обработке доступов:', error.message);
      return [];
    }
  }


  // Проверить подключение к Directus
  async testConnection() {
    try {
      console.log('🔍 Проверяем подключение к Directus...');
      console.log('🌐 URL:', this.baseURL);
      console.log('🔑 Токен:', this.token ? 'установлен' : 'отсутствует');
      
      // Проверяем IP адрес сервера
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        console.log('🌍 IP адрес сервера:', ipResponse.data.ip);
      } catch (ipError) {
        console.log('⚠️ Не удалось получить IP адрес');
      }
      
      const response = await this.api.get('/server/ping');
      console.log('✅ Directus ping успешен:', response.status);
      
      // Дополнительная проверка - попробуем получить коллекции
      try {
        const collectionsResponse = await this.api.get('/collections');
        console.log('✅ Доступ к коллекциям:', collectionsResponse.status);
        console.log('📋 Доступные коллекции:', collectionsResponse.data.data?.map(c => c.collection).join(', '));
        
        // Проверяем структуру коллекции staff
        try {
          const staffResponse = await this.api.get('/items/staff', {
            params: {
              limit: 1,
              fields: '*,keys.staff_materials_id.*'
            }
          });
          console.log('📊 Структура staff (первая запись):', JSON.stringify(staffResponse.data.data?.[0], null, 2));
        } catch (staffError) {
          console.log('⚠️ Ошибка доступа к staff:', staffError.response?.status);
        }
      } catch (collectionsError) {
        console.log('⚠️ Ошибка доступа к коллекциям:', collectionsError.response?.status);
      }
      
      return response.status === 200;
    } catch (error) {
      console.error('❌ Ошибка подключения к Directus:', error.response?.status, error.response?.statusText);
      console.error('❌ Детали ошибки:', error.response?.data);
      console.error('❌ Заголовки ответа:', error.response?.headers);
      return false;
    }
  }
}

module.exports = DirectusAPI;
