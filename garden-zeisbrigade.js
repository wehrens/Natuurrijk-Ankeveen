/**
 * Natuurrijk Ankeveen - Biotoop Zeisbrigade
 * Hooiland sfeer: veel bloemen, vlinders, rustig zomers gevoel
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 1500,
            flowerInterval: 2500,
            butterflyFirst: 6000,
            butterflyInterval: 10000,
            ladybugFirst: 15000,
            ladybugInterval: 20000,
            biotoopReset: 480000
        }
    };

    let state = { flowers: [], activeAnimals: [] };
    let biotoopTimers = {};
    let gardenEl, groundEl, flyingEl;

    // ALLE bloemen voor hooiland effect
    const FLOWERS = [
        { src: 'images/Klaproos.png', size: 'size-xs' },
        { src: 'images/Klaproos.png', size: 'size-sm' },
        { src: 'images/Klaproos.png', size: 'size-md' },
        { src: 'images/Klaprozen2.png', size: 'size-xs' },
        { src: 'images/Klaprozen2.png', size: 'size-sm' },
        { src: 'images/Klaprozen2.png', size: 'size-md' },
        { src: 'images/Klaprozen.png', size: 'size-xs' },
        { src: 'images/Klaprozen.png', size: 'size-sm' },
        { src: 'images/Ridderspoor.png', size: 'size-sm' },
        { src: 'images/Ridderspoor.png', size: 'size-md' },
        { src: 'images/Ridderspoor.png', size: 'size-lg' },
        { src: 'images/Ridderspoor2.png', size: 'size-xs' },
        { src: 'images/Ridderspoor2.png', size: 'size-sm' },
        { src: 'images/Ridderspoor2.png', size: 'size-md' },
        { src: 'images/Digitalis.png', size: 'size-sm' },
        { src: 'images/Digitalis.png', size: 'size-md' },
        { src: 'images/Digitalis.png', size: 'size-lg' },
        { src: 'images/Veldoeket.png', size: 'size-sm' },
        { src: 'images/Veldoeket.png', size: 'size-md' },
        { src: 'images/Veldoeket.png', size: 'size-lg' },
        { src: 'images/Gelelis.png', size: 'size-sm', extraClass: 'lower' },
        { src: 'images/Gelelis.png', size: 'size-md', extraClass: 'lower' },
        { src: 'images/Lisdodde2.png', size: 'size-sm' },
    ];

    // Meer posities voor vol hooiland
    const FLOWER_POSITIONS = [3, 8, 14, 20, 27, 34, 42, 50, 58, 66, 74, 82, 89, 95];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function addFlower() {
        if (!gardenEl || state.flowers.length >= 16) return;

        const usedPositions = state.flowers.map(f => f.pos);
        const free = FLOWER_POSITIONS.filter(p => !usedPositions.includes(p));
        if (free.length === 0) return;

        const pos = pick(free);
        const data = pick(FLOWERS);
        const mirrored = Math.random() > 0.5;

        const img = document.createElement('img');
        img.src = data.src;
        img.className = `garden-flower ${data.size}${mirrored ? ' mirrored' : ''}${data.extraClass ? ' ' + data.extraClass : ''}`;
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
        setTimeout(() => { if (img.parentNode) img.remove(); }, 15000);
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
        // Snel veel bloemen opbouwen voor hooiland effect
        for (let i = 0; i < 8; i++) {
            setTimeout(addFlower, i * 600);
        }

        biotoopTimers.flowers = setInterval(() => {
            if (state.flowers.length < 16) addFlower();
        }, CONFIG.timing.flowerInterval);

        // Vlinders - vaker en sneller
        biotoopTimers.butterfly = setTimeout(() => {
            spawnButterfly();
            biotoopTimers.butterflyInterval = setInterval(() => {
                if (Math.random() > 0.25) spawnButterfly();
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
