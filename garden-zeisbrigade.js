/**
 * Natuurrijk Ankeveen - Biotoop Zeisbrigade
 * Hooiland sfeer: veel bloemen, vlinders, rustig zomers gevoel
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 1500,
            flowerInterval: 3000,
            butterflyFirst: 8000,
            butterflyInterval: 12000,
            ladybugFirst: 20000,
            ladybugInterval: 25000,
            biotoopReset: 480000
        }
    };

    let state = { flowers: [], activeAnimals: [] };
    let biotoopTimers = {};
    let gardenEl, groundEl, flyingEl;

    const FLOWERS = [
        { src: 'images/Klaproos.png', size: 'size-sm' },
        { src: 'images/Klaproos.png', size: 'size-md' },
        { src: 'images/Klaprozen2.png', size: 'size-sm' },
        { src: 'images/Klaprozen2.png', size: 'size-md' },
        { src: 'images/Klaprozen.png', size: 'size-xs' },
        { src: 'images/Ridderspoor.png', size: 'size-md' },
        { src: 'images/Ridderspoor.png', size: 'size-lg' },
        { src: 'images/Ridderspoor2.png', size: 'size-sm' },
        { src: 'images/Ridderspoor2.png', size: 'size-md' },
        { src: 'images/Digitalis.png', size: 'size-md' },
        { src: 'images/Digitalis.png', size: 'size-lg' },
        { src: 'images/Veldoeket.png', size: 'size-md' },
        { src: 'images/Veldoeket.png', size: 'size-lg' },
    ];

    const FLOWER_POSITIONS = [5, 12, 20, 28, 38, 48, 58, 68, 78, 88, 94];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function addFlower() {
        if (!gardenEl || state.flowers.length >= 12) return;

        const usedPositions = state.flowers.map(f => f.pos);
        const free = FLOWER_POSITIONS.filter(p => !usedPositions.includes(p));
        if (free.length === 0) return;

        const pos = pick(free);
        const data = pick(FLOWERS);
        const mirrored = Math.random() > 0.5;

        const img = document.createElement('img');
        img.src = data.src;
        img.className = `garden-flower ${data.size}${mirrored ? ' mirrored' : ''}`;
        img.style.left = pos + '%';

        gardenEl.appendChild(img);
        requestAnimationFrame(() => img.classList.add('blooming'));

        state.flowers.push({ el: img, pos, data });
    }

    function spawnButterfly() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        img.src = Math.random() > 0.5 ? 'images/Vlinder.gif' : 'images/Vlinder2.gif';
        img.className = 'flying-butterfly ' + (Math.random() > 0.5 ? 'flight-path-1' : 'flight-path-2');

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 20000);
    }

    function spawnLadybug() {
        if (!groundEl) return;

        const img = document.createElement('img');
        img.src = 'images/Ladybug.gif';
        img.className = 'crawling-ladybug';

        groundEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 15000);
    }

    function startBiotoop() {
        // Bloemen opbouwen
        for (let i = 0; i < 6; i++) {
            setTimeout(addFlower, i * 800);
        }

        biotoopTimers.flowers = setInterval(() => {
            if (state.flowers.length < 12) addFlower();
        }, CONFIG.timing.flowerInterval);

        // Vlinders
        biotoopTimers.butterfly = setTimeout(() => {
            spawnButterfly();
            biotoopTimers.butterflyInterval = setInterval(() => {
                if (Math.random() > 0.3) spawnButterfly();
            }, CONFIG.timing.butterflyInterval);
        }, CONFIG.timing.butterflyFirst);

        // Lieveheersbeestjes
        biotoopTimers.ladybug = setTimeout(() => {
            spawnLadybug();
            biotoopTimers.ladybugInterval = setInterval(() => {
                if (Math.random() > 0.5) spawnLadybug();
            }, CONFIG.timing.ladybugInterval);
        }, CONFIG.timing.ladybugFirst);

        // Reset
        biotoopTimers.reset = setTimeout(() => {
            clearBiotoop();
            startBiotoop();
        }, CONFIG.timing.biotoopReset);
    }

    function clearBiotoop() {
        Object.values(biotoopTimers).forEach(t => { clearTimeout(t); clearInterval(t); });
        ['headerGarden', 'headerAnimalsGround', 'headerAnimalsFlying'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });
        state.flowers = [];
        state.activeAnimals = [];
    }

    function setup() {
        gardenEl = document.getElementById('headerGarden');
        groundEl = document.getElementById('headerAnimalsGround');
        flyingEl = document.getElementById('headerAnimalsFlying');
        setTimeout(startBiotoop, CONFIG.timing.startDelay);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
