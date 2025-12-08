/**
 * Natuurrijk Ankeveen - Biotoop Aanplanten
 * Groei en bloei: focus op bloemen die opkomen, meditatief
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 2000,
            flowerInterval: 4000,      // Langzamer, meditatief
            butterflyFirst: 12000,
            butterflyInterval: 15000,
            ladybugFirst: 25000,
            ladybugInterval: 30000,
            biotoopReset: 480000
        }
    };

    let state = { flowers: [] };
    let biotoopTimers = {};
    let gardenEl, groundEl, flyingEl;

    // Meer variatie, focus op bloeiende planten
    const FLOWERS = [
        { src: 'images/Klaproos.png', size: 'size-xs' },
        { src: 'images/Klaproos.png', size: 'size-sm' },
        { src: 'images/Klaproos.png', size: 'size-md' },
        { src: 'images/Klaprozen2.png', size: 'size-sm' },
        { src: 'images/Ridderspoor.png', size: 'size-sm' },
        { src: 'images/Ridderspoor.png', size: 'size-md' },
        { src: 'images/Ridderspoor2.png', size: 'size-xs' },
        { src: 'images/Ridderspoor2.png', size: 'size-sm' },
        { src: 'images/Digitalis.png', size: 'size-sm' },
        { src: 'images/Digitalis.png', size: 'size-md' },
        { src: 'images/Veldoeket.png', size: 'size-sm' },
        { src: 'images/Veldoeket.png', size: 'size-md' },
        { src: 'images/Gelelis.png', size: 'size-sm', extraClass: 'lower' },
    ];

    // Meer posities voor voller effect
    const FLOWER_POSITIONS = [3, 10, 18, 26, 34, 42, 52, 62, 72, 82, 90, 96];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function addFlower() {
        if (!gardenEl || state.flowers.length >= 14) return;

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
        const isBlue = Math.random() > 0.5;
        img.src = isBlue ? 'images/Vlinder2.gif' : 'images/Vlinder.gif';
        
        const goingRight = Math.random() > 0.5;
        if (isBlue) {
            img.className = 'flying-butterfly ' + (goingRight ? 'flutter-right-smooth' : 'flutter-left-smooth');
        } else {
            img.className = 'flying-butterfly ' + (goingRight ? 'flutter-right' : 'flutter-left');
        }

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 30000);
    }

    function spawnLadybug() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        img.src = 'images/Ladybug.gif';
        img.className = 'flying-ladybug';
        img.style.left = (20 + Math.random() * 60) + '%';

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 8000);
    }

    function startBiotoop() {
        // Langzaam bloemen opbouwen - meer meditatief
        for (let i = 0; i < 4; i++) {
            setTimeout(addFlower, i * 1200);
        }

        biotoopTimers.flowers = setInterval(() => {
            if (state.flowers.length < 14) addFlower();
        }, CONFIG.timing.flowerInterval);

        // Vlinders
        biotoopTimers.butterfly = setTimeout(() => {
            spawnButterfly();
            biotoopTimers.butterflyInterval = setInterval(() => {
                if (Math.random() > 0.4) spawnButterfly();
            }, CONFIG.timing.butterflyInterval);
        }, CONFIG.timing.butterflyFirst);

        // Lieveheersbeestjes
        biotoopTimers.ladybug = setTimeout(() => {
            spawnLadybug();
            biotoopTimers.ladybugInterval = setInterval(() => {
                if (Math.random() > 0.6) spawnLadybug();
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
