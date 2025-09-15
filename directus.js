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
        'Content-Type': 'application/json'
      }
    });
  }

  // Получить сотрудника по Telegram ID или username
  async getEmployeeByTelegramId(telegramId, username = null) {
    try {
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
      
      let employee = response.data.data && response.data.data.length > 0 ? response.data.data[0] : null;
      
      // Если не найден по ID и есть username, ищем по username
      if (!employee && username) {
        // Убираем @ из username если есть
        const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
        
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
        
        employee = response.data.data && response.data.data.length > 0 ? response.data.data[0] : null;
      }
      
      return employee;
    } catch (error) {
      console.error('Ошибка при получении сотрудника:', error.message);
      throw new Error('Не удалось найти сотрудника');
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
      const response = await this.api.get('/server/ping');
      return response.status === 200;
    } catch (error) {
      console.error('Ошибка подключения к Directus:', error.message);
      return false;
    }
  }
}

module.exports = DirectusAPI;
