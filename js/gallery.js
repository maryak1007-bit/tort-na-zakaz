// Страница галереи категории: загружает все фото из папки категории
(function () {
    'use strict';

    // Расширения изображений, которые ищем в папке
    var IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp'];

    var PHOTO_MAP = {
  'bento': ["images/bento/1.jpg"],
  'detskie': ["images/detskie/1.jpg", "images/detskie/2.jpg"],
  'dlya-devochek': ["images/dlya-devochek/1.jpg", "images/dlya-devochek/2.jpg"],
  'dlya-malchikov': ["images/dlya-malchikov/1.jpg"],
  'domashnie': ["images/domashnie/1.jpg", "images/domashnie/2.jpg", "images/domashnie/3.jpg"],
  'foto-konditera': ["images/foto-konditera/1.jpg"],
  'kapkeyki': ["images/kapkeyki/1.jpg"],
  'mussovye': ["images/mussovye/1.jpg", "images/mussovye/2.jpg"],
  'muzhskie': ["images/muzhskie/1.jpg", "images/muzhskie/2.jpg"],
  'sertifikaty': ["images/sertifikaty/1.jpg"],
  'svadebnye': ["images/svadebnye/1.jpg", "images/svadebnye/2.jpg"],
  'yagodnye': ["images/yagodnye/1.jpg", "images/yagodnye/2.jpg"],
};

    // Известные категории (для заголовков и оформления)
    var CATEGORIES = {
        'domashnie':      { title: 'Торты домашние',                 emoji: '🏠', colors: ['#ff9a8b', '#ff6a88'] },
        'mussovye':       { title: 'Торты муссовые с ореховой начинкой', emoji: '🌰', colors: ['#c79081', '#dfa596'] },
        'yagodnye':       { title: 'Торты с ягодной начинкой',       emoji: '🍓', colors: ['#e91e63', '#ff5f9e'] },
        'bento':          { title: 'Торты Бенто',                    emoji: '🍱', colors: ['#f7b733', '#fc4a1a'] },
        'detskie':        { title: 'Детские торты',                  emoji: '🎈', colors: ['#ff8fb1', '#ffc2d1'] },
        'dlya-devochek':  { title: 'Торты для девочек',              emoji: '👑', colors: ['#f78ca0', '#f9748f'] },
        'dlya-malchikov': { title: 'Торты для мальчиков',            emoji: '🚗', colors: ['#4facfe', '#00f2fe'] },
        'muzhskie':       { title: 'Мужские торты',                  emoji: '🥃', colors: ['#4b6cb7', '#182848'] },
        'svadebnye':      { title: 'Свадебные торты',                emoji: '💍', colors: ['#a18cd1', '#c9a7eb'] },
        'kapkeyki':       { title: 'Капкейки и Трайфлы',             emoji: '🧁', colors: ['#ffacc7', '#ff8fab'] },
        'sertifikaty':    { title: 'Сертификаты',                    emoji: '📜', colors: ['#d4a373', '#e9c46a'] },
        'foto-konditera': { title: 'Фото Кондитера',                 emoji: '👩‍🍳', colors: ['#f6a5c0', '#f7c5cc'] }
    };

    function getSlug() {
        var params = new URLSearchParams(window.location.search);
        return (params.get('category') || '').toLowerCase().replace(/[^a-z0-9\-]/g, '');
    }

    // Пытаемся получить список файлов из папки через list.json
    // (положите в папку категории файл list.json со списком имён файлов,
    //  либо скрипт попробует собрать фото автоматически по распространённым именам)
    function fetchFileList(slug) {
        // Сначала берём файлы из карты PHOTO_MAP (файлы уже скопированы в папки images/)
        if (PHOTO_MAP[slug] && PHOTO_MAP[slug].length) {
            return Promise.all(PHOTO_MAP[slug].map(checkImage)).then(function (r) {
                return r.filter(Boolean);
            });
        }
        return fetch('images/' + slug + '/list.json')
            .then(function (res) {
                if (!res.ok) throw new Error('no list');
                return res.json();
            })
            .then(function (names) {
                return names.map(function (n) {
                    return n.indexOf('images/') === 0 ? n : 'images/' + slug + '/' + n;
                });
            })
            .catch(function () {
                // Если list.json недоступен (например, без сервера), берём карту PHOTO_MAP
                if (PHOTO_MAP[slug]) {
                    return Promise.all(PHOTO_MAP[slug].map(checkImage)).then(function (r) {
                        return r.filter(Boolean);
                    });
                }
                throw new Error('no source');
            });
    }

    // Проверка доступности отдельного файла
    function checkImage(url) {
        return new Promise(function (resolve) {
            var img = new Image();
            img.onload = function () { resolve(url); };
            img.onerror = function () { resolve(null); };
            img.src = url;
        });
    }

    // Автопоиск: пробуем типичные имена файлов в папке
    function autoDiscover(slug) {
        var candidates = [];
        var names = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
        names.forEach(function (n) {
            IMAGE_EXT.forEach(function (ext) {
                candidates.push('images/' + slug + '/' + n + '.' + ext);
            });
        });
        return Promise.all(candidates.map(checkImage)).then(function (results) {
            return results.filter(Boolean);
        });
    }

    function renderGallery(slug, files, info) {
        var grid = document.getElementById('photoGrid');
        var empty = document.getElementById('emptyMessage');
        var title = document.getElementById('galleryTitle');
        var subtitle = document.getElementById('gallerySubtitle');
        var hero = document.getElementById('galleryHero');

        document.title = info.title + ' - Торт на заказ';
        title.textContent = info.emoji + ' ' + info.title;
        subtitle.textContent = files.length > 0
            ? 'Все фотографии категории (' + files.length + ')'
            : 'Фотографии этой категории';

        if (hero && info.colors) {
            hero.style.background = 'linear-gradient(135deg, ' + info.colors[0] + ', ' + info.colors[1] + ')';
        }

        if (files.length === 0) {
            grid.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        files.forEach(function (src, i) {
            var item = document.createElement('div');
            item.className = 'photo-grid-item';
            item.style.animationDelay = (i * 0.06) + 's';
            var img = document.createElement('img');
            img.src = src;
            img.alt = info.title + ' — фото ' + (i + 1);
            img.loading = 'lazy';
            item.appendChild(img);
            item.addEventListener('click', function () {
                openLightbox(src);
            });
            grid.appendChild(item);
        });
    }

    // Лайтбокс
    function openLightbox(src) {
        var lb = document.getElementById('lightbox');
        var lbImg = document.getElementById('lightboxImg');
        if (!lb || !lbImg) return;
        lbImg.src = src;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        var lb = document.getElementById('lightbox');
        if (!lb) return;
        lb.classList.remove('active');
        document.body.style.overflow = '';
    }

    document.addEventListener('DOMContentLoaded', function () {
        var lbClose = document.getElementById('lightboxClose');
        var lb = document.getElementById('lightbox');
        if (lbClose) lbClose.addEventListener('click', closeLightbox);
        if (lb) lb.addEventListener('click', function (e) {
            if (e.target === lb) closeLightbox();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeLightbox();
        });

        var slug = getSlug();
        var info = CATEGORIES[slug];

        if (!slug || !info) {
            // Неизвестная категория — редирект в каталог
            window.location.href = 'catalog.html';
            return;
        }

        fetchFileList(slug)
            .catch(function () { return autoDiscover(slug); })
            .then(function (files) {
                renderGallery(slug, files, info);
            });
    });
})();
