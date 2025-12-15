const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

// Конфигурация
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const PORT = process.env.PORT || 3000;

// Инициализация
const app = express();
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Хранилище данных
const DATA_DIR = path.join(__dirname, 'data');
const ESTIMATES_FILE = path.join(DATA_DIR, 'estimates.json');

// Инициализация хранилища
async function initStorage() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        try {
            await fs.access(ESTIMATES_FILE);
        } catch {
            await fs.writeFile(ESTIMATES_FILE, JSON.stringify([]));
        }
        
        console.log('Storage initialized');
    } catch (error) {
        console.error('Storage initialization error:', error);
    }
}

// Загрузка смет
async function loadEstimates() {
    try {
        const data = await fs.readFile(ESTIMATES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading estimates:', error);
        return [];
    }
}

// Сохранение смет
async function saveEstimates(estimates) {
    try {
        await fs.writeFile(ESTIMATES_FILE, JSON.stringify(estimates, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving estimates:', error);
        return false;
    }
}

// Добавление сметы
async function addEstimate(estimate, userId, userName) {
    try {
        const estimates = await loadEstimates();
        
        const newEstimate = {
            id: Date.now(),
            userId: userId,
            userName: userName,
            createdAt: new Date().toISOString(),
            ...estimate
        };
        
        estimates.unshift(newEstimate);
        
        if (estimates.length > 1000) {
            estimates.length = 1000;
        }
        
        await saveEstimates(estimates);
        
        return {
            success: true,
            estimateId: newEstimate.id,
            message: 'Смета успешно сохранена'
        };
    } catch (error) {
        console.error('Error adding estimate:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Получение смет пользователя
async function getUserEstimates(userId) {
    try {
        const estimates = await loadEstimates();
        return estimates.filter(estimate => estimate.userId == userId);
    } catch (error) {
        console.error('Error getting user estimates:', error);
        return [];
    }
}

// API эндпоинты
app.post('/api/save-estimate', async (req, res) => {
    try {
        const { estimate, userId, userName } = req.body;
        
        if (!estimate || !userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }
        
        const result = await addEstimate(estimate, userId, userName);
        
        if (result.success) {
            // Отправляем уведомление в Telegram
            const message = `✅ Новая смета сохранена!\n\n` +
                          `👤 Клиент: ${estimate.clientName || 'Не указано'}\n` +
                          `📍 Адрес: ${estimate.address}\n` +
                          `💰 Сумма: ${formatCurrency(estimate.total)}\n` +
                          `📅 Дата: ${new Date().toLocaleDateString('ru-RU')}`;
            
            try {
                await bot.sendMessage(userId, message);
            } catch (botError) {
                console.log('Could not send Telegram notification:', botError.message);
            }
            
            // Отправляем копию администратору если нужно
            const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
            if (ADMIN_CHAT_ID && ADMIN_CHAT_ID !== userId) {
                try {
                    await bot.sendMessage(ADMIN_CHAT_ID, 
                        `📥 Новая смета от пользователя:\n\n` +
                        `👤 ${userName || 'Неизвестный пользователь'}\n` +
                        `📞 ID: ${userId}\n\n` +
                        message
                    );
                } catch (adminError) {
                    console.log('Could not send to admin:', adminError.message);
                }
            }
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

app.get('/api/user-estimates/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const estimates = await getUserEstimates(userId);
        
        res.json({
            success: true,
            count: estimates.length,
            estimates: estimates
        });
        
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

app.get('/api/estimate/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const estimates = await loadEstimates();
        const estimate = estimates.find(e => e.id == id);
        
        if (!estimate) {
            return res.status(404).json({ 
                success: false, 
                error: 'Estimate not found' 
            });
        }
        
        res.json({
            success: true,
            estimate: estimate
        });
        
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Команды бота
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name;
    
    const welcomeMessage = `👋 Привет, ${userName}!\n\n` +
                         `Я бот для расчета смет на натяжные потолки.\n\n` +
                         `📊 Для создания сметы используйте Web App:\n` +
                         `👉 https://your-domain.com\n\n` +
                         `📋 Для просмотра сохраненных смет:\n` +
                         `/estimates - список ваших смет\n` +
                         `/help - помощь\n\n` +
                         `🏢 PotolokForLife - натяжные потолки на всю жизнь!`;
    
    await bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/estimates/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const estimates = await getUserEstimates(userId);
    
    if (estimates.length === 0) {
        await bot.sendMessage(chatId, '📭 У вас нет сохраненных смет.');
        return;
    }
    
    let message = `📋 Ваши сметы (${estimates.length}):\n\n`;
    
    estimates.slice(0, 10).forEach((estimate, index) => {
        const date = new Date(estimate.createdAt).toLocaleDateString('ru-RU');
        message += `${index + 1}. ${estimate.clientName || 'Без имени'}\n` +
                  `   📍 ${estimate.address}\n` +
                  `   💰 ${formatCurrency(estimate.total)}\n` +
                  `   📅 ${date}\n` +
                  `   /estimate_${estimate.id}\n\n`;
    });
    
    if (estimates.length > 10) {
        message += `... и еще ${estimates.length - 10} смет`;
    }
    
    await bot.sendMessage(chatId, message);
});

bot.onText(/\/estimate_(\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const estimateId = match[1];
    
    const estimates = await loadEstimates();
    const estimate = estimates.find(e => e.id == estimateId && e.userId == msg.from.id);
    
    if (!estimate) {
        await bot.sendMessage(chatId, '❌ Смета не найдена или у вас нет доступа.');
        return;
    }
    
    const date = new Date(estimate.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    let message = `📄 Смета №${estimate.id}\n\n` +
                 `📅 Дата: ${date}\n` +
                 `👤 Клиент: ${estimate.clientName || 'Не указано'}\n` +
                 `📞 Телефон: ${estimate.clientPhone || 'Не указан'}\n` +
                 `📍 Адрес: ${estimate.address}\n` +
                 `📏 Площадь: ${estimate.area} м²\n` +
                 `🔧 Система: ${estimate.system}\n\n` +
                 `💰 ИТОГО: ${formatCurrency(estimate.total)}\n` +
                 `💳 Предоплата: ${formatCurrency(estimate.prepayment)}\n` +
                 `💳 Окончательный расчет: ${formatCurrency(estimate.finalPayment)}\n\n` +
                 `📋 Позиций: ${estimate.items.length}\n\n` +
                 `🏢 PotolokForLife\n` +
                 `📞 8(977)531-10-99`;
    
    await bot.sendMessage(chatId, message);
    
    // Отправляем детали по позициям если их немного
    if (estimate.items.length <= 10) {
        let itemsMessage = '📋 Детализация:\n\n';
        estimate.items.forEach((item, index) => {
            itemsMessage += `${index + 1}. ${item.name}\n` +
                          `   ${item.quantity} ${item.unit} × ${formatCurrency(item.price)} = ${formatCurrency(item.total)}\n`;
        });
        
        await bot.sendMessage(chatId, itemsMessage);
    }
});

bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `🆘 Помощь по использованию бота:\n\n` +
                       `📊 Создание сметы:\n` +
                       `1. Используйте Web App для расчетов\n` +
                       `2. Все сметы автоматически сохраняются\n\n` +
                       `📋 Управление сметами:\n` +
                       `/estimates - список ваших смет\n` +
                       `/estimate_ID - просмотр конкретной сметы\n\n` +
                       `🔧 Техническая поддержка:\n` +
                       `📞 8(977)531-10-99\n` +
                       `✉️ Potolokforlife@yandex.ru\n\n` +
                       `🏢 PotolokForLife`;
    
    await bot.sendMessage(chatId, helpMessage);
});

// Обработка данных из Web App
bot.on('message', async (msg) => {
    if (msg.web_app_data) {
        try {
            const data = JSON.parse(msg.web_app_data.data);
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const userName = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();
            
            console.log('Web App data received:', data.type);
            
            switch(data.type) {
                case 'save_estimate':
                    const saveResult = await addEstimate(data.estimate, userId, userName);
                    
                    if (saveResult.success) {
                        await bot.sendMessage(chatId, 
                            `✅ Смета успешно сохранена!\n` +
                            `📋 ID: ${saveResult.estimateId}\n\n` +
                            `Для просмотра всех смет:\n` +
                            `/estimates`
                        );
                    } else {
                        await bot.sendMessage(chatId, 
                            `❌ Ошибка сохранения: ${saveResult.error}`
                        );
                    }
                    break;
                    
                case 'telegram_estimate':
                    const telegramResult = await addEstimate(data.estimate, userId, userName);
                    
                    if (telegramResult.success) {
                        // Отправляем красивую смету
                        const estimateMessage = generateTelegramEstimateMessage(data.estimate);
                        await bot.sendMessage(chatId, estimateMessage, { parse_mode: 'HTML' });
                        
                        await bot.sendMessage(chatId,
                            `📊 Смета сохранена в базе\n` +
                            `📋 Для просмотра: /estimates\n` +
                            `🆔 ID: ${telegramResult.estimateId}`
                        );
                    }
                    break;
                    
                default:
                    console.log('Unknown data type:', data.type);
            }
            
        } catch (error) {
            console.error('Error processing Web App data:', error);
        }
    }
});

// Генерация сообщения для Telegram
function generateTelegramEstimateMessage(estimate) {
    const date = new Date(estimate.timestamp || estimate.createdAt).toLocaleDateString('ru-RU');
    
    let itemsText = '';
    estimate.items.slice(0, 8).forEach((item, index) => {
        itemsText += `${index + 1}. ${item.name}: ${item.quantity} ${item.unit} × ${formatCurrency(item.price)} = ${formatCurrency(item.total)}\n`;
    });
    
    if (estimate.items.length > 8) {
        itemsText += `... и еще ${estimate.items.length - 8} позиций\n`;
    }
    
    return `<b>🏠 СМЕТА НА НАТЯЖНЫЕ ПОТОЛКИ</b>\n\n` +
           `<b>📅 Дата:</b> ${date}\n` +
           `<b>👤 Клиент:</b> ${estimate.clientName || 'Не указано'}\n` +
           `<b>📞 Телефон:</b> ${estimate.clientPhone || 'Не указан'}\n` +
           `<b>📍 Адрес:</b> ${estimate.address}\n` +
           `<b>📏 Площадь:</b> ${estimate.area} м²\n` +
           `<b>🔧 Система:</b> ${estimate.system}\n\n` +
           `<b>📋 ОСНОВНЫЕ ПОЗИЦИИ:</b>\n<pre>${itemsText}</pre>\n` +
           `<b>💰 ИТОГО:</b> <code>${formatCurrency(estimate.total)}</code>\n` +
           `<b>💳 Предоплата (50%):</b> <code>${formatCurrency(estimate.prepayment)}</code>\n` +
           `<b>💳 Окончательный расчет (50%):</b> <code>${formatCurrency(estimate.finalPayment)}</code>\n\n` +
           `<b>🏢 PotolokForLife</b>\n` +
           `<b>📞 8(977)531-10-99</b>\n` +
           `<b>✉️ Potolokforlife@yandex.ru</b>\n\n` +
           `<i>#смета #потолки #${estimate.objectType || 'ремонт'}</i>`;
}

// Форматирование валюты
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(amount || 0).replace('RUB', 'руб.');
}

// Запуск сервера
async function startServer() {
    await initStorage();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🤖 Bot is listening...`);
    });
}

// Обработка ошибок
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Запуск
startServer();
