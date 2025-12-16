require('dotenv').config();
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

// Конфигурация
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Ошибка: BOT_TOKEN не установлен в .env файле');
  process.exit(1);
}

// Express сервер
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Маршруты
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Telegram Bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Состояние пользователей
const userStates = new Map();

// Команды бота
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🎉 Добро пожаловать в калькулятор натяжных потолков!

Я помогу вам рассчитать стоимость установки потолка.

📝 Доступные команды:
/calculate - Начать расчет
/help - Помощь
/cancel - Отменить текущий расчет

Выберите команду для начала работы.
  `;
  bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
ℹ️ Инструкция по использованию:

1️⃣ Отправьте /calculate для начала расчета
2️⃣ Введите площадь комнаты (м²)
3️⃣ Выберите тип потолка
4️⃣ Получите расчет стоимости

💡 Цены:
• Матовый: 500 руб/м²
• Глянцевый: 600 руб/м²
• Сатиновый: 550 руб/м²

🌐 Веб-версия: http://localhost:${PORT}
  `;
  bot.sendMessage(chatId, helpMessage);
});

bot.onText(/\/calculate/, (msg) => {
  const chatId = msg.chat.id;
  userStates.set(chatId, { step: 'area' });
  bot.sendMessage(chatId, '📐 Введите площадь комнаты в квадратных метрах (например: 25):');
});

bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  userStates.delete(chatId);
  bot.sendMessage(chatId, '❌ Расчет отменен. Используйте /calculate для нового расчета.');
});

// Обработка сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Пропускаем команды
  if (text && text.startsWith('/')) return;

  const state = userStates.get(chatId);
  if (!state) return;

  if (state.step === 'area') {
    const area = parseFloat(text);
    if (isNaN(area) || area <= 0) {
      bot.sendMessage(chatId, '⚠️ Пожалуйста, введите корректное число больше 0');
      return;
    }

    state.area = area;
    state.step = 'type';
    userStates.set(chatId, state);

    const keyboard = {
      reply_markup: {
        keyboard: [
          ['Матовый (500 руб/м²)'],
          ['Глянцевый (600 руб/м²)'],
          ['Сатиновый (550 руб/м²)']
        ],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    };

    bot.sendMessage(chatId, '🎨 Выберите тип потолка:', keyboard);
  } else if (state.step === 'type') {
    let pricePerMeter = 0;
    let typeName = '';

    if (text.includes('Матовый')) {
      pricePerMeter = 500;
      typeName = 'Матовый';
    } else if (text.includes('Глянцевый')) {
      pricePerMeter = 600;
      typeName = 'Глянцевый';
    } else if (text.includes('Сатиновый')) {
      pricePerMeter = 550;
      typeName = 'Сатиновый';
    } else {
      bot.sendMessage(chatId, '⚠️ Пожалуйста, выберите тип из предложенных вариантов');
      return;
    }

    const totalCost = state.area * pricePerMeter;
    const result = `
✅ Расчет завершен!

📊 Детали:
• Площадь: ${state.area} м²
• Тип потолка: ${typeName}
• Цена за м²: ${pricePerMeter} руб

💰 Итоговая стоимость: ${totalCost.toLocaleString('ru-RU')} руб

Для нового расчета используйте /calculate
    `;

    bot.sendMessage(chatId, result, {
      reply_markup: { remove_keyboard: true }
    });

    userStates.delete(chatId);
  }
});

// Обработка ошибок бота
bot.on('polling_error', (error) => {
  console.error('❌ Ошибка polling:', error.message);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('✅ Сервер запущен');
  console.log(`🌐 Веб-приложение: http://localhost:${PORT}`);
  console.log('🤖 Telegram бот активен');
  console.log(`📅 Время запуска: ${new Date().toLocaleString('ru-RU')}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Остановка сервера...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Остановка сервера...');
  bot.stopPolling();
  process.exit(0);
});
