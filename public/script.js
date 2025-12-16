// Данные о ценах
const prices = {
    matte: 500,
    glossy: 600,
    satin: 550
};

// Состояние приложения
let currentScreen = 'calculator';

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCalculator();
    initContacts();
    
    // Показываем калькулятор по умолчанию
    showScreen('calculator');
});

// Инициализация навигации
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const screen = btn.dataset.screen;
            showScreen(screen);
        });
    });
}

// Переключение экранов
function showScreen(screenName) {
    // Скрываем все экраны
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показываем нужный экран
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    // Обновляем активную кнопку в навигации
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.screen === screenName) {
            btn.classList.add('active');
        }
    });
    
    currentScreen = screenName;
}

// Инициализация калькулятора
function initCalculator() {
    const calculateBtn = document.getElementById('calculate-btn');
    const areaInput = document.getElementById('area');
    const typeInputs = document.querySelectorAll('input[name="ceiling-type"]');
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculatePrice);
    }
    
    // Расчет при изменении параметров
    if (areaInput) {
        areaInput.addEventListener('input', autoCalculate);
    }
    
    typeInputs.forEach(input => {
        input.addEventListener('change', autoCalculate);
    });
}

// Автоматический расчет
function autoCalculate() {
    const area = parseFloat(document.getElementById('area').value);
    const selectedType = document.querySelector('input[name="ceiling-type"]:checked');
    
    if (area > 0 && selectedType) {
        calculatePrice();
    }
}

// Расчет стоимости
function calculatePrice() {
    const area = parseFloat(document.getElementById('area').value);
    const selectedType = document.querySelector('input[name="ceiling-type"]:checked');
    const resultDiv = document.getElementById('result');
    
    // Валидация
    if (!area || area <= 0) {
        showError('Пожалуйста, введите корректную площадь');
        return;
    }
    
    if (!selectedType) {
        showError('Пожалуйста, выберите тип потолка');
        return;
    }
    
    // Расчет
    const type = selectedType.value;
    const pricePerMeter = prices[type];
    const totalPrice = area * pricePerMeter;
    
    // Названия типов
    const typeNames = {
        matte: 'Матовый',
        glossy: 'Глянцевый',
        satin: 'Сатиновый'
    };
    
    // Отображение результата
    resultDiv.innerHTML = `
        <div class="result-card">
            <h3>📊 Результат расчета</h3>
            <div class="result-details">
                <p><strong>Площадь:</strong> ${area} м²</p>
                <p><strong>Тип потолка:</strong> ${typeNames[type]}</p>
                <p><strong>Цена за м²:</strong> ${pricePerMeter.toLocaleString('ru-RU')} ₽</p>
            </div>
            <div class="result-total">
                <p><strong>Итоговая стоимость:</strong></p>
                <p class="price">${totalPrice.toLocaleString('ru-RU')} ₽</p>
            </div>
            <button class="btn btn-secondary" onclick="resetCalculator()">Новый расчет</button>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Сброс калькулятора
function resetCalculator() {
    document.getElementById('area').value = '';
    const typeInputs = document.querySelectorAll('input[name="ceiling-type"]');
    typeInputs.forEach(input => input.checked = false);
    document.getElementById('result').style.display = 'none';
}

// Показать ошибку
function showError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="error-message">
            <p>⚠️ ${message}</p>
        </div>
    `;
    resultDiv.style.display = 'block';
    
    setTimeout(() => {
        resultDiv.style.display = 'none';
    }, 3000);
}

// Инициализация контактов
function initContacts() {
    const phoneLink = document.querySelector('a[href^="tel:"]');
    const emailLink = document.querySelector('a[href^="mailto:"]');
    
    // Можно добавить аналитику кликов
    if (phoneLink) {
        phoneLink.addEventListener('click', () => {
            console.log('Клик по телефону');
        });
    }
    
    if (emailLink) {
        emailLink.addEventListener('click', () => {
            console.log('Клик по email');
        });
    }
}

// Service Worker для PWA (если нужен оффлайн режим)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}
