// Noris TV crystal Nexora - VIDAA App Engine
let cableData = { cine: [], sports: [], kids: [], doc: [] };
let hdLibrary = { movies: [] };
let lacartoons = { items: [] };

let currentSection = 'live';
let currentFocusGroup = 'sidebar'; // 'sidebar' or 'grid'
let sidebarIndex = 0;
let gridIndex = 0;
let itemsList = [];
let isPlaying = false;

document.addEventListener('DOMContentLoaded', async () => {
    updateClock();
    setInterval(updateClock, 1000);

    await loadData();
    renderSection('live');
    setupRemoteControl();
});

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('clock').innerText = `${hours}:${mins}`;
}

async function loadData() {
    try {
        const cableRes = await fetch('data/cable_premium.json');
        cableData = await cableRes.json();

        const hdRes = await fetch('data/hd-library.json');
        hdLibrary = await hdRes.json();

        const cartoonRes = await fetch('data/lacartoons_catalog.json');
        lacartoons = await cartoonRes.json();
    } catch (e) {
        console.error('Error loading data catalogs:', e);
    }
}

function renderSection(section) {
    currentSection = section;
    const grid = document.getElementById('catalog-grid');
    const titleEl = document.getElementById('section-title');
    grid.innerHTML = '';
    itemsList = [];

    if (section === 'live') {
        titleEl.innerText = 'Televisión en Vivo y Cable Premium (Cine)';
        itemsList = cableData.cine || [];
    } else if (section === 'movies') {
        titleEl.innerText = 'Cine HD (Librería de Películas)';
        itemsList = hdLibrary.movies || [];
    } else if (section === 'sports') {
        titleEl.innerText = 'Deportes en Vivo HD';
        itemsList = cableData.sports || [];
    } else if (section === 'kids') {
        titleEl.innerText = 'Canales Infantiles';
        itemsList = cableData.kids || [];
    } else if (section === 'doc') {
        titleEl.innerText = 'Documentales y Cultura';
        itemsList = cableData.doc || [];
    } else if (section === 'lacartoons') {
        titleEl.innerText = 'La Cartoons (Catálogo Animado)';
        itemsList = lacartoons.items || [];
    }

    itemsList.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('data-index', index);

        const posterUrl = item.poster || item.showIconUrl || item.posterUrl || 'images/cats/cat_movies.png';
        const title = item.name || item.title || 'Canal / Película';

        card.innerHTML = `
            <img class="card-poster" src="${posterUrl}" alt="${title}" onerror="this.src='images/cats/cat_movies.png'">
            <div class="card-title">${title}</div>
        `;

        card.addEventListener('click', () => playItem(item));
        grid.appendChild(card);
    });

    gridIndex = 0;
    highlightFocus();
}

function setupRemoteControl() {
    document.addEventListener('keydown', (e) => {
        if (isPlaying) {
            if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 10009) {
                stopPlayback();
                e.preventDefault();
            }
            return;
        }

        const navItems = document.querySelectorAll('.sidebar .nav-item');
        const gridCards = document.querySelectorAll('.catalog-grid .card');

        switch (e.key) {
            case 'ArrowUp':
                if (currentFocusGroup === 'sidebar') {
                    sidebarIndex = Math.max(0, sidebarIndex - 1);
                } else {
                    gridIndex = Math.max(0, gridIndex - 4);
                }
                break;
            case 'ArrowDown':
                if (currentFocusGroup === 'sidebar') {
                    sidebarIndex = Math.min(navItems.length - 1, sidebarIndex + 1);
                } else {
                    gridIndex = Math.min(gridCards.length - 1, gridIndex + 4);
                }
                break;
            case 'ArrowLeft':
                if (currentFocusGroup === 'grid' && gridIndex % 4 === 0) {
                    currentFocusGroup = 'sidebar';
                } else if (currentFocusGroup === 'grid') {
                    gridIndex = Math.max(0, gridIndex - 1);
                }
                break;
            case 'ArrowRight':
                if (currentFocusGroup === 'sidebar') {
                    currentFocusGroup = 'grid';
                    gridIndex = 0;
                } else if (currentFocusGroup === 'grid') {
                    gridIndex = Math.min(gridCards.length - 1, gridIndex + 1);
                }
                break;
            case 'Enter':
            case 'Select':
                if (currentFocusGroup === 'sidebar') {
                    const selectedNav = navItems[sidebarIndex];
                    const section = selectedNav.getAttribute('data-section');
                    navItems.forEach(el => el.classList.remove('focus'));
                    selectedNav.classList.add('focus');
                    renderSection(section);
                } else {
                    const selectedCard = gridCards[gridIndex];
                    if (selectedCard) {
                        selectedCard.click();
                    }
                }
                break;
        }

        highlightFocus();
        e.preventDefault();
    });
}

function highlightFocus() {
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    const gridCards = document.querySelectorAll('.catalog-grid .card');

    navItems.forEach((item, idx) => {
        if (currentFocusGroup === 'sidebar' && idx === sidebarIndex) {
            item.classList.add('focus');
        } else {
            item.classList.remove('focus');
        }
    });

    gridCards.forEach((card, idx) => {
        if (currentFocusGroup === 'grid' && idx === gridIndex) {
            card.classList.add('focus');
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            card.classList.remove('focus');
        }
    });
}

function playItem(item) {
    isPlaying = true;
    const overlay = document.getElementById('player-overlay');
    const video = document.getElementById('video-player');
    const titleEl = document.getElementById('player-title');
    const subEl = document.getElementById('player-sub');

    const title = item.name || item.title || 'Reproduciendo contenido';
    titleEl.innerText = title;
    subEl.innerText = item.description || 'Transmisión HD en vivo';

    overlay.classList.remove('hidden');

    let streamUrl = item.directUrl || '';
    if (!streamUrl && item.candidateUrls && item.candidateUrls.length > 0) {
        streamUrl = item.candidateUrls[0];
    }
    if (!streamUrl && item.channelCode) {
        // Parse candidate URL from channelCode
        const parts = item.channelCode.split('|');
        for (let p of parts) {
            if (p.startsWith('http://') || p.startsWith('https://')) {
                streamUrl = p;
                break;
            }
        }
    }

    if (!streamUrl) {
        streamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    }

    console.log('Playing stream URL:', streamUrl);

    if (streamUrl.includes('.m3u8')) {
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(err => console.log('Autoplay blocked:', err));
            });
            window.currentHls = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            video.play().catch(err => console.log('Autoplay blocked:', err));
        }
    } else {
        video.src = streamUrl;
        video.play().catch(err => console.log('Autoplay blocked:', err));
    }
}

function stopPlayback() {
    isPlaying = false;
    const overlay = document.getElementById('player-overlay');
    const video = document.getElementById('video-player');
    video.pause();
    video.src = '';
    if (window.currentHls) {
        window.currentHls.destroy();
        window.currentHls = null;
    }
    overlay.classList.add('hidden');
}
