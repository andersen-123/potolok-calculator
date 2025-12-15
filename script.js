// Данные систем
const systemsData = {
    garpun: {
        name: "Гарпунная система",
        basicServices: [
            { id: 1, name: "Полотно MSD Premium белое матовое", unit: "м²", price: 610, basePrice: 550 },
            { id: 2, name: "Профиль стеновой/потолочный гарпунный", unit: "м.п.", price: 310, basePrice: 280 },
            { id: 3, name: "Вставка по периметру гарпунная", unit: "м.п.", price: 220, basePrice: 200 }
        ],
        lightingServices: [
            { id: 4, name: "Монтаж закладных под светильники", unit: "шт.", price: 780, basePrice: 700 },
            { id: 5, name: "Монтаж закладных под сдвоенные светильники", unit: "шт.", price: 1350, basePrice: 1200 },
            { id: 6, name: "Монтаж закладных под люстру", unit: "шт.", price: 1100, basePrice: 900 }
        ],
        additionalServices: [
            { id: 7, name: "Монтаж закладной под потолочный карниз", unit: "м.п.", price: 650, basePrice: 550 },
            { id: 8, name: "Установка потолочного карниза", unit: "м.п.", price: 270, basePrice: 220 },
            { id: 9, name: "Установка разделителей", unit: "м.п.", price: 1700, basePrice: 1500 }
        ]
    },
    garpun10: {
        name: "Гарпунная система (+10%)",
        basicServices: [
            { id: 1, name: "Полотно MSD Premium белое матовое", unit: "м²", price: 670, basePrice: 610 },
            { id: 2, name: "Профиль стеновой/потолочный гарпунный", unit: "м.п.", price: 340, basePrice: 310 },
            { id: 3, name: "Вставка по периметру гарпунная", unit: "м.п.", price: 240, basePrice: 220 }
        ],
        lightingServices: [
            { id: 4, name: "Монтаж закладных под светильники", unit: "шт.", price: 900, basePrice: 780 },
            { id: 5, name: "Монтаж закладных под сдвоенные светильники", unit: "шт.", price: 1500, basePrice: 1350 },
            { id: 6, name: "Монтаж закладных под люстру", unit: "шт.", price: 1200, basePrice: 1100 }
        ],
        additionalServices: [
            { id: 7, name: "Монтаж закладной под потолочный карниз", unit: "м.п.", price: 720, basePrice: 650 },
            { id: 8, name: "Установка потолочного карниза", unit: "м.п.", price: 300, basePrice: 270 },
            { id: 9, name: "Установка разделителей", unit: "м.п.", price: 1900, basePrice: 1700 }
        ]
    }
};

// Конфигурация бота
const BOT_CONFIG = {
    // Замените на реальный URL вашего сервера
    SERVER_URL: 'https://your-server.com/bot',
    // Или используйте локальный сервер для разработки
    LOCAL_SERVER: 'http://localhost:3000/bot',
    
    // Токен бота (замените на реальный)
    BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',
    
    // ID чата для сохранения смет (можно получить через @userinfobot)
    ADMIN_CHAT_ID: 'YOUR_CHAT_ID_HERE'
};

// Глобальные переменные
let currentSystem = 'garpun';
let selectedServices = [];
let tg = null;
let currentEstimate = null;
let estimatesHistory = [];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Initializing application...');
        initializeTelegram();
        initializeNavigation();
        initializeSystemSelector();
        loadServices();
        setupEventListeners();
        calculateEstimate();
        updateDocumentPreview();
        loadHistory();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showToast('Ошибка загрузки приложения');
    }
});

// Инициализация Telegram Web App
function initializeTelegram() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            console.log('Telegram Web App detected:', tg.initData);
            
            // Расширяем на весь экран
            tg.expand();
            
            // Показываем кнопку закрытия
            tg.BackButton.show();
            tg.BackButton.onClick(() => {
                tg.close();
            });
            
            // Включаем подтверждение закрытия
            tg.enableClosingConfirmation();
            
            // Показываем статус Telegram
            const statusEl = document.getElementById('telegramStatus');
            if (statusEl) statusEl.style.display = 'block';
            
            // Получаем данные пользователя
            const user = tg.initDataUnsafe?.user;
            if (user) {
                console.log('User data:', user);
                // Автозаполняем имя пользователя если поле пустое
                const clientNameInput = document.getElementById('clientName');
                if (clientNameInput && !clientNameInput.value) {
                    if (user.first_name || user.last_name) {
                        clientNameInput.value = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                    }
                }
            }
            
            // Устанавливаем тему
            if (tg.colorScheme === 'dark') {
                document.body.classList.add('dark-theme');
            }
            
        } else {
            console.log('Running outside Telegram Web App');
        }
    } catch (error) {
        console.warn('Ошибка инициализации Telegram:', error);
    }
}

// Инициализация навигации
function initializeNavigation() {
    try {
        const navTabs = document.querySelectorAll('.nav-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetTab = this.dataset.tab;
                
                // Обновляем активные табы
                navTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${targetTab}-tab`) {
                        content.classList.add('active');
                    }
                });
                
                // Обновляем контент для активной вкладки
                switch(targetTab) {
                    case 'results':
                        calculateEstimate();
                        updateDocumentPreview();
                        break;
                    case 'history':
                        loadHistory();
                        break;
                }
            });
        });
    } catch (error) {
        console.error('Ошибка навигации:', error);
    }
}

// Инициализация выбора системы
function initializeSystemSelector() {
    try {
        document.querySelectorAll('.system-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.system-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentSystem = this.dataset.system;
                loadServices();
                calculateEstimate();
                updateDocumentPreview();
                showToast(`Система: ${systemsData[currentSystem].name}`);
            });
        });
    } catch (error) {
        console.error('Ошибка выбора системы:', error);
    }
}

// Загрузка услуг
function loadServices() {
    try {
        const system = systemsData[currentSystem];
        if (!system) return;
        
        // Загрузка основных услуг
        loadServiceList('basicServicesList', system.basicServices, 'basic');
        
        // Загрузка освещения
        loadServiceList('lightingServicesList', system.lightingServices, 'lighting');
        
        // Загрузка дополнительных услуг
        loadServiceList('additionalServicesList', system.additionalServices, 'additional');
        
        // Обновляем обработчики
        updateQuantityInputListeners();
        
    } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
        showToast('Ошибка загрузки списка услуг');
    }
}

// Загрузка списка услуг
function loadServiceList(elementId, services, type) {
    const listElement = document.getElementById(elementId);
    if (!listElement) return;
    
    let html = '';
    services.forEach(service => {
        const existingQuantity = getExistingQuantity(service.id, type);
        
        html += `
            <div class="service-item">
                <div class="service-info">
                    <div class="service-name">${service.name}</div>
                    <div class="service-unit">${service.unit}</div>
                </div>
                <div class="service-controls">
                    <div class="service-price">${formatCurrency(service.price)}</div>
                    <input type="number" class="quantity-input" 
                           data-id="${service.id}" data-type="${type}"
                           min="0" value="${existingQuantity}">
                </div>
            </div>
        `;
    });
    
    listElement.innerHTML = html;
}

// Получение существующего количества
function getExistingQuantity(id, type) {
    const service = selectedServices.find(s => s.id === id && s.type === type);
    return service ? service.quantity : 0;
}

// Обновление обработчиков количества
function updateQuantityInputListeners() {
    document.querySelectorAll('.quantity-input').forEach(input => {
        // Удаляем старые обработчики
        input.removeEventListener('input', handleQuantityChange);
        // Добавляем новый обработчик
        input.addEventListener('input', handleQuantityChange);
    });
}

// Обработчик изменения количества
function handleQuantityChange() {
    calculateEstimate();
    updateDocumentPreview();
}

// Настройка обработчиков событий
function setupEventListeners() {
    try {
        // Кнопки расчета
        ['calculateBtn', 'calculateBtn2', 'calculateBtn3'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => {
                calculateEstimate();
                updateDocumentPreview();
            });
        });
        
        // Кнопки сброса
        ['resetBtn', 'resetBtn2', 'resetBtn3'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', resetCalculator);
        });
        
        // Кнопки сохранения
        ['saveBtn', 'saveBtn2', 'saveBtn3'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', saveEstimateToBot);
        });
        
        // Поля ввода
        ['area', 'perimeter', 'objectAddress', 'clientName', 'clientPhone'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    calculateEstimate();
                    updateDocumentPreview();
                });
            }
        });
        
        // Защита от отрицательных значений
        document.addEventListener('input', function(e) {
            if (e.target.type === 'number' && e.target.value < 0) {
                e.target.value = 0;
                calculateEstimate();
                updateDocumentPreview();
            }
        });
        
    } catch (error) {
        console.error('Ошибка настройки обработчиков:', error);
    }
}

// Расчет сметы
function calculateEstimate() {
    try {
        const system = systemsData[currentSystem];
        if (!system) return;
        
        const area = parseFloat(document.getElementById('area').value) || 0;
        const perimeter = parseFloat(document.getElementById('perimeter').value) || 0;
        
        // Собираем все услуги
        selectedServices = collectSelectedServices(system);
        
        // Автоматически добавляем основные элементы если указана площадь/периметр
        addAutomaticServices(system, area, perimeter);
        
        // Обновляем интерфейс
        updateInterfaceTotals();
        
        // Обновляем таблицу
        updateSummaryTable();
        
        // Сохраняем текущую смету
        saveCurrentEstimate();
        
    } catch (error) {
        console.error('Ошибка расчета:', error);
        showToast('Ошибка расчета сметы');
    }
}

// Сбор выбранных услуг
function collectSelectedServices(system) {
    const services = [];
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        const quantity = parseInt(input.value) || 0;
        if (quantity > 0) {
            const id = parseInt(input.dataset.id);
            const type = input.dataset.type;
            
            let service;
            if (type === 'basic') service = system.basicServices.find(s => s.id === id);
            else if (type === 'lighting') service = system.lightingServices.find(s => s.id === id);
            else if (type === 'additional') service = system.additionalServices.find(s => s.id === id);
            
            if (service) {
                services.push({
                    ...service,
                    type: type,
                    quantity: quantity,
                    total: service.price * quantity
                });
            }
        }
    });
    
    return services;
}

// Добавление автоматических услуг
function addAutomaticServices(system, area, perimeter) {
    // Полотно
    if (area > 0 && !selectedServices.some(s => s.id === 1)) {
        const canvasService = system.basicServices.find(s => s.id === 1);
        if (canvasService) {
            selectedServices.push({
                ...canvasService,
                type: 'basic',
                quantity: area,
                total: canvasService.price * area
            });
            // Обновляем поле ввода
            const canvasInput = document.querySelector('.quantity-input[data-id="1"]');
            if (canvasInput) canvasInput.value = area;
        }
    }
    
    // Профиль
    if (perimeter > 0 && !selectedServices.some(s => s.id === 2)) {
        const profileService = system.basicServices.find(s => s.id === 2);
        if (profileService) {
            selectedServices.push({
                ...profileService,
                type: 'basic',
                quantity: perimeter,
                total: profileService.price * perimeter
            });
            const profileInput = document.querySelector('.quantity-input[data-id="2"]');
            if (profileInput) profileInput.value = perimeter;
        }
    }
    
    // Вставка
    if (perimeter > 0 && !selectedServices.some(s => s.id === 3)) {
        const insertService = system.basicServices.find(s => s.id === 3);
        if (insertService) {
            selectedServices.push({
                ...insertService,
                type: 'basic',
                quantity: perimeter,
                total: insertService.price * perimeter
            });
            const insertInput = document.querySelector('.quantity-input[data-id="3"]');
            if (insertInput) insertInput.value = perimeter;
        }
    }
}

// Обновление итогов в интерфейсе
function updateInterfaceTotals() {
    const totalCost = selectedServices.reduce((sum, s) => sum + s.total, 0);
    const materialsCost = selectedServices.reduce((sum, s) => sum + (s.basePrice * s.quantity), 0);
    const workCost = totalCost - materialsCost;
    
    // Обновляем отображение
    document.getElementById('materialsCost').textContent = formatCurrency(materialsCost);
    document.getElementById('workCost').textContent = formatCurrency(workCost);
    document.getElementById('totalCost').textContent = formatCurrency(totalCost);
    
    // Обновляем оплату
    const prepayment = totalCost * 0.5;
    const finalPayment = totalCost * 0.5;
    document.getElementById('prepaymentAmount').textContent = formatCurrency(prepayment);
    document.getElementById('finalPaymentAmount').textContent = formatCurrency(finalPayment);
}

// Обновление таблицы
function updateSummaryTable() {
    const tableBody = document.getElementById('summaryTableBody');
    if (!tableBody) return;
    
    if (selectedServices.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Добавьте элементы для расчета</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    selectedServices.forEach(item => {
        html += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity} ${item.unit}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.total)}</td>
            </tr>
        `;
    });
    
    const totalCost = selectedServices.reduce((sum, s) => sum + s.total, 0);
    html += `
        <tr class="total-row">
            <td colspan="3"><strong>ИТОГО:</strong></td>
            <td><strong>${formatCurrency(totalCost)}</strong></td>
        </tr>
    `;
    
    tableBody.innerHTML = html;
}

// Сохранение текущей сметы
function saveCurrentEstimate() {
    const address = document.getElementById('objectAddress').value || 'Не указан';
    const clientName = document.getElementById('clientName').value || 'Не указано';
    const clientPhone = document.getElementById('clientPhone').value || 'Не указано';
    const area = parseFloat(document.getElementById('area').value) || 0;
    const perimeter = parseFloat(document.getElementById('perimeter').value) || 0;
    const objectType = document.getElementById('objectType').value;
    const roomCount = parseInt(document.getElementById('roomCount').value) || 1;
    
    const totalCost = selectedServices.reduce((sum, s) => sum + s.total, 0);
    
    currentEstimate = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        system: systemsData[currentSystem].name,
        address: address,
        clientName: clientName,
        clientPhone: clientPhone,
        objectType: objectType,
        roomCount: roomCount,
        area: area,
        perimeter: perimeter,
        items: selectedServices.map(item => ({
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            price: item.price,
            total: item.total
        })),
        total: totalCost,
        prepayment: totalCost * 0.5,
        finalPayment: totalCost * 0.5
    };
    
    // Сохраняем в localStorage для истории
    saveToLocalHistory(currentEstimate);
}

// Сохранение в локальную историю
function saveToLocalHistory(estimate) {
    try {
        let history = JSON.parse(localStorage.getItem('potolokHistory') || '[]');
        history = history.filter(item => item.id !== estimate.id);
        history.unshift(estimate);
        
        if (history.length > 100) history.length = 100;
        
        localStorage.setItem('potolokHistory', JSON.stringify(history));
        
    } catch (error) {
        console.error('Ошибка сохранения в историю:', error);
    }
}

// Обновление предпросмотра документа
function updateDocumentPreview() {
    try {
        const preview = document.getElementById('documentPreview');
        if (!preview || !currentEstimate) return;
        
        preview.innerHTML = generateDocumentHTML(currentEstimate);
        
    } catch (error) {
        console.error('Ошибка обновления предпросмотра:', error);
    }
}

// Генерация HTML документа
function generateDocumentHTML(estimate) {
    const date = new Date(estimate.timestamp);
    const formattedDate = date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const estimateNumber = 'СМ-' + date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
        String(date.getDate()).padStart(2, '0') + '-' + 
        String(date.getHours()).padStart(2, '0') + 
        String(date.getMinutes()).padStart(2, '0');
    
    let itemsHtml = '';
    estimate.items.forEach((item, index) => {
        itemsHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.unit}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.total)}</td>
            </tr>
        `;
    });
    
    const totalInWords = numberToWords(estimate.total);
    
    return `
        <div class="document-header">
            <div class="document-title">СМЕТА № ${estimateNumber}</div>
            <div class="document-subtitle">на выполнение работ по монтажу натяжных потолков</div>
        </div>
        <div class="document-content">
            <div class="document-section">
                <div class="document-section-title">1. ОБЩИЕ СВЕДЕНИЯ</div>
                <div class="document-row">
                    <div class="label">Дата составления:</div>
                    <div class="value">${formattedDate}</div>
                </div>
                <div class="document-row">
                    <div class="label">Заказчик:</div>
                    <div class="value">${estimate.clientName || 'Не указано'}</div>
                </div>
                <div class="document-row">
                    <div class="label">Телефон:</div>
                    <div class="value">${estimate.clientPhone || 'Не указан'}</div>
                </div>
                <div class="document-row">
                    <div class="label">Исполнитель:</div>
                    <div class="value">PotolokForLife</div>
                </div>
            </div>
            
            <div class="document-section">
                <div class="document-section-title">2. ХАРАКТЕРИСТИКИ ОБЪЕКТА</div>
                <div class="document-row">
                    <div class="label">Адрес объекта:</div>
                    <div class="value">${estimate.address}</div>
                </div>
                <div class="document-row">
                    <div class="label">Тип объекта:</div>
                    <div class="value">${estimate.objectType}</div>
                </div>
                <div class="document-row">
                    <div class="label">Площадь потолка:</div>
                    <div class="value">${estimate.area} м²</div>
                </div>
                <div class="document-row">
                    <div class="label">Периметр помещения:</div>
                    <div class="value">${estimate.perimeter} м.п.</div>
                </div>
                <div class="document-row">
                    <div class="label">Система монтажа:</div>
                    <div class="value">${estimate.system}</div>
                </div>
            </div>
            
            <div class="document-section">
                <div class="document-section-title">3. ПЕРЕЧЕНЬ РАБОТ И МАТЕРИАЛОВ</div>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Наименование работ/материалов</th>
                            <th>Ед. изм.</th>
                            <th>Кол-во</th>
                            <th>Цена за ед., руб.</th>
                            <th>Стоимость, руб.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml || '<tr><td colspan="6" style="text-align: center;">Нет данных</td></tr>'}
                        <tr class="total-row">
                            <td colspan="5" style="text-align: right;"><strong>ВСЕГО:</strong></td>
                            <td><strong>${formatCurrency(estimate.total)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="document-section">
                <div class="document-section-title">4. УСЛОВИЯ ОПЛАТЫ</div>
                <div class="document-row">
                    <div class="label">Предоплата (50%):</div>
                    <div class="value">${formatCurrency(estimate.prepayment)}</div>
                </div>
                <div class="document-row">
                    <div class="label">Окончательный расчет (50%):</div>
                    <div class="value">${formatCurrency(estimate.finalPayment)}</div>
                </div>
                <div class="document-row">
                    <div class="label">Всего к оплате:</div>
                    <div class="value">${formatCurrency(estimate.total)} (${totalInWords})</div>
                </div>
            </div>
            
            <div class="document-signature">
                <div class="signature-line">
                    <div class="signature-block">
                        <div class="signature-line-dashed"></div>
                        <div class="signature-label">Исполнитель</div>
                        <div class="signature-label">PotolokForLife</div>
                    </div>
                    <div class="signature-block">
                        <div class="signature-line-dashed"></div>
                        <div class="signature-label">Заказчик</div>
                        <div class="signature-label">${estimate.clientName || '_________________________'}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="document-footer">
            <div>Исполнитель: PotolokForLife | Тел: 8(977)531-10-99 | Email: Potolokforlife@yandex.ru</div>
            <div>Адрес: г. Пушкино | Смета действительна в течение 30 дней</div>
        </div>
    `;
}

// Сохранение сметы в боте
async function saveEstimateToBot() {
    try {
        if (!currentEstimate) {
            showToast('❌ Сначала создайте смету');
            return;
        }
        
        showLoading('Сохраняем смету в боте...');
        
        if (tg && tg.sendData) {
            // Отправляем данные через Telegram Web App
            const estimateData = {
                type: 'save_estimate',
                estimate: currentEstimate,
                user: tg.initDataUnsafe?.user || {},
                timestamp: new Date().toISOString()
            };
            
            tg.sendData(JSON.stringify(estimateData));
            
            setTimeout(() => {
                hideLoading();
                showToast('✅ Смета отправлена в бота!');
            }, 1000);
            
        } else if (isBotServerAvailable()) {
            // Отправляем на сервер бота
            const response = await sendToBotServer(currentEstimate);
            
            hideLoading();
            if (response.success) {
                showToast('✅ Смета сохранена в базе бота!');
                console.log('Сохраненная смета:', response.data);
            } else {
                showToast('❌ Ошибка сохранения: ' + response.error);
            }
            
        } else {
            // Локальное сохранение
            hideLoading();
            saveEstimateLocally();
            showToast('✅ Смета сохранена локально');
        }
        
    } catch (error) {
        console.error('Ошибка сохранения в боте:', error);
        hideLoading();
        showToast('❌ Ошибка сохранения');
    }
}

// Отправка в Telegram бота
async function sendToTelegramBot() {
    try {
        if (!currentEstimate) {
            showToast('❌ Сначала создайте смету');
            return;
        }
        
        showLoading('Отправляем смету в бота...');
        
        if (tg && tg.sendData) {
            // Отправка через Telegram Web App
            const estimateData = {
                type: 'telegram_estimate',
                estimate: currentEstimate,
                format: 'full',
                user: tg.initDataUnsafe?.user || {},
                timestamp: new Date().toISOString()
            };
            
            tg.sendData(JSON.stringify(estimateData));
            
            setTimeout(() => {
                hideLoading();
                showToast('✅ Смета отправлена в Telegram!');
                
                // Показываем уведомление в Telegram
                if (tg.showAlert) {
                    tg.showAlert('Смета отправлена! Она сохранена в базе бота и доступна в меню /estimates');
                }
            }, 1500);
            
        } else {
            // Альтернативный метод
            hideLoading();
            const message = generateTelegramMessage(currentEstimate);
            const url = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
            showToast('📲 Открываю Telegram...');
        }
        
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        hideLoading();
        showToast('❌ Ошибка отправки');
    }
}

// Генерация сообщения для Telegram
function generateTelegramMessage(estimate) {
    const date = new Date(estimate.timestamp);
    const formattedDate = date.toLocaleDateString('ru-RU');
    
    let itemsText = '';
    estimate.items.slice(0, 5).forEach((item, index) => {
        itemsText += `${index + 1}. ${item.name}: ${item.quantity} ${item.unit} × ${formatCurrency(item.price)} = ${formatCurrency(item.total)}\n`;
    });
    
    if (estimate.items.length > 5) {
        itemsText += `... и еще ${estimate.items.length - 5} позиций\n`;
    }
    
    return `🏠 СМЕТА НА НАТЯЖНЫЕ ПОТОЛКИ

📅 Дата: ${formattedDate}
👤 Клиент: ${estimate.clientName || 'Не указано'}
📞 Телефон: ${estimate.clientPhone || 'Не указан'}
📍 Адрес: ${estimate.address}
📏 Площадь: ${estimate.area} м²
🔧 Система: ${estimate.system}

📋 ОСНОВНЫЕ ПОЗИЦИИ:
${itemsText}

💰 ИТОГО: ${formatCurrency(estimate.total)}
💳 Предоплата: ${formatCurrency(estimate.prepayment)}
💳 Окончательный расчет: ${formatCurrency(estimate.finalPayment)}

🏢 Компания: PotolokForLife
📞 Телефон: 8(977)531-10-99
✉️ Email: Potolokforlife@yandex.ru

#смета #потолки #${estimate.objectType}`;
}

// Отправка в WhatsApp
async function sendToWhatsApp() {
    try {
        if (!currentEstimate) {
            showToast('❌ Сначала создайте смету');
            return;
        }
        
        const phone = "79775311099";
        const message = generateWhatsAppMessage(currentEstimate);
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        
        window.open(url, '_blank');
        showToast('📲 Открываю WhatsApp...');
        
    } catch (error) {
        console.error('Ошибка WhatsApp:', error);
        showToast('❌ Ошибка отправки');
    }
}

// Генерация сообщения для WhatsApp
function generateWhatsAppMessage(estimate) {
    const date = new Date(estimate.timestamp);
    const formattedDate = date.toLocaleDateString('ru-RU');
    
    return `Здравствуйте! 

Отправляю вам смету на натяжные потолки:

📅 Дата: ${formattedDate}
👤 Клиент: ${estimate.clientName || 'Не указано'}
📍 Адрес: ${estimate.address}
📏 Площадь: ${estimate.area} м²
💰 Общая стоимость: ${formatCurrency(estimate.total)}

💳 Предоплата (50%): ${formatCurrency(estimate.prepayment)}
💳 Окончательный расчет (50%): ${formatCurrency(estimate.finalPayment)}

Для подтверждения заказа или уточнения деталей, свяжитесь с нами:

📞 Телефон: 8(977)531-10-99
✉️ Email: Potolokforlife@yandex.ru

С уважением,
PotolokForLife`;
}

// Экспорт как PDF
async function exportAsPDF() {
    try {
        if (!currentEstimate) {
            showToast('❌ Сначала создайте смету');
            return;
        }
        
        showLoading('Генерируем PDF документ...');
        
        // Создаем контейнер для экспорта
        const exportHTML = generateExportHTML(currentEstimate);
        const exportContainer = document.getElementById('exportContainer');
        exportContainer.innerHTML = exportHTML;
        
        // Создаем изображение
        const canvas = await html2canvas(exportContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        // Создаем PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        // Сохраняем
        const fileName = `Смета_${currentEstimate.clientName || 'клиента'}_${Date.now()}.pdf`;
        pdf.save(fileName);
        
        hideLoading();
        showToast('✅ PDF сохранен!');
        
    } catch (error) {
        console.error('Ошибка создания PDF:', error);
        hideLoading();
        showToast('❌ Ошибка создания PDF');
    }
}

// Экспорт как изображение
async function exportAsImage() {
    try {
        if (!currentEstimate) {
            showToast('❌ Сначала создайте смету');
            return;
        }
        
        showLoading('Создаем изображение...');
        
        // Создаем контейнер для экспорта
        const exportHTML = generateExportHTML(currentEstimate);
        const exportContainer = document.getElementById('exportContainer');
        exportContainer.innerHTML = exportHTML;
        
        // Создаем canvas
        const canvas = await html2canvas(exportContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        // Сохраняем
        canvas.toBlob(function(blob) {
            const link = document.createElement('a');
            link.download = `Смета_${currentEstimate.clientName || 'клиента'}_${Date.now()}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
            
            hideLoading();
            showToast('✅ Изображение сохранено!');
        }, 'image/png');
        
    } catch (error) {
        console.error('Ошибка создания изображения:', error);
        hideLoading();
        showToast('❌ Ошибка создания изображения');
    }
}

// Генерация HTML для экспорта
function generateExportHTML(estimate) {
    const date = new Date(estimate.timestamp);
    const formattedDate = date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const estimateNumber = 'СМ-' + date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
        String(date.getDate()).padStart(2, '0') + '-' + 
        String(date.getHours()).padStart(2, '0') + 
        String(date.getMinutes()).padStart(2, '0');
    
    let itemsHtml = '';
    estimate.items.forEach((item, index) => {
        itemsHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.unit}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.total)}</td>
            </tr>
        `;
    });
    
    const totalInWords = numberToWords(estimate.total);
    
    return `
        <div class="export-document">
            <div class="watermark">PotolokForLife</div>
            
            <div class="export-header">
                <div class="export-title">СМЕТА № ${estimateNumber}</div>
                <div class="export-subtitle">на выполнение работ по монтажу натяжных потолков</div>
                <div class="export-company">
                    Исполнитель: PotolokForLife<br>
                    ИНН: 1234567890 | ОГРН: 1234567890123<br>
                    Адрес: г. Пушкино<br>
                    Тел: 8(977)531-10-99 | Email: Potolokforlife@yandex.ru
                </div>
            </div>
            
            <div class="export-section">
                <div class="export-section-title">1. Общие сведения</div>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0; width: 30%;"><strong>Дата составления:</strong></td>
                        <td style="padding: 5px 0;">${formattedDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Заказчик:</strong></td>
                        <td style="padding: 5px 0;">${estimate.clientName || 'Не указано'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Телефон:</strong></td>
                        <td style="padding: 5px 0;">${estimate.clientPhone || 'Не указан'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Исполнитель:</strong></td>
                        <td style="padding: 5px 0;">PotolokForLife</td>
                    </tr>
                </table>
            </div>
            
            <div class="export-section">
                <div class="export-section-title">2. Характеристики объекта</div>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0; width: 30%;"><strong>Адрес объекта:</strong></td>
                        <td style="padding: 5px 0;">${estimate.address}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Тип объекта:</strong></td>
                        <td style="padding: 5px 0;">${estimate.objectType}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Площадь потолка:</strong></td>
                        <td style="padding: 5px 0;">${estimate.area} м²</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Периметр помещения:</strong></td>
                        <td style="padding: 5px 0;">${estimate.perimeter} м.п.</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Система монтажа:</strong></td>
                        <td style="padding: 5px 0;">${estimate.system}</td>
                    </tr>
                </table>
            </div>
            
            <div class="export-section">
                <div class="export-section-title">3. Перечень работ и материалов</div>
                <table class="export-table">
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Наименование работ/материалов</th>
                            <th>Ед. изм.</th>
                            <th>Кол-во</th>
                            <th>Цена за ед., руб.</th>
                            <th>Стоимость, руб.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml || '<tr><td colspan="6" style="text-align: center;">Нет данных</td></tr>'}
                        <tr class="export-total">
                            <td colspan="5" style="text-align: right;"><strong>ВСЕГО:</strong></td>
                            <td><strong>${formatCurrency(estimate.total)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="export-section">
                <div class="export-section-title">4. Финансовые условия</div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <tr>
                        <td style="padding: 5px 0; width: 50%;"><strong>Общая стоимость работ:</strong></td>
                        <td style="padding: 5px 0;">${formatCurrency(estimate.total)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Предоплата (50%):</strong></td>
                        <td style="padding: 5px 0;">${formatCurrency(estimate.prepayment)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Окончательный расчет (50%):</strong></td>
                        <td style="padding: 5px 0;">${formatCurrency(estimate.finalPayment)}</td>
                    </tr>
                </table>
                <div style="margin-top: 10px;">
                    <strong>Всего к оплате:</strong> ${formatCurrency(estimate.total)} (${totalInWords})
                </div>
            </div>
            
            <div class="export-section">
                <div class="export-section-title">5. Условия выполнения работ</div>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Срок выполнения работ: 3-5 рабочих дней после предоплаты</li>
                    <li>Гарантия на выполненные работы: 5 лет</li>
                    <li>Гарантия на материалы: 10 лет</li>
                    <li>Смета действительна в течение 30 дней с даты составления</li>
                    <li>Работы выполняются в соответствии с ГОСТ и СНиП</li>
                </ul>
            </div>
            
            <div class="export-signature">
                <div class="export-signature-line">
                    <div class="export-signature-block">
                        <div class="export-signature-dash"></div>
                        <div>Исполнитель</div>
                        <div>PotolokForLife</div>
                        <div style="font-size: 10pt; margin-top: 5px;">М.П.</div>
                    </div>
                    <div class="export-signature-block">
                        <div class="export-signature-dash"></div>
                        <div>Заказчик</div>
                        <div>${estimate.clientName || '_________________________'}</div>
                        <div style="font-size: 10pt; margin-top: 5px;">подпись, ФИО</div>
                    </div>
                </div>
            </div>
            
            <div class="export-footer">
                <div>Смета составлена с помощью калькулятора PotolokForLife</div>
                <div>Тел: 8(977)531-10-99 | Email: Potolokforlife@yandex.ru | Сайт: potolokforlife.ru</div>
                <div>Дата печати: ${new Date().toLocaleString('ru-RU')}</div>
            </div>
        </div>
    `;
}

// Загрузка истории
function loadHistory() {
    try {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        const history = JSON.parse(localStorage.getItem('potolokHistory') || '[]');
        
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>История пуста</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        history.forEach((item, index) => {
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleString('ru-RU');
            
            html += `
                <div class="history-item">
                    <div class="history-item-header">
                        <div class="history-item-title">Смета №${index + 1}</div>
                        <div class="history-item-date">${formattedDate}</div>
                    </div>
                    <div class="history-item-details">
                        <div><strong>Клиент:</strong> ${item.clientName || 'Не указано'}</div>
                        <div><strong>Адрес:</strong> ${item.address}</div>
                        <div><strong>Сумма:</strong> ${formatCurrency(item.total)}</div>
                    </div>
                    <div class="history-item-actions">
                        <button class="history-btn view" onclick="loadEstimateFromHistory('${item.id}')">
                            <i class="fas fa-eye"></i> Просмотреть
                        </button>
                        <button class="history-btn delete" onclick="deleteEstimateFromHistory('${item.id}')">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            `;
        });
        
        historyList.innerHTML = html;
        
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
    }
}

// Загрузка сметы из истории
function loadEstimateFromHistory(id) {
    try {
        const history = JSON.parse(localStorage.getItem('potolokHistory') || '[]');
        const estimate = history.find(item => item.id == id);
        
        if (!estimate) {
            showToast('❌ Смета не найдена');
            return;
        }
        
        // Заполняем поля формы
        document.getElementById('objectAddress').value = estimate.address;
        document.getElementById('clientName').value = estimate.clientName || '';
        document.getElementById('clientPhone').value = estimate.clientPhone || '';
        document.getElementById('objectType').value = estimate.objectType;
        document.getElementById('roomCount').value = estimate.roomCount || 1;
        document.getElementById('area').value = estimate.area;
        document.getElementById('perimeter').value = estimate.perimeter;
        
        // Устанавливаем систему
        const systemBtn = document.querySelector(`.system-btn[data-system="${estimate.system.includes('+10%') ? 'garpun10' : 'garpun'}"]`);
        if (systemBtn) {
            document.querySelectorAll('.system-btn').forEach(b => b.classList.remove('active'));
            systemBtn.classList.add('active');
            currentSystem = systemBtn.dataset.system;
        }
        
        // Загружаем услуги
        loadServices();
        
        // Заполняем количества
        estimate.items.forEach(item => {
            // Находим соответствующий элемент в текущей системе
            const system = systemsData[currentSystem];
            let service;
            
            // Ищем в основных услугах
            service = system.basicServices.find(s => 
                s.name === item.name || 
                (s.id === item.id && item.type === 'basic')
            );
            
            if (!service) {
                // Ищем в освещении
                service = system.lightingServices.find(s => 
                    s.name === item.name || 
                    (s.id === item.id && item.type === 'lighting')
                );
            }
            
            if (!service) {
                // Ищем в дополнительных
                service = system.additionalServices.find(s => 
                    s.name === item.name || 
                    (s.id === item.id && item.type === 'additional')
                );
            }
            
            if (service) {
                const input = document.querySelector(`.quantity-input[data-id="${service.id}"][data-type="${item.type || 'basic'}"]`);
                if (input) {
                    input.value = item.quantity;
                }
            }
        });
        
        // Пересчитываем
        calculateEstimate();
        updateDocumentPreview();
        
        // Переключаемся на вкладку результатов
        document.querySelector('.nav-tab[data-tab="results"]').click();
        
        showToast('✅ Смета загружена из истории');
        
    } catch (error) {
        console.error('Ошибка загрузки сметы:', error);
        showToast('❌ Ошибка загрузки сметы');
    }
}

// Удаление сметы из истории
function deleteEstimateFromHistory(id) {
    if (confirm('Вы уверены, что хотите удалить эту смету из истории?')) {
        try {
            let history = JSON.parse(localStorage.getItem('potolokHistory') || '[]');
            history = history.filter(item => item.id != id);
            localStorage.setItem('potolokHistory', JSON.stringify(history));
            
            loadHistory();
            showToast('✅ Смета удалена из истории');
            
        } catch (error) {
            console.error('Ошибка удаления:', error);
            showToast('❌ Ошибка удаления');
        }
    }
}

// Очистка истории
function clearHistory() {
    if (confirm('Вы уверены, что хотите очистить всю историю смет?')) {
        try {
            localStorage.removeItem('potolokHistory');
            loadHistory();
            showToast('✅ История очищена');
            
        } catch (error) {
            console.error('Ошибка очистки:', error);
            showToast('❌ Ошибка очистки');
        }
    }
}

// Сброс калькулятора
function resetCalculator() {
    if (confirm('Вы уверены, что хотите сбросить все данные текущей сметы?')) {
        try {
            // Сброс полей
            ['area', 'perimeter', 'height', 'objectAddress', 'clientName', 'clientPhone'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            
            document.getElementById('roomCount').value = 1;
            document.getElementById('objectType').value = 'квартира';
            
            // Сброс количеств
            document.querySelectorAll('.quantity-input').forEach(input => {
                input.value = 0;
            });
            
            // Сброс системы
            document.querySelectorAll('.system-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const defaultBtn = document.querySelector('.system-btn[data-system="garpun"]');
            if (defaultBtn) defaultBtn.classList.add('active');
            currentSystem = 'garpun';
            
            // Перезагрузка
            loadServices();
            calculateEstimate();
            updateDocumentPreview();
            
            showToast('Данные сброшены');
            
        } catch (error) {
            console.error('Ошибка сброса:', error);
            showToast('Ошибка сброса данных');
        }
    }
}

// Сохранение локально
function saveEstimateLocally() {
    if (!currentEstimate) return;
    
    try {
        // Создаем JSON файл
        const json = JSON.stringify(currentEstimate, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `Смета_${currentEstimate.clientName || 'клиента'}_${Date.now()}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
}

// Проверка доступности сервера бота
function isBotServerAvailable() {
    // Здесь должна быть проверка доступности сервера
    // Пока возвращаем false для использования локального сохранения
    return false;
}

// Отправка на сервер бота
async function sendToBotServer(estimate) {
    try {
        // Эмуляция отправки на сервер
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            data: {
                estimateId: Date.now(),
                savedAt: new Date().toISOString(),
                message: 'Смета сохранена в базе бота'
            }
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Вспомогательные функции
function showLoading(text) {
    const overlay = document.getElementById('loadingOverlay');
    const textEl = document.getElementById('loadingText');
    if (overlay) {
        if (textEl) textEl.textContent = text;
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showToast(message) {
    try {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
        
    } catch (error) {
        console.error('Ошибка показа уведомления:', error);
    }
}

function formatCurrency(amount) {
    try {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount || 0).replace('RUB', 'руб.');
    } catch (error) {
        return '0 руб.';
    }
}

function numberToWords(num) {
    const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
    
    function convertThreeDigits(n) {
        let result = '';
        if (n >= 100) {
            result += hundreds[Math.floor(n / 100)] + ' ';
            n %= 100;
        }
        if (n >= 20) {
            result += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        } else if (n >= 10) {
            result += teens[n - 10] + ' ';
            n = 0;
        }
        if (n > 0) {
            result += units[n] + ' ';
        }
        return result.trim();
    }
    
    const rubles = Math.floor(num);
    let words = '';
    
    if (rubles === 0) {
        words = 'ноль рублей';
    } else {
        // Миллионы
        const millions = Math.floor(rubles / 1000000);
        if (millions > 0) {
            words += convertThreeDigits(millions) + ' миллионов ';
        }
        
        // Тысячи
        const thousands = Math.floor((rubles % 1000000) / 1000);
        if (thousands > 0) {
            words += convertThreeDigits(thousands) + ' тысяч ';
        }
        
        // Сотни
        const remainder = rubles % 1000;
        if (remainder > 0) {
            words += convertThreeDigits(remainder) + ' ';
        }
        
        // Определение валюты
        const lastTwo = rubles % 100;
        const lastOne = rubles % 10;
        
        if (lastTwo >= 11 && lastTwo <= 19) {
            words += 'рублей';
        } else if (lastOne === 1) {
            words += 'рубль';
        } else if (lastOne >= 2 && lastOne <= 4) {
            words += 'рубля';
        } else {
            words += 'рублей';
        }
    }
    
    return words.trim();
}
