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

// Глобальные переменные
let currentSystem = 'garpun';
let selectedServices = [];
let currentEstimate = null;
let tg = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Инициализация приложения...');
        
        // Инициализация Telegram Web App
        initializeTelegram();
        
        // Инициализация навигации
        initializeNavigation();
        
        // Инициализация системы
        initializeSystemSelector();
        
        // Загрузка услуг
        loadServices();
        
        // Настройка обработчиков событий
        setupEventListeners();
        
        // Расчет начальной сметы
        calculateEstimate();
        
        // Загрузка истории
        loadHistory();
        
        console.log('✅ Приложение успешно загружено');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showToast('Ошибка загрузки приложения');
    }
});

// Инициализация Telegram Web App
function initializeTelegram() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            
            // Расширяем на весь экран
            tg.expand();
            
            // Показываем кнопку "Назад"
            tg.BackButton.show();
            tg.BackButton.onClick(() => {
                tg.close();
            });
            
            // Показываем статус Telegram
            document.getElementById('telegramStatus').style.display = 'block';
            
            console.log('🤖 Telegram Web App подключен');
            
        } else {
            console.log('🌐 Запущено в браузере');
        }
    } catch (error) {
        console.warn('⚠️ Ошибка Telegram Web App:', error);
    }
}

// Инициализация навигации
function initializeNavigation() {
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
            
            // Действия при переключении вкладок
            if (targetTab === 'results') {
                calculateEstimate();
            } else if (targetTab === 'history') {
                loadHistory();
            }
        });
    });
}

// Инициализация выбора системы
function initializeSystemSelector() {
    document.querySelectorAll('.system-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.system-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSystem = this.dataset.system;
            
            // Перезагружаем услуги для выбранной системы
            loadServices();
            
            // Пересчитываем смету
            calculateEstimate();
            
            showToast(`Система: ${systemsData[currentSystem].name}`);
        });
    });
}

// Загрузка услуг
function loadServices() {
    try {
        const system = systemsData[currentSystem];
        
        // Загрузка основных услуг
        loadServiceList('basicServicesList', system.basicServices, 'basic');
        
        // Загрузка освещения
        loadServiceList('lightingServicesList', system.lightingServices, 'lighting');
        
        // Загрузка дополнительных услуг
        loadServiceList('additionalServicesList', system.additionalServices, 'additional');
        
        // Обновляем обработчики изменения количества
        updateQuantityInputListeners();
        
    } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
        showToast('Ошибка загрузки услуг');
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
            <div class="service-item" role="listitem">
                <div class="service-info">
                    <div class="service-name">${service.name}</div>
                    <div class="service-unit">${service.unit}</div>
                </div>
                <div class="service-controls">
                    <div class="service-price">${formatCurrency(service.price)}</div>
                    <input type="number" class="quantity-input" 
                           data-id="${service.id}" data-type="${type}"
                           min="0" value="${existingQuantity}"
                           aria-label="Количество ${service.name}">
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
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        // Добавляем новый обработчик
        newInput.addEventListener('input', handleQuantityChange);
    });
}

// Обработчик изменения количества
function handleQuantityChange() {
    calculateEstimate();
}

// Настройка обработчиков событий
function setupEventListeners() {
    try {
        // Кнопки расчета
        ['calculateBtn', 'calculateBtn2', 'calculateBtn3'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', calculateEstimate);
            }
        });
        
        // Кнопки сброса
        ['resetBtn', 'resetBtn2', 'resetBtn3'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', resetCalculator);
            }
        });
        
        // Кнопки сохранения
        ['saveBtn', 'saveBtn2', 'saveBtn3'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', saveEstimate);
            }
        });
        
        // Кнопки экспорта
        document.getElementById('exportPdfBtn').addEventListener('click', exportAsPDF);
        document.getElementById('exportImageBtn').addEventListener('click', exportAsImage);
        document.getElementById('exportTelegramBtn').addEventListener('click', shareToTelegram);
        document.getElementById('exportWhatsappBtn').addEventListener('click', shareToWhatsApp);
        
        // Кнопки истории
        document.getElementById('refreshHistoryBtn').addEventListener('click', loadHistory);
        document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
        
        // Основные поля ввода
        ['area', 'perimeter', 'objectAddress', 'clientName', 'clientPhone'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', calculateEstimate);
            }
        });
        
        // Защита от отрицательных значений
        document.addEventListener('input', function(e) {
            if (e.target.type === 'number' && e.target.value < 0) {
                e.target.value = 0;
                calculateEstimate();
            }
        });
        
        // Сохранение при закрытии
        window.addEventListener('beforeunload', function() {
            saveCurrentEstimateToHistory();
        });
        
    } catch (error) {
        console.error('Ошибка настройки обработчиков:', error);
    }
}

// Основная функция расчета
function calculateEstimate() {
    try {
        const system = systemsData[currentSystem];
        const area = parseFloat(document.getElementById('area').value) || 0;
        const perimeter = parseFloat(document.getElementById('perimeter').value) || 0;
        
        // Собираем выбранные услуги
        selectedServices = collectSelectedServices(system);
        
        // Добавляем автоматические услуги
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
    // Полотно (если указана площадь)
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
    
    // Профиль и вставка (если указан периметр)
    if (perimeter > 0) {
        // Профиль
        if (!selectedServices.some(s => s.id === 2)) {
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
        if (!selectedServices.some(s => s.id === 3)) {
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
}

// Обновление интерфейса с итогами
function updateInterfaceTotals() {
    const totalCost = selectedServices.reduce((sum, s) => sum + s.total, 0);
    const materialsCost = selectedServices.reduce((sum, s) => sum + (s.basePrice * s.quantity), 0);
    const workCost = totalCost - materialsCost;
    
    // Обновляем отображение
    document.getElementById('materialsCost').textContent = formatCurrency(materialsCost);
    document.getElementById('workCost').textContent = formatCurrency(workCost);
    document.getElementById('totalCost').textContent = formatCurrency(totalCost);
    
    // Обновляем информацию об оплате
    const prepayment = totalCost * 0.5;
    const finalPayment = totalCost * 0.5;
    document.getElementById('prepaymentAmount').textContent = formatCurrency(prepayment);
    document.getElementById('finalPaymentAmount').textContent = formatCurrency(finalPayment);
}

// Обновление таблицы сметы
function updateSummaryTable() {
    const tableBody = document.getElementById('summaryTableBody');
    
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
}

// Сохранение сметы в историю
function saveEstimate() {
    try {
        if (!currentEstimate) {
            showToast('❌ Сначала создайте смету');
            return;
        }
        
        // Сохраняем в localStorage
        let history = JSON.parse(localStorage.getItem('potolokHistory') || '[]');
        
        // Проверяем, нет ли уже такой сметы
        history = history.filter(item => item.id !== currentEstimate.id);
        
        // Добавляем новую смету в начало
        history.unshift(currentEstimate);
        
        // Ограничиваем историю 100 записями
        if (history.length > 100) {
            history = history.slice(0, 100);
        }
        
        localStorage.setItem('potolokHistory', JSON.stringify(history));
        
        showToast('✅ Смета сохранена в историю');
        
        // Обновляем список истории
        loadHistory();
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showToast('❌ Ошибка сохранения сметы');
    }
}

// Сохранение при закрытии
function saveCurrentEstimateToHistory() {
    if (currentEstimate && selectedServices.length > 0) {
        try {
            let history = JSON.parse(localStorage.getItem('potolokHistory') || '[]');
            history.unshift(currentEstimate);
            
            if (history.length > 100) {
                history = history.slice(0, 100);
            }
            
            localStorage.setItem('potolokHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Ошибка автосохранения:', error);
        }
    }
}

// Загрузка истории
function loadHistory() {
    try {
        const historyList = document.getElementById('historyList');
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
                        <button class="btn btn-secondary" onclick="loadEstimateFromHistory(${item.id})">
                            <i class="fas fa-eye"></i> Загрузить
                        </button>
                        <button class="btn btn-danger" onclick="deleteEstimateFromHistory(${item.id})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            `;
        });
        
        historyList.innerHTML = html;
        
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        showToast('Ошибка загрузки истории');
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
        const systemKey = estimate.system.includes('+10%') ? 'garpun10' : 'garpun';
        document.querySelectorAll('.system-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.system === systemKey) {
                btn.classList.add('active');
            }
        });
        
        currentSystem = systemKey;
        
        // Загружаем услуги
        loadServices();
        
        // Заполняем количества
        setTimeout(() => {
            estimate.items.forEach(item => {
                // Находим соответствующий элемент в текущей системе
                const system = systemsData[currentSystem];
                let service;
                
                // Ищем в основных услугах
                service = system.basicServices.find(s => 
                    s.name === item.name || s.id === item.id
                );
                
                if (!service) {
                    // Ищем в освещении
                    service = system.lightingServices.find(s => 
                        s.name === item.name || s.id === item.id
                    );
                }
                
                if (!service) {
                    // Ищем в дополнительных
                    service = system.additionalServices.find(s => 
                        s.name === item.name || s.id === item.id
                    );
                }
                
                if (service) {
                    const input = document.querySelector(`.quantity-input[data-id="${service.id}"]`);
                    if (input) {
                        input.value = item.quantity;
                    }
                }
            });
            
            // Пересчитываем
            calculateEstimate();
            
            // Переключаемся на вкладку результатов
            document.querySelector('.nav-tab[data-tab="results"]').click();
            
            showToast('✅ Смета загружена из истории');
            
        }, 100);
        
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
            // Сброс полей ввода
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
            document.querySelector('.system-btn[data-system="garpun"]').classList.add('active');
            currentSystem = 'garpun';
            
            // Перезагрузка услуг
            loadServices();
            
            // Пересчет
            calculateEstimate();
            
            showToast('Данные сброшены');
            
        } catch (error) {
            console.error('Ошибка сброса:', error);
            showToast('Ошибка сброса данных');
        }
    }
}

// Экспорт как PDF
async function exportAsPDF() {
    try {
        if (!currentEstimate) {
            showToast('❌ Сначала создайте смету');
            return;
        }
        
        showLoading('Генерируем PDF...');
        
        // Создаем HTML для экспорта
        const exportHTML = generateExportHTML();
        const exportContainer = document.getElementById('exportContainer');
        exportContainer.innerHTML = exportHTML;
        
        // Создаем изображение с помощью html2canvas
        const canvas = await html2canvas(exportContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        // Создаем PDF с помощью jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        // Сохраняем PDF
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
        
        // Создаем HTML для экспорта
        const exportHTML = generateExportHTML();
        const exportContainer = document.getElementById('exportContainer');
        exportContainer.innerHTML = exportHTML;
        
        // Создаем canvas
        const canvas = await html2canvas(exportContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        // Сохраняем как PNG
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
function generateExportHTML() {
    const estimate = currentEstimate;
    const date = new Date(estimate.timestamp);
    const formattedDate = date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const estimateNumber = 'СМ-' + date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
        String(date.getDate()).padStart(2, '0');
    
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
        <div style="width: 100%; max-width: 800px; margin: 0 auto; background: white; color: #000; font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.4; padding: 40px; position: relative;">
            <div style="position: absolute; opacity: 0.1; font-size: 60pt; color: #1e3c72; transform: rotate(-45deg); top: 300px; left: 100px; pointer-events: none; z-index: -1;">PotolokForLife</div>
            
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #1e3c72;">
                <div style="font-size: 20pt; font-weight: bold; color: #1e3c72; margin-bottom: 5px;">СМЕТА № ${estimateNumber}</div>
                <div style="font-size: 14pt; color: #666; margin-bottom: 15px;">на выполнение работ по монтажу натяжных потолков</div>
                <div style="font-size: 11pt; color: #333;">
                    Исполнитель: PotolokForLife<br>
                    Тел: 8(977)531-10-99 | Email: Potolokforlife@yandex.ru<br>
                    Адрес: г. Пушкино
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <div style="font-size: 14pt; font-weight: bold; color: #1e3c72; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #dee2e6;">1. Общие сведения</div>
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
                </table>
            </div>
            
            <div style="margin-bottom: 25px;">
                <div style="font-size: 14pt; font-weight: bold; color: #1e3c72; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #dee2e6;">2. Характеристики объекта</div>
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
                        <td style="padding: 5px 0;"><strong>Система монтажа:</strong></td>
                        <td style="padding: 5px 0;">${estimate.system}</td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-bottom: 25px;">
                <div style="font-size: 14pt; font-weight: bold; color: #1e3c72; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #dee2e6;">3. Перечень работ и материалов</div>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11pt;">
                    <thead>
                        <tr>
                            <th style="background: #f8f9fa; color: #1e3c72; padding: 10px; border: 1px solid #dee2e6; font-weight: bold; text-align: left;">№</th>
                            <th style="background: #f8f9fa; color: #1e3c72; padding: 10px; border: 1px solid #dee2e6; font-weight: bold; text-align: left;">Наименование работ/материалов</th>
                            <th style="background: #f8f9fa; color: #1e3c72; padding: 10px; border: 1px solid #dee2e6; font-weight: bold; text-align: left;">Ед. изм.</th>
                            <th style="background: #f8f9fa; color: #1e3c72; padding: 10px; border: 1px solid #dee2e6; font-weight: bold; text-align: left;">Кол-во</th>
                            <th style="background: #f8f9fa; color: #1e3c72; padding: 10px; border: 1px solid #dee2e6; font-weight: bold; text-align: left;">Цена за ед., руб.</th>
                            <th style="background: #f8f9fa; color: #1e3c72; padding: 10px; border: 1px solid #dee2e6; font-weight: bold; text-align: left;">Стоимость, руб.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml || '<tr><td colspan="6" style="text-align: center; padding: 20px;">Нет данных</td></tr>'}
                        <tr style="background: #e8f4ff; font-weight: bold;">
                            <td colspan="5" style="text-align: right; padding: 10px; border: 1px solid #dee2e6;"><strong>ВСЕГО:</strong></td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>${formatCurrency(estimate.total)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div style="margin-bottom: 25px;">
                <div style="font-size: 14pt; font-weight: bold; color: #1e3c72; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #dee2e6;">4. Финансовые условия</div>
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
            
            <div style="margin-top: 50px; padding-top: 20px; border-top: 1px dashed #999;">
                <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                    <div style="width: 45%; text-align: center;">
                        <div style="border-top: 1px dashed #999; margin-top: 60px; margin-bottom: 5px;"></div>
                        <div>Исполнитель</div>
                        <div>PotolokForLife</div>
                        <div style="font-size: 10pt; margin-top: 5px;">М.П.</div>
                    </div>
                    <div style="width: 45%; text-align: center;">
                        <div style="border-top: 1px dashed #999; margin-top: 60px; margin-bottom: 5px;"></div>
                        <div>Заказчик</div>
                        <div>${estimate.clientName || '_________________________'}</div>
                        <div style="font-size: 10pt; margin-top: 5px;">подпись, ФИО</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dee2e6; font-size: 10pt; color: #666; text-align: center;">
                <div>Смета составлена с помощью калькулятора PotolokForLife</div>
                <div>Тел: 8(977)531-10-99 | Email: Potolokforlife@yandex.ru</div>
                <div>Дата печати: ${new Date().toLocaleString('ru-RU')}</div>
            </div>
        </div>
    `;
}

// Поделиться в Telegram
function shareToTelegram() {
    try {
        if (!currentEstimate) {
            showToast('❌ Сначала создайте смету');
            return;
        }
        
        const message = generateTelegramMessage();
        const url = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
        
        if (tg && tg.openLink) {
            tg.openLink(url);
        } else {
            window.open(url, '_blank');
        }
        
        showToast('📲 Открываю Telegram...');
        
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        showToast('❌ Ошибка отправки');
    }
}

// Генерация сообщения для Telegram
function generateTelegramMessage() {
    const estimate = currentEstimate;
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
💳 Предоплата (50%): ${formatCurrency(estimate.prepayment)}
💳 Окончательный расчет (50%): ${formatCurrency(estimate.finalPayment)}

🏢 Компания: PotolokForLife
📞 Телефон: 8(977)531-10-99
✉️ Email: Potolokforlife@yandex.ru

#смета #потолки #${estimate.objectType}`;
}

// Поделиться в WhatsApp
function shareToWhatsApp() {
    try {
        if (!currentEstimate) {
            showToast('❌ Сначала создайте смету');
            return;
        }
        
        const message = generateWhatsAppMessage();
        const phone = "79775311099";
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        
        window.open(url, '_blank');
        showToast('📲 Открываю WhatsApp...');
        
    } catch (error) {
        console.error('Ошибка WhatsApp:', error);
        showToast('❌ Ошибка отправки');
    }
}

// Генерация сообщения для WhatsApp
function generateWhatsAppMessage() {
    const estimate = currentEstimate;
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
        // Тысячи
        const thousands = Math.floor(rubles / 1000);
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
