// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
let currentSection = 'general';
let portfolioData = { items: [] };
let futureData = { items: [] };
let featuresConfig = {};
let currentProjectIndex = -1;
let currentProjectStatus = 'active';
let currentTechnologies = [];
let changesCount = 0;
let currentProjectImages = [];
let projectStatuses = [
    { 
        id: 'active', 
        name: 'Активен', 
        icon: '✅', 
        description: 'Проект готов',
        color: '#10b981',
        bgColor: '#064e3b'
    },
    { 
        id: 'coming-soon', 
        name: 'Скоро', 
        icon: '🚀', 
        description: 'В разработке',
        color: '#8b5cf6',
        bgColor: '#581c87'
    },
    { 
        id: 'paused', 
        name: 'Приостановлен', 
        icon: '⏸️', 
        description: 'Временно не активен',
        color: '#f59e0b',
        bgColor: '#92400e'
    }
];

// --- ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin panel загружена');
    
    // Загружаем все данные
    await loadAllData();
    
    // Инициализируем новый селектор статусов
    initializeStatusSelector();
    
    // Инициализируем автосохранение
    initializeAutoSave();
    
    // Обновляем статистику
    updateDashboardStats();
    
    // Инициализируем технологии
    initializeTechnologies();
    
    // Инициализируем теги
    displayTags();
    
    // Инициализируем селектор статусов
    renderStatusSelector();
    
    // Показываем первую секцию
    showSection('general');
});

// --- НАВИГАЦИЯ ---
function showSection(sectionId) {
    console.log('Переключение на секцию:', sectionId);
    
    // Скрываем все секции
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Показываем выбранную секцию
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Активируем пункт меню
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.onclick && item.onclick.toString().includes(`'${sectionId}'`)) {
            item.classList.add('active');
        }
    });
    
    currentSection = sectionId;
}

// --- ЗАГРУЗКА ДАННЫХ ---
async function loadAllData() {
    try {
        await loadData('general');
        await loadData('hero');
        await loadData('about');
        await loadData('contact');
        await loadData('portfolio');
        await loadData('features');
        await loadData('future');
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

async function loadData(section) {
    try {
        const response = await fetch(`/api/${section}`);
        if (response.ok) {
            const data = await response.json();
            displayData(section, data);
        }
    } catch (error) {
        console.error(`Ошибка загрузки ${section}:`, error);
    }
}

// --- ОТОБРАЖЕНИЕ ДАННЫХ ---
function displayData(section, data) {
    switch(section) {
        case 'general':
            setInputValue('site-title', data.title);
            setInputValue('site-lang', data.lang);
            break;
            
        case 'hero':
            setInputValue('hero-title', data.title);
            setInputValue('hero-description', data.description);
            setInputValue('hero-btn1-text', data.button1_text);
            setInputValue('hero-btn1-link', data.button1_link);
            setInputValue('hero-btn2-text', data.button2_text);
            setInputValue('hero-btn2-link', data.button2_link);
            break;
            
        case 'about':
            setInputValue('about-text1', data.text1);
            setInputValue('about-text2', data.text2);
            break;
            
        case 'portfolio':
            displayProjects(data.items || []);
            updateDashboardStats();
            break;
            
        case 'future':
            futureData = data;
            displayFutureProjects(data.items || []); // Добавлено: отображение будущих проектов
            updateDashboardStats();
            break;
            
        case 'contact':
            setInputValue('contact-email', data.email);
            setInputValue('contact-phone', data.phone);
            setInputValue('contact-address', data.address);
            break;
            
        case 'features':
            featuresConfig = data;
            displayFeatures(data);
            break;
    }
}

function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) {
        element.value = value;
    }
}

// --- ФУНКЦИИ СОХРАНЕНИЯ ---
async function saveData(section, data) {
    try {
        const response = await fetch(`/api/${section}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showNotification('Сохранено успешно!', 'success');
            changesCount++;
            updateDashboardStats();
        } else {
            showNotification('Ошибка сохранения', 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка сохранения', 'error');
    }
}

async function saveGeneral() {
    const data = {
        title: document.getElementById('site-title').value,
        lang: document.getElementById('site-lang').value
    };
    await saveData('general', data);
}

async function saveHero() {
    const data = {
        title: document.getElementById('hero-title').value,
        description: document.getElementById('hero-description').value,
        button1_text: document.getElementById('hero-btn1-text').value,
        button1_link: document.getElementById('hero-btn1-link').value,
        button2_text: document.getElementById('hero-btn2-text').value,
        button2_link: document.getElementById('hero-btn2-link').value
    };
    await saveData('hero', data);
}

async function saveAbout() {
    const data = {
        text1: document.getElementById('about-text1').value,
        text2: document.getElementById('about-text2').value
    };
    await saveData('about', data);
}

async function saveContact() {
    const data = {
        email: document.getElementById('contact-email').value,
        phone: document.getElementById('contact-phone').value,
        address: document.getElementById('contact-address').value
    };
    await saveData('contact', data);
}

// --- УПРАВЛЕНИЕ ПОРТФОЛИО ---
function displayProjects(items) {
    const container = document.getElementById('projects-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Проекты пока не добавлены</p>
                <button class="btn btn-primary" onclick="addProject()">Добавить проект</button>
            </div>
        `;
        return;
    }
    
    portfolioData.items = items;
    
    items.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        // Получаем конфигурацию статуса
        const statusConfig = getStatusConfigAdmin(project.status || 'active');
        const projectStatus = project.status || 'active';
        
        // Формируем HTML тегов
        const tagsHTML = project.tags && project.tags.length > 0 
            ? project.tags.slice(0, 3).map(tag => `<span class="tag-mini">${tag}</span>`).join('')
            : '<span class="tag-mini no-tags">Без тегов</span>';
        
        // Формируем HTML технологий
        const techHTML = project.technologies && project.technologies.length > 0 
            ? project.technologies.slice(0, 4).map(tech => `<span class="tech-mini">${tech.icon}</span>`).join('')
            : '<span class="tech-mini">🌐</span>';
        
        // Бейдж статуса
        const statusBadge = projectStatus !== 'active' 
            ? `<div class="status-badge" style="background: ${statusConfig.color};">${statusConfig.icon} ${statusConfig.name}</div>`
            : `<div class="status-badge active-status">✅ Активен</div>`;
        
        card.innerHTML = `
            <div class="project-card-header">
                <h3 class="project-title">${project.title || 'Без названия'}</h3>
                ${statusBadge}
            </div>
            <div class="project-card-content">
                <p class="project-description">${(project.description || 'Нет описания').slice(0, 80)}${(project.description || '').length > 80 ? '...' : ''}</p>
                <div class="project-meta">
                    <div class="project-category">
                        <span class="category-badge category-${project.category || 'web'}">${getCategoryName(project.category)}</span>
                    </div>
                    <div class="project-tech">
                        ${techHTML}
                        ${project.technologies && project.technologies.length > 4 ? `<span class="tech-count">+${project.technologies.length - 4}</span>` : ''}
                    </div>
                </div>
                <div class="project-tags">
                    ${tagsHTML}
                    ${project.tags && project.tags.length > 3 ? `<span class="tag-count">+${project.tags.length - 3}</span>` : ''}
                </div>
            </div>
            <div class="project-actions">
                <button class="btn btn-primary btn-sm" onclick="editProject(${index})">
                    <span>✏️</span> Изменить
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteProject(${index})">
                    <span>🗑️</span> Удалить
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function addProject() {
    currentProjectIndex = -1;
    currentTags = [];
    currentProjectImages = [];
    currentProjectStatus = 'active'; // Сброс статуса для нового проекта
    setProjectStatus('active'); // Устанавливаем статус в UI
    currentTechnologies = [
        { name: 'HTML', icon: '🌐' },
        { name: 'CSS', icon: '🎨' },
        { name: 'JavaScript', icon: '⚡' }
    ];
    
    document.getElementById('project-title').value = '';
    document.getElementById('project-category').value = 'web';
    document.getElementById('project-description').value = '';
    document.getElementById('project-link').value = '#';
    
    displayTags();
    displayTechnologies();
    updateProjectImagesPreview();
    renderStatusSelector();
    
    document.getElementById('project-editor').style.display = 'block';
}

function editProject(index) {
    currentProjectIndex = index;
    const project = portfolioData.items[index];
    
    document.getElementById('project-title').value = project.title || '';
    document.getElementById('project-category').value = project.category || 'web';
    document.getElementById('project-description').value = project.description || '';
    document.getElementById('project-link').value = project.link || '#';
    
    // Загружаем изображения
    currentProjectImages = project.images || [];
    updateProjectImagesPreview();
    
    // Загружаем теги
    currentTags = project.tags || [];
    displayTags();
    
    // Загружаем статус проекта
    currentProjectStatus = project.status || 'active';
    setProjectStatus(currentProjectStatus);
    
    // Загружаем технологии (если есть, иначе дефолтные)
    currentTechnologies = project.technologies || [
        { name: 'HTML', icon: '🌐' },
        { name: 'CSS', icon: '🎨' },
        { name: 'JavaScript', icon: '⚡' }
    ];
    displayTechnologies();
    renderStatusSelector();
    
    document.getElementById('project-editor').style.display = 'block';
}

function deleteProject(index) {
    if (confirm('Удалить этот проект?')) {
        portfolioData.items.splice(index, 1);
        savePortfolio();
        displayProjects(portfolioData.items);
    }
}

function saveProject() {
    const project = {
        title: document.getElementById('project-title').value,
        category: document.getElementById('project-category').value,
        description: document.getElementById('project-description').value,
        tags: currentTags,
        technologies: currentTechnologies,
        images: currentProjectImages,
        link: document.getElementById('project-link').value || '#',
        longDescription: document.getElementById('project-description').value,
        status: currentProjectStatus // ДОБАВЛЕНО: сохранение статуса
    };
    
    if (currentProjectIndex === -1) {
        portfolioData.items.push(project);
    } else {
        portfolioData.items[currentProjectIndex] = project;
    }
    
    savePortfolio();
    displayProjects(portfolioData.items);
    cancelProject();
}

function cancelProject() {
    document.getElementById('project-editor').style.display = 'none';
}

async function savePortfolio() {
    await saveData('portfolio', portfolioData);
}

// --- УПРАВЛЕНИЕ БУДУЩИМИ ПРОЕКТАМИ ---
function displayFutureProjects(items) {
    const container = document.getElementById('future-projects-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Будущие проекты пока не добавлены</p>
                <button class="btn btn-primary" onclick="addFutureProject()">Добавить план</button>
            </div>
        `;
        return;
    }
    
    futureData.items = items;
    
    items.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'future-project-card';
        card.style.cssText = `
            background: var(--bg-card);
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-lg);
            padding: 20px;
            margin-bottom: 16px;
            transition: var(--transition);
        `;
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${project.title || 'Без названия'}</h3>
                <div style="background: var(--accent-primary); color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                    ${project.date || 'Дата не указана'}
                </div>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 16px; line-height: 1.4;">
                ${project.description || 'Нет описания'}
            </p>
            <div class="future-project-actions" style="display: flex; gap: 8px;">
                <button class="btn btn-primary btn-sm" onclick="editFutureProject(${index})">
                    <span>✏️</span> Изменить
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteFutureProject(${index})">
                    <span>🗑️</span> Удалить
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

let currentFutureProjectIndex = -1;

function addFutureProject() {
    currentFutureProjectIndex = -1;
    
    document.getElementById('future-title').value = '';
    document.getElementById('future-date').value = '';
    document.getElementById('future-description').value = '';
    
    document.getElementById('future-editor').style.display = 'block';
}

function editFutureProject(index) {
    currentFutureProjectIndex = index;
    const project = futureData.items[index];
    
    document.getElementById('future-title').value = project.title || '';
    document.getElementById('future-date').value = project.date || '';
    document.getElementById('future-description').value = project.description || '';
    
    document.getElementById('future-editor').style.display = 'block';
}

function deleteFutureProject(index) {
    if (confirm('Удалить этот план?')) {
        futureData.items.splice(index, 1);
        saveFutureProjects();
        displayFutureProjects(futureData.items);
    }
}

function saveFutureProject() {
    const project = {
        title: document.getElementById('future-title').value,
        date: document.getElementById('future-date').value,
        description: document.getElementById('future-description').value
    };
    
    if (currentFutureProjectIndex === -1) {
        futureData.items.push(project);
    } else {
        futureData.items[currentFutureProjectIndex] = project;
    }
    
    saveFutureProjects();
    displayFutureProjects(futureData.items);
    cancelFutureProject();
}

function cancelFutureProject() {
    document.getElementById('future-editor').style.display = 'none';
}

async function saveFutureProjects() {
    await saveData('future', futureData);
    updateDashboardStats(); // Обновляем счетчики
}

// --- УПРАВЛЕНИЕ ФУНКЦИЯМИ ---
function displayFeatures(features) {
    const container = document.getElementById('features-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    const featuresList = [
        { key: 'about', name: 'Раздел "О себе"' },
        { key: 'portfolio', name: 'Портфолио' },
        { key: 'future', name: 'Будущие проекты' },
        { key: 'contact', name: 'Контакты' },
        { key: 'filter', name: 'Фильтр портфолио' },
        { key: 'form', name: 'Форма обратной связи' }
    ];
    
    featuresList.forEach(feature => {
        const status = features[feature.key] !== false;
        const control = document.createElement('div');
        control.className = 'feature-control';
        control.innerHTML = `
            <label>
                <input type="checkbox" ${status ? 'checked' : ''} 
                       onchange="toggleFeature('${feature.key}', this.checked)">
                ${feature.name}
            </label>
        `;
        container.appendChild(control);
    });
}

function toggleFeature(key, enabled) {
    featuresConfig[key] = enabled;
}

async function saveFeatures() {
    await saveData('features', featuresConfig);
}

// --- СТАТИСТИКА ---
function updateDashboardStats() {
    // Обновляем количество проектов в портфолио
    const portfolioCount = document.getElementById('dashboard-portfolio-count');
    if (portfolioCount) {
        portfolioCount.textContent = portfolioData.items ? portfolioData.items.length : 0;
    }
    
    // Обновляем количество будущих проектов
    const futureCount = document.getElementById('dashboard-future-count');
    if (futureCount) {
        futureCount.textContent = futureData.items ? futureData.items.length : 0;
    }
    
    // Обновляем количество изменений
    const changesCountEl = document.getElementById('dashboard-changes-count');
    if (changesCountEl) {
        changesCountEl.textContent = changesCount;
    }
    
    // Обновляем счетчики в меню навигации
    const portfolioMenuCount = document.getElementById('portfolio-count');
    if (portfolioMenuCount) {
        portfolioMenuCount.textContent = portfolioData.items ? portfolioData.items.length : 0;
    }
    
    const futureMenuCount = document.getElementById('future-count');
    if (futureMenuCount) {
        futureMenuCount.textContent = futureData.items ? futureData.items.length : 0;
    }
    
    // Обновляем бейдж на карточке будущих проектов
    const futureBadge = document.getElementById('future-badge');
    if (futureBadge) {
        const count = futureData.items ? futureData.items.length : 0;
        futureBadge.textContent = count === 0 ? '0 планов' : 
                                count === 1 ? '1 план' : 
                                count < 5 ? `${count} плана` : `${count} планов`;
    }
}

// --- УВЕДОМЛЕНИЯ ---
function showNotification(message, type = 'success') {
    // Создаем контейнер для уведомлений, если его еще нет
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = `custom-notification notification-${type}`;
    
    // Иконки для разных типов уведомлений
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    // Цвета для разных типов
    const colors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <div class="notification-progress"></div>
    `;
    
    // Стили для уведомления
    notification.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        max-width: 400px;
        margin-bottom: 10px;
        padding: 16px 20px;
        background: ${colors[type] || colors.info};
        color: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        position: relative;
        overflow: hidden;
        transform: translateX(400px);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        pointer-events: all;
        cursor: pointer;
    `;
    
    // Стили для иконки
    const iconEl = notification.querySelector('.notification-icon');
    iconEl.style.cssText = `
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        flex-shrink: 0;
    `;
    
    // Стили для контента
    const contentEl = notification.querySelector('.notification-content');
    contentEl.style.cssText = `
        flex: 1;
        line-height: 1.5;
    `;
    
    // Стили для прогресс-бара
    const progressEl = notification.querySelector('.notification-progress');
    progressEl.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 0 0 12px 12px;
        animation: notificationProgress 3s linear forwards;
    `;
    
    // Добавляем стили анимации, если их еще нет
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes notificationProgress {
                from { width: 100%; }
                to { width: 0%; }
            }
            
            .custom-notification:hover {
                transform: translateX(-10px) !important;
            }
            
            .custom-notification:hover .notification-progress {
                animation-play-state: paused;
            }
        `;
        document.head.appendChild(styles);
    }
    
    container.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Клик для закрытия
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Автоматическое удаление через 3 секунды
    const autoRemoveTimeout = setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // При наведении останавливаем таймер
    notification.addEventListener('mouseenter', () => {
        clearTimeout(autoRemoveTimeout);
    });
}

// --- УТИЛИТЫ ---
function toggleGradient() {
    const toggle = document.getElementById('gradient-toggle');
    const colors = document.getElementById('gradient-colors');
    
    if (toggle && colors) {
        toggle.classList.toggle('active');
        colors.style.display = toggle.classList.contains('active') ? 'flex' : 'none';
    }
}

// --- УПРАВЛЕНИЕ СТАТУСАМИ ПРОЕКТОВ ---
function selectProjectStatus(status) {
    currentProjectStatus = status;
    console.log('Выбран статус:', status);
    
    // Перерисовываем селектор для обновления всех стилей
    renderStatusSelector();
    
    // Показываем уведомление
    showNotification(`Статус изменен на: ${getStatusName(status)}`, 'success');
}

// Вспомогательная функция для получения имени статуса
function getStatusName(statusId) {
    const allStatuses = [...projectStatuses];
    
    // Добавляем кастомные статусы из localStorage
    try {
        const savedStatuses = localStorage.getItem('projectStatuses');
        if (savedStatuses) {
            const customStatuses = JSON.parse(savedStatuses);
            allStatuses.push(...customStatuses);
        }
    } catch (error) {
        console.warn('Ошибка загрузки кастомных статусов:', error);
    }
    
    const status = allStatuses.find(s => s.id === statusId);
    return status ? status.name : statusId;
}

function renderStatusSelector() {
    const container = document.querySelector('.status-selector');
    if (!container) return;
    
    container.innerHTML = '';
    
    projectStatuses.forEach(status => {
        const statusEl = document.createElement('div');
        statusEl.className = 'status-option';
        statusEl.setAttribute('data-status', status.id);
        // Добавляем обработчик клика после установки innerHTML
        statusEl.addEventListener('click', function(e) {
            // Игнорируем клики на кнопке удаления
            if (e.target.tagName === 'BUTTON') return;
            selectProjectStatus(status.id);
        });
        
        if (status.id === currentProjectStatus) {
            statusEl.classList.add('active');
        }
        
        const isActive = status.id === currentProjectStatus;
        
        statusEl.style.cssText = `
            padding: 16px;
            border: 2px solid ${isActive ? status.color : 'transparent'};
            border-radius: var(--radius-md);
            background: ${isActive ? status.color + '20' : 'var(--bg-tertiary)'};
            cursor: pointer;
            text-align: center;
            transition: var(--transition);
            position: relative;
            box-shadow: ${isActive ? '0 4px 12px ' + status.color + '40' : 'none'};
        `;
        
        statusEl.innerHTML = `
            ${isActive ? '<div style="position: absolute; top: 4px; left: 4px; color: ' + status.color + '; font-size: 16px;">✓</div>' : ''}
            <div style="font-size: 20px; margin-bottom: 8px;">${status.icon}</div>
            <div style="font-weight: 600; color: var(--text-primary);">${status.name}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${status.description}</div>
            ${isActive ? '<div style="margin-top: 8px; font-size: 10px; color: ' + status.color + '; font-weight: 600;">ВЫБРАН</div>' : ''}
        `;
        
        // Добавляем кнопку удаления для кастомных статусов
        if (status.id !== 'active' && status.id !== 'coming-soon') {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '×';
            deleteBtn.style.cssText = `
                position: absolute;
                top: 4px;
                right: 4px;
                background: var(--accent-error);
                color: white;
                border: none;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 12px;
                cursor: pointer;
                display: none;
            `;
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteStatus(status.id);
            };
            statusEl.appendChild(deleteBtn);
            
            // Показываем кнопку при наведении
            statusEl.addEventListener('mouseenter', () => {
                deleteBtn.style.display = 'flex';
                deleteBtn.style.alignItems = 'center';
                deleteBtn.style.justifyContent = 'center';
            });
            statusEl.addEventListener('mouseleave', () => {
                deleteBtn.style.display = 'none';
            });
        }
        
        // Добавляем эффекты hover для статусов
        statusEl.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.borderColor = status.color + '60';
                this.style.background = status.color + '10';
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }
        });
        
        statusEl.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.borderColor = 'transparent';
                this.style.background = 'var(--bg-tertiary)';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            }
        });
        
        container.appendChild(statusEl);
    });
    
    // Добавляем кнопку для создания нового статуса
    const addBtn = document.createElement('div');
    addBtn.className = 'status-option add-status';
    addBtn.style.cssText = `
        padding: 16px;
        border: 2px dashed var(--border-primary);
        border-radius: var(--radius-md);
        background: transparent;
        cursor: pointer;
        text-align: center;
        transition: var(--transition);
        color: var(--text-secondary);
    `;
    addBtn.innerHTML = `
        <div style="font-size: 20px; margin-bottom: 8px;">➕</div>
        <div style="font-weight: 600;">Добавить статус</div>
        <div style="font-size: 12px;">Создать новый</div>
    `;
    addBtn.onclick = createNewStatus;
    
    addBtn.addEventListener('mouseenter', () => {
        addBtn.style.borderColor = 'var(--accent-primary)';
        addBtn.style.color = 'var(--accent-primary)';
    });
    addBtn.addEventListener('mouseleave', () => {
        addBtn.style.borderColor = 'var(--border-primary)';
        addBtn.style.color = 'var(--text-secondary)';
    });
    
    container.appendChild(addBtn);
}

function createNewStatus() {
    const modal = document.createElement('div');
    modal.className = 'status-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(10px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        padding: 32px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;
    
    modalContent.innerHTML = `
        <h3 style="color: var(--text-primary); margin-bottom: 24px; font-size: 20px;">Создать новый статус</h3>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; color: var(--text-secondary); margin-bottom: 8px; font-size: 14px;">Название статуса</label>
            <input type="text" id="status-name-input" placeholder="Например: В тестировании" style="
                width: 100%;
                padding: 12px 16px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                font-size: 14px;
            "/>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; color: var(--text-secondary); margin-bottom: 8px; font-size: 14px;">Описание</label>
            <input type="text" id="status-description-input" placeholder="Например: Проект на стадии тестирования" style="
                width: 100%;
                padding: 12px 16px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                font-size: 14px;
            "/>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; color: var(--text-secondary); margin-bottom: 8px; font-size: 14px;">Выберите иконку</label>
            <div id="status-icons" style="
                display: grid;
                grid-template-columns: repeat(8, 1fr);
                gap: 8px;
                margin-bottom: 16px;
            ">
                ${['🔧', '⚠️', '🔄', '⏳', '🎯', '🔥', '💎', '⭐', '🚧', '📋', '🔒', '📈', '🎨', '🧪', '📦', '🌟'].map(icon => `
                    <button type="button" class="status-icon-btn" data-icon="${icon}" style="
                        width: 48px;
                        height: 48px;
                        background: var(--bg-tertiary);
                        border: 2px solid transparent;
                        border-radius: var(--radius-md);
                        font-size: 24px;
                        cursor: pointer;
                        transition: var(--transition);
                    " onclick="selectStatusIcon(this)">${icon}</button>
                `).join('')}
            </div>
            <input type="text" id="custom-status-icon-input" placeholder="Или введите свой эмодзи" style="
                width: 100%;
                padding: 12px 16px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                font-size: 14px;
            "/>
        </div>
        
        <div style="margin-bottom: 24px;">
            <label style="display: block; color: var(--text-secondary); margin-bottom: 8px; font-size: 14px;">Цвет статуса</label>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;">
                ${['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => `
                    <button type="button" class="color-btn" data-color="${color}" style="
                        width: 48px;
                        height: 48px;
                        background: ${color};
                        border: 2px solid transparent;
                        border-radius: var(--radius-md);
                        cursor: pointer;
                        transition: var(--transition);
                    " onclick="selectStatusColor(this)"></button>
                `).join('')}
            </div>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button onclick="closeStatusModal()" style="
                padding: 10px 20px;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                cursor: pointer;
                font-size: 14px;
            ">Отмена</button>
            <button onclick="saveNewStatus()" style="
                padding: 10px 20px;
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                border: none;
                border-radius: var(--radius-md);
                color: white;
                cursor: pointer;
                font-size: 14px;
            ">Создать статус</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeStatusModal();
        }
    });
    
    window.currentStatusModal = modal;
    window.selectedStatusIcon = null;
    window.selectedStatusColor = '#3b82f6';
    
    // Фокус на первом поле
    setTimeout(() => {
        document.getElementById('status-name-input').focus();
    }, 100);
}

function selectStatusIcon(btn) {
    document.querySelectorAll('.status-icon-btn').forEach(b => {
        b.style.borderColor = 'transparent';
    });
    btn.style.borderColor = 'var(--accent-primary)';
    window.selectedStatusIcon = btn.dataset.icon;
    document.getElementById('custom-status-icon-input').value = '';
}

function selectStatusColor(btn) {
    document.querySelectorAll('.color-btn').forEach(b => {
        b.style.borderColor = 'transparent';
    });
    btn.style.borderColor = 'white';
    window.selectedStatusColor = btn.dataset.color;
}

function closeStatusModal() {
    if (window.currentStatusModal) {
        window.currentStatusModal.remove();
        window.currentStatusModal = null;
    }
}

function saveNewStatus() {
    const name = document.getElementById('status-name-input').value.trim();
    const description = document.getElementById('status-description-input').value.trim();
    const customIcon = document.getElementById('custom-status-icon-input').value.trim();
    const icon = customIcon || window.selectedStatusIcon || '📋';
    const color = window.selectedStatusColor || '#3b82f6';
    
    if (!name) {
        showNotification('Введите название статуса', 'error');
        return;
    }
    
    const newStatus = {
        id: 'custom-' + Date.now(),
        name: name,
        icon: icon,
        description: description || 'Кастомный статус',
        color: color,
        bgColor: color + '20'
    };
    
    projectStatuses.push(newStatus);
    saveStatusesToLocalStorage();
    renderStatusSelector();
    closeStatusModal();
    showNotification('Статус создан успешно!', 'success');
}

function deleteStatus(statusId) {
    if (statusId === 'active' || statusId === 'coming-soon') {
        showNotification('Нельзя удалить системный статус', 'error');
        return;
    }
    
    if (confirm('Удалить этот статус?')) {
        projectStatuses = projectStatuses.filter(s => s.id !== statusId);
        saveStatusesToLocalStorage();
        renderStatusSelector();
        showNotification('Статус удален', 'success');
    }
}

// --- УПРАВЛЕНИЕ СТАТУСАМИ В LOCALSTORAGE ---
function saveStatusesToLocalStorage() {
    try {
        // Сохраняем только кастомные статусы (не системные)
        const customStatuses = projectStatuses.filter(s => 
            s.id !== 'active' && s.id !== 'coming-soon'
        );
        localStorage.setItem('projectStatuses', JSON.stringify(customStatuses));
        console.log('Статусы сохранены в localStorage:', customStatuses);
    } catch (error) {
        console.error('Ошибка сохранения статусов:', error);
        showNotification('Ошибка сохранения статусов', 'error');
    }
}

function loadStatusesFromLocalStorage() {
    try {
        const savedStatuses = localStorage.getItem('projectStatuses');
        if (savedStatuses) {
            const customStatuses = JSON.parse(savedStatuses);
            // Добавляем кастомные статусы к системным
            projectStatuses = [
                ...projectStatuses.filter(s => s.id === 'active' || s.id === 'coming-soon'),
                ...customStatuses
            ];
            console.log('Статусы загружены из localStorage:', customStatuses);
        }
    } catch (error) {
        console.error('Ошибка загрузки статусов:', error);
    }
}

// --- УПРАВЛЕНИЕ ИЗОБРАЖЕНИЯМИ ---
function handleImageUpload(event) {
    const files = event.target.files;
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                currentProjectImages.push(e.target.result);
                updateProjectImagesPreview();
            };
            reader.readAsDataURL(file);
        }
    }
}

function addImageFromURL() {
    const urlInput = document.getElementById('project-image-url');
    const url = urlInput.value.trim();
    
    if (url) {
        currentProjectImages.push(url);
        updateProjectImagesPreview();
        urlInput.value = '';
    }
}

function removeProjectImage(index) {
    currentProjectImages.splice(index, 1);
    updateProjectImagesPreview();
}

function updateProjectImagesPreview() {
    const preview = document.getElementById('project-images-preview');
    if (!preview) return;
    
    preview.innerHTML = '';
    
    currentProjectImages.forEach((image, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-preview-item';
        imageContainer.innerHTML = `
            <img src="${image}" alt="Изображение ${index + 1}">
            <button type="button" class="btn-remove-image" onclick="removeProjectImage(${index})">×</button>
        `;
        preview.appendChild(imageContainer);
    });
}

// Drag & Drop функции
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('image-dropzone').classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Проверяем, действительно ли мы покинули dropzone
    if (!e.currentTarget.contains(e.relatedTarget)) {
        document.getElementById('image-dropzone').classList.remove('dragover');
    }
}

function handleImageDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const dropzone = document.getElementById('image-dropzone');
    dropzone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processImageFiles(files);
    }
}

function processImageFiles(files) {
    Array.from(files).forEach(file => {
        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            showNotification('Можно загружать только изображения', 'error');
            return;
        }
        
        // Проверяем размер файла (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showNotification('Размер файла не должен превышать 10MB', 'error');
            return;
        }
        
        // Создаем FileReader для предпросмотра
        const reader = new FileReader();
        reader.onload = function(e) {
            currentProjectImages.push(e.target.result);
            updateProjectImagesPreview();
            showNotification('Изображение добавлено', 'success');
        };
        reader.readAsDataURL(file);
    });
}

// Улучшенная функция загрузки через input
function handleImageUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        processImageFiles(files);
    }
    // Очищаем input для возможности повторной загрузки того же файла
    event.target.value = '';
}

// --- НОВЫЙ СЕЛЕКТОР СТАТУСОВ ---
function initializeStatusSelector() {
    const statusOptions = document.querySelectorAll('.status-option-new');
    statusOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Убираем активный класс у всех опций
            statusOptions.forEach(opt => opt.classList.remove('active'));
            
            // Добавляем активный класс к выбранной опции
            this.classList.add('active');
            
            // Сохраняем выбранный статус
            currentProjectStatus = this.getAttribute('data-status');
            
            console.log('Выбран статус:', currentProjectStatus);
        });
    });
    
    // Устанавливаем активный статус по умолчанию
    const defaultStatus = document.querySelector('.status-option-new[data-status="active"]');
    if (defaultStatus) {
        defaultStatus.classList.add('active');
        currentProjectStatus = 'active';
    }
}

function setProjectStatus(status) {
    const statusOptions = document.querySelectorAll('.status-option-new');
    statusOptions.forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-status') === status) {
            option.classList.add('active');
        }
    });
    currentProjectStatus = status;
}

// --- АВТОСОХРАНЕНИЕ ---
let autoSaveTimer = null;
let lastSaveData = {};

function initializeAutoSave() {
    const autoSaveFields = [
        'project-title',
        'project-description', 
        'project-long-description',
        'project-link',
        'hero-title',
        'hero-description',
        'about-text1',
        'about-text2',
        'contact-email',
        'contact-phone',
        'contact-address'
    ];
    
    autoSaveFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                scheduleAutoSave(fieldId, field.value);
            });
            
            // Загружаем сохраненные данные
            const savedValue = getAutoSavedValue(fieldId);
            if (savedValue && savedValue !== field.value) {
                showAutoSaveRestore(fieldId, savedValue);
            }
        }
    });
}

function scheduleAutoSave(fieldId, value) {
    clearTimeout(autoSaveTimer);
    
    autoSaveTimer = setTimeout(() => {
        saveFieldValue(fieldId, value);
        showAutoSaveIndicator();
    }, 1000); // Автосохранение через 1 секунду после остановки печати
}

function saveFieldValue(fieldId, value) {
    const autoSaveData = JSON.parse(localStorage.getItem('autoSave') || '{}');
    autoSaveData[fieldId] = {
        value: value,
        timestamp: Date.now()
    };
    localStorage.setItem('autoSave', JSON.stringify(autoSaveData));
}

function getAutoSavedValue(fieldId) {
    const autoSaveData = JSON.parse(localStorage.getItem('autoSave') || '{}');
    const fieldData = autoSaveData[fieldId];
    
    if (fieldData) {
        // Проверяем, не старше ли сохранение 24 часов
        const hoursSinceLastSave = (Date.now() - fieldData.timestamp) / (1000 * 60 * 60);
        if (hoursSinceLastSave < 24) {
            return fieldData.value;
        }
    }
    return null;
}

function showAutoSaveIndicator() {
    // Создаем индикатор автосохранения если его нет
    let indicator = document.getElementById('autosave-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'autosave-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--accent-success);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        document.body.appendChild(indicator);
    }
    
    indicator.innerHTML = '<span>💾</span> Автосохранено';
    indicator.style.opacity = '1';
    
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}

function showAutoSaveRestore(fieldId, savedValue) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'autosave-restore-btn';
    restoreBtn.innerHTML = '🔄 Восстановить несохраненные данные';
    restoreBtn.style.cssText = `
        position: absolute;
        top: -30px;
        right: 0;
        background: var(--accent-warning);
        color: white;
        border: none;
        padding: 4px 8px;
        font-size: 11px;
        border-radius: 4px;
        cursor: pointer;
        z-index: 1000;
    `;
    
    restoreBtn.onclick = function() {
        field.value = savedValue;
        field.dispatchEvent(new Event('input'));
        restoreBtn.remove();
    };
    
    // Делаем родительский элемент позиционным
    field.parentElement.style.position = 'relative';
    field.parentElement.appendChild(restoreBtn);
    
    // Удаляем кнопку через 10 секунд
    setTimeout(() => {
        if (restoreBtn.parentElement) {
            restoreBtn.remove();
        }
    }, 10000);
}

// --- БЫСТРЫЙ ВЫБОР ТЕХНОЛОГИЙ ---
function initializeTechQuickSelect() {
    const container = document.getElementById('tech-quick-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Показываем самые популярные технологии
    const popularTechs = presetTechnologies
        .filter(tech => ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'Docker', 'Git', 'Figma', 'Photoshop', 'TypeScript'].includes(tech.name))
        .slice(0, 12);
    
    popularTechs.forEach(tech => {
        const techElement = document.createElement('div');
        techElement.className = 'tech-quick-item';
        techElement.innerHTML = `
            <span>${tech.icon}</span>
            <span>${tech.name}</span>
        `;
        
        techElement.addEventListener('click', function() {
            addTechFromPreset(tech);
        });
        
        container.appendChild(techElement);
    });
    
    updateTechQuickSelectState();
}

function addTechFromPreset(tech) {
    // Проверяем, не добавлена ли уже эта технология
    const isAlreadyAdded = currentTechnologies.some(t => t.name === tech.name);
    if (isAlreadyAdded) {
        showNotification(`${tech.name} уже добавлена`, 'warning');
        return;
    }
    
    // Добавляем технологию
    currentTechnologies.push({
        name: tech.name,
        icon: tech.icon
    });
    
    displayTechnologies();
    updateTechQuickSelectState();
    showNotification(`${tech.name} добавлена`, 'success');
}

function updateTechQuickSelectState() {
    const quickItems = document.querySelectorAll('.tech-quick-item');
    quickItems.forEach(item => {
        const techName = item.querySelector('span:last-child').textContent;
        const isAdded = currentTechnologies.some(t => t.name === techName);
        
        if (isAdded) {
            item.classList.add('added');
        } else {
            item.classList.remove('added');
        }
    });
}

function addCustomTechnology() {
    const name = prompt('Название технологии:');
    if (!name) return;
    
    const icon = prompt('Эмодзи для технологии (оставьте пустым для 🔧):') || '🔧';
    
    // Проверяем дубликаты
    const isAlreadyAdded = currentTechnologies.some(t => t.name.toLowerCase() === name.toLowerCase());
    if (isAlreadyAdded) {
        showNotification(`${name} уже добавлена`, 'warning');
        return;
    }
    
    currentTechnologies.push({ name, icon });
    displayTechnologies();
    updateTechQuickSelectState();
    showNotification(`${name} добавлена`, 'success');
}

function clearAllTechnologies() {
    if (confirm('Удалить все технологии?')) {
        currentTechnologies = [];
        displayTechnologies();
        updateTechQuickSelectState();
        showNotification('Все технологии удалены', 'info');
    }
}

// --- ПРЕДПРОСМОТР ПРОЕКТА ---
function previewProject() {
    const title = document.getElementById('project-title').value;
    const description = document.getElementById('project-description').value;
    const longDescription = document.getElementById('project-long-description').value;
    const link = document.getElementById('project-link').value;
    const category = document.getElementById('project-category').value;
    
    if (!title.trim()) {
        showNotification('Заполните название проекта', 'warning');
        return;
    }
    
    // Создаем модальное окно предпросмотра
    const modal = document.createElement('div');
    modal.className = 'preview-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
    `;
    
    // Получаем статус проекта
    const statusText = getStatusDisplayText(currentProjectStatus);
    const statusColor = getStatusColor(currentProjectStatus);
    
    // Формируем теги
    const tagsHTML = currentTags.length > 0 ? 
        currentTags.map(tag => `<span class="preview-tag">${tag}</span>`).join('') : 
        '<span class="preview-no-tags">Теги не указаны</span>';
    
    // Формируем технологии
    const techHTML = currentTechnologies.length > 0 ?
        currentTechnologies.map(tech => `
            <div class="preview-tech">
                <span>${tech.icon}</span>
                <span>${tech.name}</span>
            </div>
        `).join('') :
        '<span class="preview-no-tech">Технологии не указаны</span>';
    
    // Основное изображение
    const mainImage = currentProjectImages.length > 0 ? 
        currentProjectImages[0] : 
        'https://via.placeholder.com/400x250/1a1a1a/666?text=Нет+изображения';
    
    modal.innerHTML = `
        <div class="preview-content" style="
            background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
            border-radius: 20px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            border: 1px solid rgba(121, 40, 202, 0.3);
            box-shadow: 0 40px 80px rgba(0, 0, 0, 0.8);
        ">
            <button onclick="closePreviewModal()" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border: none;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                cursor: pointer;
                font-size: 18px;
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
            
            <div class="preview-image" style="
                width: 100%;
                height: 250px;
                background: url('${mainImage}') center/cover;
                border-radius: 20px 20px 0 0;
                position: relative;
            ">
                <div class="preview-status" style="
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    background: ${statusColor};
                    color: white;
                    padding: 6px 12px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: 600;
                ">${statusText}</div>
            </div>
            
            <div class="preview-info" style="
                padding: 30px;
                color: white;
            ">
                <h2 style="
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 10px;
                    background: linear-gradient(135deg, #fff 0%, #e0e0e0 50%, #fff 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                ">${title}</h2>
                
                <div style="
                    display: inline-block;
                    background: rgba(121, 40, 202, 0.1);
                    color: rgba(121, 40, 202, 0.9);
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    margin-bottom: 15px;
                    border: 1px solid rgba(121, 40, 202, 0.3);
                ">${getCategoryDisplayName(category)}</div>
                
                <p style="
                    color: #e0e0e0;
                    line-height: 1.6;
                    margin-bottom: 20px;
                    font-size: 14px;
                ">${description || 'Описание не указано'}</p>
                
                ${longDescription ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #fff; font-size: 16px; margin-bottom: 10px;">Подробное описание:</h4>
                        <p style="color: #ccc; line-height: 1.6; font-size: 14px;">${longDescription}</p>
                    </div>
                ` : ''}
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #fff; font-size: 16px; margin-bottom: 10px;">Теги:</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${tagsHTML}
                    </div>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h4 style="color: #fff; font-size: 16px; margin-bottom: 10px;">Технологии:</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${techHTML}
                    </div>
                </div>
                
                <div style="
                    display: flex;
                    gap: 12px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    ${link && link !== '#' && currentProjectStatus === 'active' ? `
                        <button style="
                            background: linear-gradient(135deg, #7928CA, #FF0080);
                            color: white;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 25px;
                            font-weight: 600;
                            cursor: pointer;
                            flex: 1;
                        " onclick="window.open('${link}', '_blank')">
                            Открыть проект
                        </button>
                    ` : `
                        <button style="
                            background: #333;
                            color: #888;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 25px;
                            font-weight: 600;
                            cursor: not-allowed;
                            flex: 1;
                        " disabled>
                            ${statusText}
                        </button>
                    `}
                    <button onclick="closePreviewModal()" style="
                        background: rgba(255, 255, 255, 0.1);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 12px 20px;
                        border-radius: 25px;
                        font-weight: 600;
                        cursor: pointer;
                        flex: 1;
                    ">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Добавляем стили для элементов предпросмотра
    const style = document.createElement('style');
    style.textContent = `
        .preview-tag {
            background: linear-gradient(135deg, rgba(121, 40, 202, 0.3), rgba(255, 0, 128, 0.2));
            color: #E1BEE7;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid rgba(121, 40, 202, 0.4);
        }
        
        .preview-no-tags, .preview-no-tech {
            color: #888;
            font-style: italic;
            font-size: 14px;
        }
        
        .preview-tech {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(255, 255, 255, 0.1);
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 13px;
            color: #fff;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Функция закрытия
    window.closePreviewModal = function() {
        modal.remove();
        style.remove();
        delete window.closePreviewModal;
    };
    
    // Закрытие по клику на фон
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            window.closePreviewModal();
        }
    });
}

function getStatusDisplayText(status) {
    const statusMap = {
        'active': '✅ Готов',
        'coming-soon': '🚀 В разработке',
        'paused': '⏸️ Приостановлен'
    };
    return statusMap[status] || '✅ Готов';
}

function getStatusColor(status) {
    const colorMap = {
        'active': '#10b981',
        'coming-soon': '#8b5cf6',
        'paused': '#f59e0b'
    };
    return colorMap[status] || '#10b981';
}

function getCategoryDisplayName(category) {
    const categoryMap = {
        'image': '🖼️ Изображения',
        'video': '🎬 Видео',
        'web': '🌐 Веб-сайты',
        'app': '📱 Приложения'
    };
    return categoryMap[category] || category;
}

function updateImagePreview(imageUrl) {
    // Устаревшая функция, оставлена для совместимости
    const preview = document.getElementById('image-preview');
    if (preview) {
        preview.innerHTML = imageUrl ? 
            `<img src="${imageUrl}" alt="Превью" style="max-width: 100%; height: auto;">` :
            '<p>Нет изображения</p>';
    }
}

// --- ПРЕДУСТАНОВЛЕННЫЕ ТЕХНОЛОГИИ ---
const presetTechnologies = [
    // Frontend
    { name: 'HTML', icon: '🌐', category: 'frontend' },
    { name: 'CSS', icon: '🎨', category: 'frontend' },
    { name: 'JavaScript', icon: '⚡', category: 'frontend' },
    { name: 'React', icon: '⚛️', category: 'frontend' },
    { name: 'Vue.js', icon: '💚', category: 'frontend' },
    { name: 'Angular', icon: '🅰️', category: 'frontend' },
    { name: 'TypeScript', icon: '📘', category: 'frontend' },
    { name: 'Sass', icon: '💗', category: 'frontend' },
    { name: 'Tailwind', icon: '🎯', category: 'frontend' },
    
    // Backend
    { name: 'Node.js', icon: '🟢', category: 'backend' },
    { name: 'Python', icon: '🐍', category: 'backend' },
    { name: 'PHP', icon: '🐘', category: 'backend' },
    { name: 'Java', icon: '☕', category: 'backend' },
    { name: 'C#', icon: '💎', category: 'backend' },
    { name: 'Go', icon: '🐹', category: 'backend' },
    { name: 'Rust', icon: '🦀', category: 'backend' },
    
    // Databases
    { name: 'MongoDB', icon: '🍃', category: 'database' },
    { name: 'MySQL', icon: '🐬', category: 'database' },
    { name: 'PostgreSQL', icon: '🐘', category: 'database' },
    { name: 'Redis', icon: '🔴', category: 'database' },
    { name: 'SQLite', icon: '💽', category: 'database' },
    
    // Mobile
    { name: 'React Native', icon: '📱', category: 'mobile' },
    { name: 'Flutter', icon: '💙', category: 'mobile' },
    { name: 'Swift', icon: '🍎', category: 'mobile' },
    { name: 'Kotlin', icon: '🤖', category: 'mobile' },
    
    // Tools
    { name: 'Docker', icon: '🐳', category: 'tools' },
    { name: 'Git', icon: '📚', category: 'tools' },
    { name: 'Webpack', icon: '📦', category: 'tools' },
    { name: 'Vite', icon: '⚡', category: 'tools' },
    { name: 'Firebase', icon: '🔥', category: 'tools' },
    
    // Design & Creative
    { name: 'Figma', icon: '🎨', category: 'design' },
    { name: 'Photoshop', icon: '🖼️', category: 'design' },
    { name: 'Blender', icon: '🌀', category: 'design' },
    { name: 'After Effects', icon: '✨', category: 'design' },
    
    // AI & ML
    { name: 'TensorFlow', icon: '🧠', category: 'ai' },
    { name: 'PyTorch', icon: '🔥', category: 'ai' },
    { name: 'OpenAI', icon: '🤖', category: 'ai' },
    { name: 'Stable Diffusion', icon: '🌊', category: 'ai' }
];

// --- ИНИЦИАЛИЗАЦИЯ ТЕХНОЛОГИЙ ---
function initializeTechnologies() {
    // Инициализация технологий по умолчанию
    if (currentTechnologies.length === 0) {
        currentTechnologies = [
            { name: 'HTML', icon: '🌐' },
            { name: 'CSS', icon: '🎨' },
            { name: 'JavaScript', icon: '⚡' }
        ];
    }
    
    // Инициализируем быстрый выбор
    initializeTechQuickSelect();
    
    // Отображаем технологии после инициализации
    displayTechnologies();
}

// --- УПРАВЛЕНИЕ ТЕХНОЛОГИЯМИ ---
function addTechnology() {
    // Создаем модальное окно для добавления технологии
    const modal = document.createElement('div');
    modal.className = 'tech-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(10px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        padding: 32px;
        max-width: 480px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;
    
    modalContent.innerHTML = `
        <h3 style="color: var(--text-primary); margin-bottom: 24px; font-size: 20px;">Добавить технологию</h3>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; color: var(--text-secondary); margin-bottom: 8px; font-size: 14px;">Название технологии</label>
            <input type="text" id="tech-name-input" placeholder="Например: React" style="
                width: 100%;
                padding: 12px 16px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                font-size: 14px;
                transition: var(--transition);
            "/>
        </div>
        
        <div style="margin-bottom: 24px;">
            <label style="display: block; color: var(--text-secondary); margin-bottom: 8px; font-size: 14px;">Выберите иконку</label>
            <div id="tech-icons" style="
                display: grid;
                grid-template-columns: repeat(8, 1fr);
                gap: 8px;
                margin-bottom: 16px;
            ">
                ${['⚛️', '🔥', '🌐', '📱', '🎨', '⚡', '🔧', '💎', '🚀', '📊', '🎯', '💻', '🌟', '🔒', '📦', '🎮'].map(icon => `
                    <button type="button" class="icon-btn" data-icon="${icon}" style="
                        width: 48px;
                        height: 48px;
                        background: var(--bg-tertiary);
                        border: 2px solid transparent;
                        border-radius: var(--radius-md);
                        font-size: 24px;
                        cursor: pointer;
                        transition: var(--transition);
                    " onmouseover="this.style.borderColor='var(--accent-primary)'" 
                       onmouseout="this.style.borderColor='transparent'"
                       onclick="selectTechIcon(this)">${icon}</button>
                `).join('')}
            </div>
            <input type="text" id="custom-icon-input" placeholder="Или введите свой эмодзи" style="
                width: 100%;
                padding: 12px 16px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                font-size: 14px;
            "/>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button onclick="closeTechModal()" style="
                padding: 10px 20px;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: var(--transition);
            ">Отмена</button>
            <button onclick="saveTechnology()" style="
                padding: 10px 20px;
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                border: none;
                border-radius: var(--radius-md);
                color: white;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: var(--transition);
            ">Добавить</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Фокус на поле ввода
    setTimeout(() => {
        document.getElementById('tech-name-input').focus();
    }, 100);
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTechModal();
        }
    });
    
    // Сохраняем ссылку на модальное окно
    window.currentTechModal = modal;
    window.selectedTechIcon = null;
}

function selectTechIcon(btn) {
    // Убираем выделение с других кнопок
    document.querySelectorAll('.icon-btn').forEach(b => {
        b.style.borderColor = 'transparent';
        b.style.background = 'var(--bg-tertiary)';
    });
    
    // Выделяем выбранную кнопку
    btn.style.borderColor = 'var(--accent-primary)';
    btn.style.background = 'var(--bg-hover)';
    window.selectedTechIcon = btn.dataset.icon;
    
    // Очищаем поле custom icon
    document.getElementById('custom-icon-input').value = '';
}

function closeTechModal() {
    if (window.currentTechModal) {
        window.currentTechModal.remove();
        window.currentTechModal = null;
        window.selectedTechIcon = null;
    }
}

function saveTechnology() {
    const nameInput = document.getElementById('tech-name-input');
    const customIconInput = document.getElementById('custom-icon-input');
    
    const techName = nameInput.value.trim();
    const techIcon = customIconInput.value.trim() || window.selectedTechIcon || '🔧';
    
    if (!techName) {
        showNotification('Введите название технологии', 'error');
        return;
    }
    
    currentTechnologies.push({ name: techName, icon: techIcon });
    displayTechnologies();
    closeTechModal();
    showNotification('Технология добавлена', 'success');
}

function removeTechnology(index) {
    currentTechnologies.splice(index, 1);
    displayTechnologies();
    updateTechQuickSelectState();
}

function displayTechnologies() {
    const container = document.getElementById('tech-grid');
    if (!container) return;
    
    container.innerHTML = '';
    currentTechnologies.forEach((tech, index) => {
        const techEl = document.createElement('div');
        techEl.className = 'technology-item';
        techEl.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--bg-tertiary);
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-md);
            padding: 12px 16px;
            margin-bottom: 8px;
            transition: var(--transition);
        `;
        techEl.innerHTML = `
            <span style="display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-weight: 500;">
                <span style="font-size: 20px;">${tech.icon}</span>
                <span>${tech.name}</span>
            </span>
            <button class="btn-remove" onclick="removeTechnology(${index})" style="
                background: var(--accent-error);
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: var(--transition);
                display: flex;
                align-items: center;
                justify-content: center;
            " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='var(--accent-error)'">×</button>
        `;
        container.appendChild(techEl);
    });
    
    // Если нет технологий, показываем подсказку
    if (currentTechnologies.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            text-align: center;
            padding: 24px;
            color: var(--text-secondary);
            font-style: italic;
            border: 2px dashed var(--border-primary);
            border-radius: var(--radius-md);
            background: rgba(255, 255, 255, 0.02);
        `;
        placeholder.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 8px;">🔧</div>
            <div>Нажмите "Добавить технологию" чтобы добавить используемые технологии</div>
        `;
        container.appendChild(placeholder);
    }
}

// --- УПРАВЛЕНИЕ ТЕГАМИ ---
let currentTags = [];

function focusTagInput() {
    const input = document.getElementById('tag-input');
    if (input) input.focus();
}

function handleTagInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTag();
    }
}

function addTag() {
    const input = document.getElementById('tag-input');
    if (input && input.value.trim()) {
        const tag = input.value.trim();
        if (!currentTags.includes(tag)) {
            currentTags.push(tag);
            displayTags();
        }
        input.value = '';
    }
}

function removeTag(tag) {
    currentTags = currentTags.filter(t => t !== tag);
    displayTags();
}

function displayTags() {
    const container = document.getElementById('tags-display');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (currentTags.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            color: var(--text-secondary);
            font-style: italic;
            text-align: center;
            padding: 8px;
            width: 100%;
        `;
        placeholder.textContent = 'Теги не добавлены';
        container.appendChild(placeholder);
        return;
    }
    
    currentTags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        `;
        tagEl.innerHTML = `
            <span>${tag}</span>
            <button class="tag-remove" onclick="removeTag('${tag}')" style="
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: none;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: var(--transition);
            " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">×</button>
        `;
        container.appendChild(tagEl);
    });
}

function clearTags() {
    currentTags = [];
    displayTags();
}

// Делаем функции глобальными
window.showSection = showSection;
window.saveGeneral = saveGeneral;
window.saveHero = saveHero;
window.saveAbout = saveAbout;
window.saveContact = saveContact;
window.saveFeatures = saveFeatures;
window.addProject = addProject;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.saveProject = saveProject;
window.cancelProject = cancelProject;
window.cancelProjectEdit = cancelProject;
window.toggleFeature = toggleFeature;
window.toggleGradient = toggleGradient;
window.showNotification = showNotification;
window.addTechnology = addTechnology;
window.removeTechnology = removeTechnology;
window.displayTechnologies = displayTechnologies;
window.focusTagInput = focusTagInput;
window.handleTagInput = handleTagInput;
window.addTag = addTag;
window.removeTag = removeTag;
window.displayTags = displayTags;
window.clearTags = clearTags;
window.selectProjectStatus = selectProjectStatus;
window.updateImagePreview = updateImagePreview;
window.initializeTechnologies = initializeTechnologies;
window.handleImageUpload = handleImageUpload;
window.addImageFromURL = addImageFromURL;
window.removeProjectImage = removeProjectImage;
window.updateProjectImagesPreview = updateProjectImagesPreview;
window.selectTechIcon = selectTechIcon;
window.closeTechModal = closeTechModal;
window.saveTechnology = saveTechnology;
window.renderStatusSelector = renderStatusSelector;
window.createNewStatus = createNewStatus;
window.selectStatusIcon = selectStatusIcon;
window.selectStatusColor = selectStatusColor;
window.closeStatusModal = closeStatusModal;
window.saveNewStatus = saveNewStatus;
window.deleteStatus = deleteStatus;
window.getStatusName = getStatusName;

// Экспорт функций для будущих проектов
window.addFutureProject = addFutureProject;
window.editFutureProject = editFutureProject;
window.deleteFutureProject = deleteFutureProject;
window.saveFutureProject = saveFutureProject;
window.cancelFutureProject = cancelFutureProject;

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ КАРТОЧЕК ПРОЕКТОВ ---
function getStatusConfigAdmin(statusId) {
    // Ищем статус в объединенном массиве
    const allStatuses = [...projectStatuses];
    
    // Добавляем кастомные статусы из localStorage
    try {
        const savedStatuses = localStorage.getItem('projectStatuses');
        if (savedStatuses) {
            const customStatuses = JSON.parse(savedStatuses);
            allStatuses.push(...customStatuses);
        }
    } catch (error) {
        console.warn('Ошибка загрузки кастомных статусов:', error);
    }
    
    // Ищем статус
    const status = allStatuses.find(s => s.id === statusId);
    
    // Возвращаем статус или дефолтный
    return status || { 
        id: 'active', 
        name: 'Активен', 
        icon: '✅', 
        color: '#10b981' 
    };
}

function getCategoryName(category) {
    const categories = {
        'web': 'Сайт',
        'app': 'Приложение', 
        'image': 'Изображения',
        'video': 'Видео',
        'design': 'Дизайн'
    };
    return categories[category] || 'Другое';
}

// Экспортируем функции
window.getStatusConfigAdmin = getStatusConfigAdmin;
window.getCategoryName = getCategoryName;