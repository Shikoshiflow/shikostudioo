// Глобальные переменные
let isMenuOpen = false;
let currentFilter = 'all';
let featuresConfig = {};
let portfolioData = [];

// Функция для безопасного экранирования HTML
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}


// --- ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Сайт загружен');
    
    await loadFeaturesConfig();
    await loadPortfolioData();
    initializeNavigation();
    initializePortfolio();
    initializePreloader();
    initializeScrollEffects();
    initializeScrollAnimations();
    initializeContactForm();
    
    console.log('✓ Все функции инициализированы');
});

// --- ЗАГРУЗКА КОНФИГУРАЦИИ ФУНКЦИЙ ---
async function loadFeaturesConfig() {
    try {
        const response = await fetch('/api/features');
        if (response.ok) {
            featuresConfig = await response.json();
            console.log('Конфигурация функций загружена:', featuresConfig);
            applyFeatureStatuses();
        } else {
            console.log('Файл конфигурации функций не найден, используем значения по умолчанию');
            featuresConfig = {
                portfolio: true,
                about: true,
                future: true,
                contact: true,
                filter: true,
                form: true
            };
        }
    } catch (error) {
        console.error('Ошибка загрузки конфигурации функций:', error);
        featuresConfig = {
            portfolio: true,
            about: true,
            future: true,
            contact: true,
            filter: true,
            form: true
        };
    }
}

// --- ПРИМЕНЕНИЕ СТАТУСОВ ФУНКЦИЙ ---
function applyFeatureStatuses() {
    console.log('Применение статусов функций...');

    applyStatusToSection('about', featuresConfig.about);
    applyStatusToSection('portfolio', featuresConfig.portfolio);
    applyStatusToSection('future', featuresConfig.future);
    applyStatusToSection('contact', featuresConfig.contact);

    if (featuresConfig.filter === false) {
        const portfolioFilter = document.querySelector('.portfolio-filter');
        if (portfolioFilter) {
            portfolioFilter.style.display = 'none';
        }
    }

    if (featuresConfig.form === false) {
        const contactForm = document.querySelector('.contact-form-container');
        if (contactForm) {
            contactForm.style.display = 'none';
        }
    }

    updateNavigationForFeatures();
    loadAndApplyProjectStatuses();
}

async function loadAndApplyProjectStatuses() {
    try {
        const response = await fetch('/api/portfolio');
        if (response.ok) {
            const portfolioData = await response.json();
            console.log('Данные портфолио загружены:', portfolioData);
            applyProjectStatuses(portfolioData.items || []);
        }
    } catch (error) {
        console.error('Ошибка загрузки данных портфолио:', error);
    }
}

function applyProjectStatuses(projects) {
    console.log('Применение статусов проектов...');
    
    projects.forEach((project, index) => {
        const projectElement = document.querySelectorAll('.portfolio-item')[index];
        if (projectElement && project.status && project.status !== 'active') {
            const statusConfig = getStatusConfig(project.status);
            console.log(`Применяем статус "${statusConfig.name}" к проекту: ${project.title}`);
            
            projectElement.classList.add('portfolio-status-' + project.status);
            
            const card = projectElement.querySelector('.portfolio-card');
            if (card && !card.querySelector('.project-status-badge')) {
                const badge = document.createElement('div');
                badge.className = 'project-status-badge';
                badge.textContent = `${statusConfig.icon} ${statusConfig.name}`;
                badge.style.background = statusConfig.color;
                card.appendChild(badge);
            }
            
            const hoverContent = projectElement.querySelector('.portfolio-hover-content');
            if (hoverContent) {
                const btn = hoverContent.querySelector('.btn');
                if (btn) {
                    btn.innerHTML = `<div class="status-notice">${statusConfig.icon} ${statusConfig.description}</div>`;
                    btn.classList.add('btn-disabled');
                    btn.onclick = (e) => {
                        e.preventDefault();
                        showFeatureNotification(`${statusConfig.icon} ${statusConfig.description}`, 'info');
                    };
                }
            }
        }
    });
}

function applyStatusToSection(sectionName, status) {
    const section = document.getElementById(sectionName);
    if (!section) return;

    section.classList.remove('feature-disabled', 'feature-maintenance', 'feature-coming-soon');

    if (status === false) {
        section.classList.add('feature-disabled');
    } else if (status === 'maintenance') {
        section.classList.add('feature-maintenance');
    } else if (status === 'coming-soon') {
        section.classList.add('feature-coming-soon');
    }
}

function updateNavigationForFeatures() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            const sectionName = href.substring(1);
            const status = featuresConfig[sectionName];
            
            link.classList.remove('disabled', 'maintenance', 'coming-soon');
            
            if (status === false) {
                link.classList.add('disabled');
                link.title = 'Раздел временно недоступен';
            } else if (status === 'maintenance') {
                link.classList.add('maintenance');
                link.title = 'Раздел на доработке';
            } else if (status === 'coming-soon') {
                link.classList.add('coming-soon');
                link.title = 'Скоро появится';
            }
        }
    });
}

// --- НАВИГАЦИЯ ---
function initializeNavigation() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.innerHTML = `
            <li><a href="#home" class="nav-link active">Главная</a></li>
            <li><a href="#about" class="nav-link">Обо мне</a></li>
            <li><a href="#portfolio" class="nav-link">Портфолио</a></li>
            <li><a href="#future" class="nav-link">Будущие проекты</a></li>
            <li><a href="#contact" class="nav-link">Контакты</a></li>
        `;
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.getAttribute('href').substring(1);
            console.log('Клик по ссылке с targetId:', targetId);
            
            const status = featuresConfig[targetId];
            if (status === false) {
                showFeatureNotification('Этот раздел временно недоступен', 'error');
                return;
            } else if (status === 'maintenance') {
                showFeatureNotification('Раздел находится на доработке', 'warning');
            } else if (status === 'coming-soon') {
                showFeatureNotification('Этот раздел скоро появится!', 'info');
            }
            
            let target = document.getElementById(targetId);
            
            if (!target) {
                target = document.querySelector(`section[id="${targetId}"]`);
            }
            
            console.log('Найденный target:', target);
            
            if (target) {
                forceUpdateActiveNav(targetId);
                
                const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
                let targetPosition;
                
                if (targetId === 'contact') {
                    targetPosition = target.offsetTop - headerHeight + 50;
                } else {
                    targetPosition = target.offsetTop - headerHeight;
                }
                
                console.log('Позиция для скролла:', targetPosition);
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                if (isMenuOpen) {
                    toggleMobileMenu();
                }
                
                setTimeout(() => {
                    forceUpdateActiveNav(targetId);
                }, 500);
                
            } else {
                console.error(`Элемент с ID "${targetId}" не найден!`);
            }
        });
    });

    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    document.addEventListener('click', function(e) {
        const nav = document.querySelector('.nav');
        const navToggle = document.querySelector('.nav-toggle');
        
        if (isMenuOpen && nav && navToggle && !nav.contains(e.target) && !navToggle.contains(e.target)) {
            toggleMobileMenu();
        }
    });
}

function forceUpdateActiveNav(targetId) {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${targetId}`) {
            link.classList.add('active');
            console.log('Принудительно активирована ссылка:', href);
        }
    });
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.querySelector('.nav-toggle');
    
    isMenuOpen = !isMenuOpen;
    
    if (navMenu) {
        navMenu.classList.toggle('active', isMenuOpen);
    }
    
    if (navToggle) {
        navToggle.classList.toggle('active', isMenuOpen);
    }
    
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
}

function updateActiveNavLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// --- УВЕДОМЛЕНИЯ О СТАТУСЕ ФУНКЦИЙ ---
function showFeatureNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `feature-notification feature-notification-${type}`;
    notification.textContent = message;
    
    const colors = {
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6',
        'success': '#10b981'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        z-index: 10001;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
        font-weight: 500;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// --- ЗАГРУЗКА ДАННЫХ ПОРТФОЛИО ---
async function loadPortfolioData() {
    try {
        const response = await fetch('/api/portfolio');
        if (response.ok) {
            const data = await response.json();
            portfolioData = data.items || [];
            console.log('Данные портфолио загружены:', portfolioData);
            renderPortfolioItems();
        }
    } catch (error) {
        console.error('Ошибка загрузки портфолио:', error);
    }
}

// --- ПОЛУЧЕНИЕ КОНФИГУРАЦИИ СТАТУСА ---
function getStatusConfig(statusId) {
    // Статусы по умолчанию
    const defaultStatuses = [
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
    
    // Пытаемся загрузить пользовательские статусы из localStorage
    let customStatuses = [];
    try {
        const savedStatuses = localStorage.getItem('projectStatuses');
        if (savedStatuses) {
            customStatuses = JSON.parse(savedStatuses);
        }
    } catch (error) {
        console.warn('Ошибка загрузки пользовательских статусов:', error);
    }
    
    // Объединяем дефолтные и пользовательские статусы
    const allStatuses = [...defaultStatuses, ...customStatuses];
    
    // Ищем статус по ID
    const status = allStatuses.find(s => s.id === statusId);
    
    // Возвращаем найденный статус или дефолтный
    return status || defaultStatuses[0];
}

// --- РЕНДЕР ПРОЕКТОВ ПОРТФОЛИО ---
function renderPortfolioItems() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;
    
    // Очищаем существующие элементы
    portfolioGrid.innerHTML = '';
    
    portfolioData.forEach((project, index) => {
        const portfolioItem = document.createElement('div');
        portfolioItem.className = 'portfolio-item';
        portfolioItem.setAttribute('data-category', project.category || 'web');
        
        // Определяем статус проекта
        const projectStatus = project.status || 'active'; // По умолчанию "active"
        
        if (projectStatus === 'coming-soon') {
            portfolioItem.classList.add('portfolio-coming-soon');
        }
        
        // Берем первое изображение из массива или дефолтное
        const mainImage = project.images && project.images.length > 0 
            ? project.images[0] 
            : (project.image || 'assets/img/icons/placeholder-image.svg');
        
        // Формируем HTML тегов
        const tagsHTML = project.tags ? project.tags.map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('') : '';
        
        // Определяем бейдж статуса
        let statusBadgeHTML = '';
        
        // Показываем бейдж для всех статусов, кроме "active"
        if (projectStatus !== 'active') {
            const statusConfig = getStatusConfig(projectStatus);
            statusBadgeHTML = `
                <div class="project-status-badge" style="
                    background: ${statusConfig.color};
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    z-index: 5;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                ">
                    <span>${statusConfig.icon}</span>
                    <span>${statusConfig.name}</span>
                </div>
            `;
        }
        

        portfolioItem.innerHTML = `
            <div class="portfolio-card">
                ${statusBadgeHTML}
                <div class="portfolio-image">
                    <img src="${mainImage}" alt="${sanitizeHTML(project.title)}">
                </div>
                <div class="portfolio-info">
                    <h3 class="portfolio-title">${sanitizeHTML(project.title)}</h3>
                    <p class="portfolio-description">${sanitizeHTML(project.description)}</p>
                    <div class="portfolio-tags">
                        ${tagsHTML}
                    </div>
                </div>
                <div class="portfolio-hover">
                    <div class="portfolio-hover-content">
                        <h3>${sanitizeHTML(project.title)}</h3>
                        <p>${sanitizeHTML(project.longDescription || project.description)}</p>
                        <a href="#" class="btn btn-small">Подробнее</a>
                    </div>
                </div>
            </div>
        `;
        
        portfolioGrid.appendChild(portfolioItem);
    });
    
    // Переинициализируем обработчики событий после рендера
    attachPortfolioEventHandlers();
}

// --- ПОРТФОЛИО ---
function initializePortfolio() {
    if (featuresConfig.portfolio === false) {
        return;
    }

    // Отображаем проекты портфолио
    renderPortfolioItems();

    if (featuresConfig.filter !== false) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                setActiveFilter(this, filter);
                filterProjects(filter);
            });
        });
    }

    attachPortfolioEventHandlers();
}

// --- ПРИСОЕДИНЕНИЕ ОБРАБОТЧИКОВ СОБЫТИЙ К ПРОЕКТАМ ---
function attachPortfolioEventHandlers() {
    console.log('Присоединение обработчиков к проектам...');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    console.log('Найдено проектов:', portfolioItems.length);
    
    portfolioItems.forEach((item, index) => {
        const detailsBtn = item.querySelector('.btn-small');
        console.log(`Проект ${index}: кнопка найдена:`, !!detailsBtn);
        
        if (detailsBtn) {
            // Удаляем старые обработчики, если есть
            detailsBtn.replaceWith(detailsBtn.cloneNode(true));
            const newBtn = item.querySelector('.btn-small');
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Клик по проекту:', index);
                
                // Для веб-сайта открываем ссылку
                if (newBtn.getAttribute('href') === 'https://exteriatrade.net/') {
                    window.open('https://exteriatrade.net/', '_blank');
                    return;
                }
                
                // Для остальных проектов показываем модальное окно
                showProjectModalFromData(index);
            });
        }
    });
}

function setActiveFilter(activeBtn, filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
    currentFilter = filter;
}

function filterProjects(filter) {
    const items = document.querySelectorAll('.portfolio-item');
    
    items.forEach(item => {
        const category = item.getAttribute('data-category');
        const shouldShow = filter === 'all' || category === filter;
        
        if (shouldShow) {
            item.style.display = 'block';
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 100);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
}

// --- МОДАЛЬНОЕ ОКНО ИЗ ДАННЫХ JSON ---
function showProjectModalFromData(projectIndex) {
    const project = portfolioData[projectIndex];
    if (!project) return;
    
    const modal = document.createElement('div');
    modal.className = 'project-modal';
    
    const statusConfig = getStatusConfig(project.status || 'active');
    const statusText = `${statusConfig.icon} ${statusConfig.name}`;
    
    // Получаем изображения проекта
    const projectImages = project.images && project.images.length > 0 
        ? project.images 
        : [project.image || 'assets/img/icons/placeholder-image.svg'];
    
    // Главное изображение - первое из списка
    const mainImage = projectImages[0];
    
    const thumbnailsHTML = projectImages.map((img, i) => `
        <img src="${img}" 
             alt="Превью ${i + 1}" 
             class="thumbnail ${i === 0 ? 'active' : ''}" 
             onclick="changeGalleryImage('${img}', this)"
             loading="lazy">
    `).join('');
    
    // Формируем HTML технологий
    const technologiesHTML = project.technologies ? project.technologies.map(tech => `
        <div class="tech-item">
            <div class="tech-icon">${tech.icon}</div>
            <span class="tech-name">${tech.name}</span>
        </div>
    `).join('') : '';
    
    // Формируем теги
    const tagsHTML = project.tags ? project.tags.map(tag => 
        `<span class="modal-tag">${sanitizeHTML(tag)}</span>`
    ).join('') : '';
    
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeProjectModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeProjectModal()">×</button>
            
            <div class="modal-body">
                <div class="modal-image">
                    <img src="${mainImage}" alt="${sanitizeHTML(project.title)}" loading="lazy">
                </div>
                <div class="modal-info-content">
                <h2 class="modal-title">${sanitizeHTML(project.title)}</h2>
                <div class="modal-price">Цена по запросу</div>
                <div class="modal-description">${sanitizeHTML(project.longDescription || project.description)}</div>
                
                ${tagsHTML ? `
                    <div class="modal-tags">
                        ${tagsHTML}
                    </div>
                ` : ''}

                <div class="modal-actions">
                    ${project.link && project.link !== '#' && project.status === 'active' ? 
                        `<a href="${project.link}" target="_blank" class="btn btn-primary" style="background: linear-gradient(135deg, #7928CA, #FF0080); color: white;">
                            Открыть проект
                        </a>` : 
                        `<button class="btn btn-primary" disabled style="background: #333; color: #888;">
                            ${statusText}
                        </button>`
                    }
                    <button class="btn btn-secondary" onclick="closeProjectModal()" style="background: #333; color: white;">
                        Закрыть
                    </button>
                </div>
                </div>
            </div>
        </div>
    `;
    
    addModalStyles();
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Добавляем обработчик для закрытия по ESC
    function handleEscKey(e) {
        if (e.key === 'Escape') {
            closeProjectModal();
        }
    }
    document.addEventListener('keydown', handleEscKey);
    
    // Сохраняем ссылку на обработчик для последующего удаления
    modal.escHandler = handleEscKey;
    
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

// --- УЛУЧШЕННАЯ ФУНКЦИЯ МОДАЛЬНОГО ОКНА ---
function showProjectModal(projectIndex) {
    const projects = [
        {
            title: "AI-генерация изображений",
            description: "Серия уникальных изображений, созданных с помощью нейросетей",
            fullDescription: "Инновационный проект по созданию уникального визуального контента с использованием современных AI-технологий. Работа включает исследование различных моделей генерации изображений, создание арт-объектов и иллюстраций для различных медиа-проектов.",
            images: [
                "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1686191128892-8c1a12c7a9e6?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1676299081847-824916de030a?w=800&h=500&fit=crop"
            ],
            technologies: [
                { name: "Midjourney", icon: "🎨" },
                { name: "DALL-E", icon: "🤖" },
                { name: "Stable Diffusion", icon: "🌊" },
                { name: "Photoshop", icon: "🖼️" }
            ],
            category: "AI & Искусство",
            date: "2024",
            link: "#",
            status: "coming-soon"
        },
        {
            title: "Мобильное приложение",
            description: "Разработка функционального приложения для iOS и Android",
            fullDescription: "Кроссплатформенное мобильное приложение, разработанное с использованием React Native. Включает современный UI/UX дизайн, интеграцию с API, push-уведомления и оптимизацию производительности для обеих платформ.",
            images: [
                "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?w=800&h=500&fit=crop"
            ],
            technologies: [
                { name: "React Native", icon: "⚛️" },
                { name: "TypeScript", icon: "📘" },
                { name: "Redux", icon: "🔄" },
                { name: "Firebase", icon: "🔥" }
            ],
            category: "Мобильная разработка",
            date: "2024",
            link: "#",
            status: "coming-soon"
        },
        {
            title: "Веб-приложение",
            description: "Интерактивное веб-приложение с богатым функционалом",
            fullDescription: "Полнофункциональное веб-приложение, созданное на современном стеке технологий. Включает систему авторизации, админ-панель, интеграцию с базой данных и адаптивный дизайн. Приложение оптимизировано для высокой производительности и SEO.",
            images: [
                "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1555421689-3f034debb7a6?w=800&h=500&fit=crop"
            ],
            technologies: [
                { name: "Node.js", icon: "🟢" },
                { name: "React", icon: "⚛️" },
                { name: "MongoDB", icon: "🍃" },
                { name: "Express", icon: "🚀" }
            ],
            category: "Веб-разработка",
            date: "2024",
            link: "https://shikoshiflow.github.io/Exteria-Trade-2.0/",
            status: "active"
        },
        {
            title: "3D визуализация",
            description: "Создание трёхмерных моделей и визуализаций",
            fullDescription: "Проект по созданию фотореалистичных 3D визуализаций и моделей. Включает архитектурную визуализацию, предметное моделирование, создание анимаций и работу с материалами. Использование передовых техник рендеринга.",
            images: [
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1616587226157-48e49175ee20?w=800&h=500&fit=crop"
            ],
            technologies: [
                { name: "Blender", icon: "🌀" },
                { name: "Cycles", icon: "☀️" },
                { name: "Substance", icon: "🎭" },
                { name: "After Effects", icon: "✨" }
            ],
            category: "3D & Визуализация",
            date: "2024",
            link: "#",
            status: "coming-soon"
        }
    ];

    const project = projects[projectIndex];
    if (!project) return;

    const modal = document.createElement('div');
    modal.className = 'project-modal';
    
    const statusConfig = getStatusConfig(project.status || 'active');
    const statusText = `${statusConfig.icon} ${statusConfig.name}`;

    const thumbnailsHTML = project.images.map((img, i) => `
        <img src="${img.replace('w=800&h=500', 'w=200&h=150')}" 
             alt="Превью ${i + 1}" 
             class="thumbnail ${i === 0 ? 'active' : ''}" 
             onclick="changeGalleryImage('${img}', this)"
             loading="lazy">
    `).join('');

    const technologiesHTML = project.technologies.map(tech => `
        <div class="tech-item">
            <div class="tech-icon">${tech.icon}</div>
            <span class="tech-name">${tech.name}</span>
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeProjectModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeProjectModal()">×</button>
            
            <div class="modal-header">
                <div class="project-status">
                    <div class="status-dot"></div>
                    <span>${project.category}</span>
                </div>
                <h2 class="modal-title">${project.title}</h2>
                <span class="modal-date">${project.date}</span>
            </div>

            <div class="modal-body">
                <div class="modal-gallery">
                    <div class="gallery-main">
                        <img src="${project.images[0]}" alt="${project.title}" id="main-gallery-image" loading="lazy">
                    </div>
                    <div class="gallery-thumbnails">
                        ${thumbnailsHTML}
                    </div>
                </div>

                <div class="modal-info">
                    <div class="info-section modal-description">
                        <h3>Описание проекта</h3>
                        <p>${project.fullDescription}</p>
                    </div>

                    <div class="info-section modal-tech">
                        <h3>Технологии</h3>
                        <div class="tech-grid">
                            ${technologiesHTML}
                        </div>
                    </div>

                    <div class="modal-actions">
                        ${project.link && project.link !== '#' && project.status === 'active' ? 
                            `<a href="${project.link}" target="_blank" class="btn btn-primary">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15,3 21,3 21,9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                </svg>
                                Открыть проект
                            </a>` : 
                            `<button class="btn btn-primary" disabled style="opacity: 0.6; cursor: not-allowed;">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M8 12h8"/>
                                    <path d="M12 8v8"/>
                                </svg>
                                ${statusText}
                            </button>`
                        }
                        <button class="btn btn-secondary" onclick="closeProjectModal()">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    addModalStyles();
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

function addModalStyles() {
    if (!document.getElementById('enhanced-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'enhanced-modal-styles';
        styles.textContent = `
            .project-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: modalFadeIn 0.3s ease-out;
            }

            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }

            .modal-content {
                position: relative;
                background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
                border-radius: 28px;
                max-width: 800px;
                width: 95%;
                overflow: hidden;
                box-shadow: 
                    0 40px 80px rgba(0, 0, 0, 0.8),
                    0 0 0 1px rgba(255, 255, 255, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    0 0 50px rgba(121, 40, 202, 0.3);
                backdrop-filter: blur(30px);
                -webkit-backdrop-filter: blur(30px);
                animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                color: white;
                border: 1px solid rgba(121, 40, 202, 0.3);
            }

            .modal-close {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 40px;
                height: 40px;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: white;
                z-index: 10;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.1);
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }

            .modal-close:hover {
                background: rgba(121, 40, 202, 0.8);
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(121, 40, 202, 0.4);
            }

            .modal-body {
                display: flex;
                flex-direction: column;
                min-height: 500px;
            }
            .modal-image {
                width: 100%;
                height: 320px;
                background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
                overflow: hidden;
                border-radius: 24px 24px 0 0;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            .modal-image::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.2) 100%);
                z-index: 1;
            }

            .modal-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                position: relative;
                z-index: 2;
                transition: transform 0.3s ease;
            }
            .modal-image:hover img {
                transform: scale(1.05);
            }

            .modal-info-content {
                padding: 50px 40px;
                background: linear-gradient(145deg, #1e1e1e 0%, #252525 50%, #1a1a1a 100%);
                border-radius: 0 0 24px 24px;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                position: relative;
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
            }
            .modal-info-content::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(121, 40, 202, 0.5), transparent);
            }

            .modal-title {
                font-size: 2.2rem;
                font-weight: 700;
                margin-bottom: 20px;
                color: white;
                text-align: center;
                background: linear-gradient(135deg, #fff 0%, #e0e0e0 50%, #fff 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
                filter: drop-shadow(0 2px 4px rgba(121, 40, 202, 0.2));
                position: relative;
                line-height: 1.2;
            }

            .modal-price {
                font-size: 1.2rem;
                color: rgba(121, 40, 202, 0.9);
                text-align: center;
                margin-bottom: 20px;
                font-weight: 600;
                background: rgba(121, 40, 202, 0.1);
                padding: 10px 20px;
                border-radius: 25px;
                border: 1px solid rgba(121, 40, 202, 0.3);
                display: inline-block;
                align-self: center;
            }

            .modal-description {
                font-size: 1rem;
                color: #e0e0e0;
                line-height: 1.7;
                margin-bottom: 25px;
                text-align: center;
                background: linear-gradient(135deg, #e0e0e0, #b0b0b0);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                padding: 0 10px;
                font-weight: 400;
            }

            .modal-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                justify-content: center;
                margin-bottom: 25px;
            }

            .modal-tag {
                background: linear-gradient(135deg, rgba(121, 40, 202, 0.3), rgba(255, 0, 128, 0.2));
                color: #E1BEE7;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 600;
                border: 1px solid rgba(121, 40, 202, 0.4);
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                box-shadow: 0 2px 10px rgba(121, 40, 202, 0.2);
            }

            .modal-tag:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(121, 40, 202, 0.4);
                background: linear-gradient(135deg, rgba(121, 40, 202, 0.4), rgba(255, 0, 128, 0.3));
            }

            .modal-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
                padding: 0 20px;
            }

            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 16px 32px;
                border-radius: 50px;
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: none;
                cursor: pointer;
                min-width: 140px;
                position: relative;
                overflow: hidden;
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }

            .btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                transition: left 0.5s ease;
            }

            .btn:hover::before {
                left: 100%;
            }

            .btn-primary {
                background: linear-gradient(135deg, #7928CA, #FF0080, #7928CA);
                background-size: 200% 200%;
                color: white;
                box-shadow: 0 8px 25px rgba(121, 40, 202, 0.4);
                animation: gradientShift 3s ease-in-out infinite;
            }

            .btn-primary:hover:not(:disabled) {
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 15px 35px rgba(121, 40, 202, 0.6);
                animation-duration: 1s;
            }

            @keyframes gradientShift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }

            .btn-secondary {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            }

            .btn-secondary:hover {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
                border-color: rgba(255, 255, 255, 0.4);
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            }

            .btn-icon {
                width: 18px;
                height: 18px;
            }

            @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes modalSlideIn {
                from { 
                    opacity: 0;
                    transform: translateY(-30px) scale(0.95);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            @media (max-width: 768px) {
                .modal-content {
                    max-width: 450px !important;
                }
                .modal-image {
                    height: 250px !important;
                }
                .modal-info-content {
                    padding: 20px !important;
                }
                .modal-title {
                    font-size: 1.3rem !important;
                }
                .modal-description {
                    font-size: 0.9rem !important;
                }
            }

            @media (max-width: 768px) {
                .modal-content {
                    width: 95%;
                    max-width: 350px;
                    border-radius: 12px;
                }

                .modal-info-content {
                    padding: 15px;
                }

                .modal-title {
                    font-size: 1.2rem;
                }

                .modal-price {
                    font-size: 1rem;
                }

                .modal-description {
                    font-size: 0.85rem;
                }

                .modal-actions {
                    flex-direction: column;
                    gap: 8px;
                }

                .btn {
                    min-width: 80px;
                    padding: 10px 16px;
                    font-size: 12px;
                }

                .modal-tag {
                    font-size: 0.75rem;
                    padding: 3px 6px;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

function changeGalleryImage(imageSrc, thumbnail) {
    const mainImage = document.getElementById('main-gallery-image');
    if (mainImage) {
        mainImage.style.opacity = '0.7';
        mainImage.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            mainImage.src = imageSrc;
            mainImage.style.opacity = '1';
            mainImage.style.transform = 'scale(1)';
        }, 150);
    }

    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
        thumb.style.transform = 'scale(1)';
    });
    
    thumbnail.classList.add('active');
    thumbnail.style.transform = 'scale(1.1)';
}

function closeProjectModal() {
    const modal = document.querySelector('.project-modal');
    if (modal) {
        // Удаляем обработчик ESC
        if (modal.escHandler) {
            document.removeEventListener('keydown', modal.escHandler);
        }
        
        modal.style.animation = 'modalFadeIn 0.3s ease reverse';
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.animation = 'modalSlideIn 0.3s ease reverse';
        }
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
            document.body.style.overflow = '';
        }, 300);
    }
}

// --- ПРЕЛОАДЕР ---
function initializePreloader() {
    const preloader = document.querySelector('.preloader');
    if (!preloader) return;
    
    // Скрываем прелоадер сразу после инициализации DOM
    setTimeout(() => {
        preloader.classList.add('hidden');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }, 500);
}

// --- ЭФФЕКТЫ ПРОКРУТКИ ---
function initializeScrollEffects() {
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    function updateScrollEffects() {
        const scrollY = window.scrollY;
        const header = document.querySelector('.header');
        
        if (header) {
            if (scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        // Параллакс эффекты
        updateParallaxEffects(scrollY);
        updateActiveNavOnScroll();
        
        lastScrollY = scrollY;
        ticking = false;
    }
    
    // Добавляем throttling для лучшей производительности
    function throttledScroll() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
}

// --- ПАРАЛЛАКС ЭФФЕКТЫ ---
function updateParallaxEffects(scrollY) {
    // Параллакс для floating элементов
    const floatingElements = document.querySelectorAll('.floating-element');
    floatingElements.forEach((el, index) => {
        const speed = 0.1 + (index * 0.05); // Разная скорость для каждого элемента
        const yPos = scrollY * speed;
        const rotation = scrollY * (0.1 + index * 0.05);
        
        el.style.transform = `translateY(${yPos}px) rotateZ(${rotation}deg)`;
    });
    
    // Параллакс для hero иллюстрации
    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        const yPos = scrollY * 0.15;
        const scale = 1 + (scrollY * 0.0001);
        heroImage.style.transform = `translate(-50%, -50%) translateY(${yPos}px) scale(${scale})`;
    }
    
    // Параллакс для фоновых градиентов
    const backgroundElements = document.querySelectorAll('.hero-gradient, .about-gradient, .portfolio-gradient');
    backgroundElements.forEach((el, index) => {
        const speed = 0.05 + (index * 0.02);
        const yPos = scrollY * speed;
        el.style.transform = `translateY(${yPos}px)`;
    });
}

// --- ИНИЦИАЛИЗАЦИЯ SCROLL ЭФФЕКТОВ ---
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.portfolio-item, .timeline-item, .skill-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

function updateActiveNavOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    const scrollPosition = window.scrollY;
    const headerHeight = 80;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollPosition + windowHeight >= documentHeight - 100) {
        currentSection = 'contact';
    } else {
        const sectionsArray = Array.from(sections).reverse();
        
        for (const section of sectionsArray) {
            const sectionTop = section.offsetTop - headerHeight - 50;
            
            if (scrollPosition >= sectionTop) {
                currentSection = section.getAttribute('id');
                break;
            }
        }
    }
    
    if (!currentSection && sections.length > 0) {
        currentSection = sections[0].getAttribute('id');
    }
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// --- КОНТАКТНАЯ ФОРМА ---
function initializeContactForm() {
    if (featuresConfig.form === false) {
        return;
    }

    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };
            
            showNotification('Сообщение отправлено! Спасибо за обращение.', 'success');
            
            this.reset();
        });
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}


// Добавляем стили для анимации уведомлений
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// Глобальные функции для onclick
window.closeProjectModal = closeProjectModal;
window.changeGalleryImage = changeGalleryImage;
window.showProjectModal = showProjectModal;

console.log('=== Main.js с улучшенными модальными окнами загружен успешно ===');

// Глобальная функция для тестирования портфолио
window.testPortfolio = function() {
    console.log('Тестирование портфолио...');
    attachPortfolioEventHandlers();
};