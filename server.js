const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const compression = require('compression');

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(compression()); // Включаем сжатие
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// --- ИСПРАВЛЕНИЕ: Правильная настройка MIME-типов ---
express.static.mime.define({
    'text/css': ['css'],
    'application/javascript': ['js'],
    'text/html': ['html'],
    'image/svg+xml': ['svg']
});

// --- Раздача статических файлов с правильными MIME-типами ---
app.use(express.static(__dirname, {
    maxAge: '1d', // Кэширование на 1 день
    etag: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        } else if (path.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
        }
    }
}));

// --- Routes ---
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Явно указываем пути к CSS и JS файлам
app.get('/style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/main.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'main.js'));
});

app.get('/admin.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'admin.js'));
});

// --- API для данных ---
app.get('/api/:section', (req, res) => {
    const filePath = path.join(__dirname, 'data', `${req.params.section}.json`);
    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) {
            console.error('Ошибка чтения файла:', error);
            res.status(500).json({ error: 'Ошибка чтения файла' });
        }
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

app.post('/api/:section', (req, res) => {
    const filePath = path.join(__dirname, 'data', `${req.params.section}.json`);
    try {
        // Создаем директорию data если её нет
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
        
        // Если обновляем features, не нужно обновлять HTML
        if (req.params.section !== 'features') {
            const result = updateHtml();
            if (result.success) {
                res.json({ success: true });
            } else {
                res.status(500).json({ error: result.error });
            }
        } else {
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Ошибка при сохранении:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- СИСТЕМА ОБНОВЛЕНИЯ HTML ---
function updateHtml() {
    try {
        const htmlPath = path.join(__dirname, 'index.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // --- Обновление General ---
        try {
            const generalData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/general.json'), 'utf8'));
            htmlContent = htmlContent.replace(/<html lang=".*?"/, `<html lang="${generalData.lang}"`);
            htmlContent = htmlContent.replace(/<title>.*?<\/title>/, `<title>${generalData.title}</title>`);
        } catch (e) {
            console.log('Файл general.json не найден, пропускаем');
        }
        
        // --- Обновление Header ---
        try {
            const headerData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/header.json'), 'utf8'));
            htmlContent = htmlContent.replace(/(<span class="logo-text">)[\s\S]*?(<\/span>)/, `$1${headerData.logoText}$2`);
            let menuHtml = '';
            if (headerData.menuItems) {
                headerData.menuItems.forEach((item, i) => {
                    menuHtml += `\n                        <li><a href="${item.link}" class="nav-link${i === 0 ? ' active' : ''}">${item.text}</a></li>`;
                });
            }
            htmlContent = htmlContent.replace(/(<ul class="nav-menu">)[\s\S]*?(<\/ul>)/, `$1${menuHtml}\n                    </ul>`);
        } catch (e) {
            console.log('Файл header.json не найден, пропускаем');
        }

        // --- Обновление Hero ---
        try {
            const heroData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/hero.json'), 'utf8'));
            htmlContent = htmlContent.replace(/(<h1 class="hero-title">)[\s\S]*?(<\/h1>)/, `$1${heroData.title}$2`);
            htmlContent = htmlContent.replace(/(<p class="hero-description">)[\s\S]*?(<\/p>)/, `$1${heroData.description}$2`);
            const buttonsHtml = `\n                     <a href="${heroData.button1_link}" class="btn btn-primary">${heroData.button1_text}</a>\n                     <a href="${heroData.button2_link}" class="btn btn-secondary">${heroData.button2_text}</a>\n                   `;
            htmlContent = htmlContent.replace(/(<div class="hero-buttons">)[\s\S]*?(<\/div>)/, `$1${buttonsHtml}</div>`);
        } catch (e) {
            console.log('Файл hero.json не найден, пропускаем');
        }

        // --- Обновление About ---
        try {
            const aboutData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/about.json'), 'utf8'));
            const aboutHtml = `<p>${aboutData.text1}</p>\n                    <p>${aboutData.text2}</p>`;
            htmlContent = htmlContent.replace(/(<div class="about-text">)[\s\S]*?(<\/div>)/, `$1\n                    ${aboutHtml}\n                </div>`);
        } catch (e) {
            console.log('Файл about.json не найден, пропускаем');
        }
        
        // --- Обновление Portfolio ---
        try {
            const portfolioData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/portfolio.json'), 'utf8'));
            let portfolioHtml = '';
            if (portfolioData.items && portfolioData.items.length > 0) {
                portfolioData.items.forEach(item => {
                    const tagsHtml = (item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('\n                                ');
                    portfolioHtml += `
                <div class="portfolio-item" data-category="${item.category || ''}">
                    <div class="portfolio-card">
                        <div class="portfolio-image">
                            <img src="${item.image || ''}" alt="${item.title || ''}">
                        </div>
                        <div class="portfolio-info">
                            <h3 class="portfolio-title">${item.title || ''}</h3>
                            <p class="portfolio-description">${item.description || ''}</p>
                            <div class="portfolio-tags">
                                ${tagsHtml}
                            </div>
                        </div>
                        <div class="portfolio-hover">
                            <div class="portfolio-hover-content">
                                <h3>${item.title || ''}</h3>
                                <p>${item.longDescription || item.description || ''}</p>
                                <a href="${item.link || '#'}" class="btn btn-small">Подробнее</a>
                            </div>
                        </div>
                    </div>
                </div>`;
                });
            } else {
                portfolioHtml = '\n                <!-- Проекты пока не добавлены -->\n            ';
            }
            htmlContent = htmlContent.replace(/(<div class="portfolio-grid">)[\s\S]*?(<\/div>\s*<\/div>\s*<div class="portfolio-bg">)/, `$1${portfolioHtml}\n            </div>\n        </div>\n        <div class="portfolio-bg">`);
        } catch (e) {
            console.log('Файл portfolio.json не найден, пропускаем');
        }

        // --- Обновление Future ---
        try {
            const futureData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/future.json'), 'utf8'));
            let timelineHtml = '';
            if (futureData.items && futureData.items.length > 0) {
                futureData.items.forEach(item => {
                    timelineHtml += `\n                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <div class="timeline-date">${item.date || ''}</div>
                        <h3 class="timeline-title">${item.title || ''}</h3>
                        <p class="timeline-description">${item.description || ''}</p>
                    </div>
                </div>`;
                });
            } else {
                timelineHtml = '\n                <!-- Планы пока не добавлены -->\n            ';
            }
            htmlContent = htmlContent.replace(/(<div class="timeline">)[\s\S]*?(<\/div>\s*<\/div>\s*<div class="future-bg">)/, `$1${timelineHtml}\n            </div>\n        </div>\n        <div class="future-bg">`);
        } catch (e) {
            console.log('Файл future.json не найден, пропускаем');
        }

        // --- Обновление Contact ---
        try {
            const contactData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/contact.json'), 'utf8'));
            htmlContent = htmlContent.replace(/(<h3>Email<\/h3>\s*<p>)[\s\S]*?(<\/p>)/, `$1${contactData.email}$2`);
            htmlContent = htmlContent.replace(/(<h3>Телефон<\/h3>\s*<p>)[\s\S]*?(<\/p>)/, `$1${contactData.phone}$2`);
            htmlContent = htmlContent.replace(/(<h3>Адрес<\/h3>\s*<p>)[\s\S]*?(<\/p>)/, `$1${contactData.address}$2`);
        } catch (e) {
            console.log('Файл contact.json не найден, пропускаем');
        }

        // --- Обновление Footer ---
        try {
            const footerData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/footer.json'), 'utf8'));
            htmlContent = htmlContent.replace(/(<div class="footer-copyright">\s*<p>)[\s\S]*?(<\/p>\s*<\/div>)/, `$1${footerData.copyright}$2`);
        } catch (e) {
            console.log('Файл footer.json не найден, пропускаем');
        }

        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        console.log('HTML успешно обновлен');
        return { success: true };
    } catch (error) {
        console.error('Ошибка при обновлении HTML:', error);
        return { success: false, error: error.message };
    }
}

// --- БЛОК ИНИЦИАЛИЗАЦИИ ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
    console.log('Создана папка data');
}

const requiredDataFiles = {
    'general.json': { "title": "Мой сайт-Портфолио", "lang": "ru" },
    'header.json': { 
        "logoText": "Shiko studio", 
        "logoImage": "assets/img/logo.svg", 
        "menuItems": [
            { "text": "Главная", "link": "#home" },
            { "text": "Обо мне", "link": "#about" },
            { "text": "Портфолио", "link": "#portfolio" },
            { "text": "Будущие проекты", "link": "#future" },
            { "text": "Контакты", "link": "#contact" }
        ]
    },
    'hero.json': { 
        "title": "Цифровое <span class=\"accent\">творчество</span> & <span class=\"accent\">инновации</span>", 
        "description": "Я создаю уникальные проекты на стыке искусства и технологий. Генерация изображений, видео, разработка сайтов и приложений — всё это мои инструменты для воплощения креативных идей.", 
        "button1_text": "Мои работы", 
        "button1_link": "#portfolio", 
        "button2_text": "Связаться", 
        "button2_link": "#contact" 
    },
    'about.json': { 
        "text1": "Я специалист в области цифрового творчества и технологий. Моя страсть — создавать уникальные проекты, объединяющие искусство и инновации.", 
        "text2": "Работая с различными инструментами и технологиями, я стремлюсь воплощать креативные идеи и решать нестандартные задачи." 
    },
    'portfolio.json': { 
        "items": [
            {
                "title": "AI-генерация изображений",
                "category": "image",
                "description": "Серия уникальных изображений, созданных с помощью нейросетей",
                "longDescription": "Проект по созданию уникального визуального контента с помощью нейросетей.",
                "image": "assets/img/icons/placeholder-image.svg",
                "link": "#",
                "tags": ["AI", "Искусство", "Дизайн"]
            },
            {
                "title": "Мобильное приложение",
                "category": "app",
                "description": "Разработка функционального приложения для iOS и Android",
                "longDescription": "Проект по созданию кроссплатформенного мобильного приложения.",
                "image": "assets/img/icons/placeholder-app.svg",
                "link": "#",
                "tags": ["React Native", "UI/UX", "Mobile"]
            },
            {
                "title": "Веб-приложение",
                "category": "web",
                "description": "Интерактивное веб-приложение с богатым функционалом",
                "longDescription": "Проект по созданию полнофункционального веб-приложения на современном стеке технологий.",
                "image": "assets/img/icons/placeholder-web.svg",
                "link": "#",
                "tags": ["Node.js", "CSS", "JavaScript", "HTML"]
            },
            {
                "title": "3D визуализация",
                "category": "image",
                "description": "Создание трёхмерных моделей и визуализаций",
                "longDescription": "Проект по созданию фотореалистичных 3D визуализаций и моделей.",
                "image": "assets/img/icons/placeholder-image.svg",
                "link": "#",
                "tags": ["3D", "Blender", "Рендеринг"]
            }
        ]
    },
    'future.json': { 
        "items": [
            {
                "date": "Q2 2025",
                "title": "Исследование генеративного искусства",
                "description": "Создание серии художественных работ на основе алгоритмических процессов и машинного обучения."
            },
            {
                "date": "Q3 2025",
                "title": "Интерактивная платформа для визуализации данных",
                "description": "Разработка веб-платформы для создания красивых и информативных визуализаций на основе пользовательских данных."
            },
            {
                "date": "Q4 2025",
                "title": "AI-ассистент для творческих профессий",
                "description": "Создание приложения, использующего искусственный интеллект для помощи дизайнерам, художникам и креативщикам."
            },
            {
                "date": "Q1 2026",
                "title": "Иммерсивная VR-галерея",
                "description": "Создание виртуального пространства для демонстрации цифрового искусства в формате виртуальной реальности."
            },
            {
                "date": "Q1 2028",
                "title": "Платформа онлайн игр",
                "description": "Создание виртуального пространства для цифрового искусства в формате виртуальных игр"
            }
        ]
    },
    'contact.json': { 
        "email": "hello@example.com", 
        "phone": "+7 (999) 123-45-67", 
        "address": "Турция, Стамбул" 
    },
    'footer.json': { 
        "copyright": "© 2025 My Portfolio. Все права защищены." 
    },
    'features.json': { 
        "portfolio": true,
        "about": true,
        "future": true,
        "contact": true,
        "filter": true,
        "form": true
    }
};

Object.keys(requiredDataFiles).forEach(fileName => {
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(requiredDataFiles[fileName], null, 2), 'utf8');
        console.log(`Создан файл ${fileName}`);
    }
});

// Обновляем HTML при запуске
updateHtml();

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Что-то пошло не так!');
});

app.listen(PORT, () => {
    console.log(`\n=================================`);
    console.log(`Сервер запущен!`);
    console.log(`Сайт: http://localhost:${PORT}`);
    console.log(`Админ-панель: http://localhost:${PORT}/admin`);
    console.log(`=================================\n`);
});