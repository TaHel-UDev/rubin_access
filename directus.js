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
          fields: '*,keys.*.*',
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
      if (!employee || !employee.keys) {
        return [];
      }

      // Фильтруем только опубликованные доступы
      return employee.keys.filter(key => 
        key.staff_materials_id && 
        key.staff_materials_id.status === 'published'
      ).map(key => key.staff_materials_id);
    } catch (error) {
      console.error('Ошибка при обработке доступов:', error.message);
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
