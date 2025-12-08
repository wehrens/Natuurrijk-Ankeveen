/**
 * Natuurrijk Ankeveen - Biotoop Educatie
 * Speels en leerzaam: egel, vlinders, lieveheersbeestjes, rups
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 1500,
            flowerInterval: 4000,
            hedgehogFirst: 10000,
            hedgehogInterval: 45000,
            butterflyFirst: 8000,
            butterflyInterval: 12000,
            caterpillarFirst: 20000,
            caterpillarInterval: 35000,
            ladybugFirst: 15000,
            ladybugInterval: 25000,
            biotoopReset: 480000
        }
    };

    let state = { flowers: [] };
    let biotoopTimers = {};
    let gardenEl, groundEl, flyingEl;

    // Kleurrijke, vrolijke bloemen
    const FLOWERS = [
        { src: 'images/Klaproos.png', size: 'size-sm' },
        { src: 'images/Klaproos.png', size: 'size-md' },
        { src: 'images/Klaprozen2.png', size: 'size-sm' },
        { src: 'images/Ridderspoor.png', size: 'size-md' },
        { src: 'images/Ridderspoor2.png', size: 'size-sm' },
        { src: 'images/Digitalis.png', size: 'size-md' },
        { src: 'images/Veldoeket.png', size: 'size-md' },
    ];

    const FLOWER_POSITIONS = [8, 18, 30, 45, 60, 75, 88];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function addFlower() {
        if (!gardenEl || state.flowers.length >= 8) return;

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

    function spawnHedgehog() {
        if (!groundEl) return;

        const img = document.createElement('img');
        img.src = 'images/egel.png';
        const height = 25 + Math.random() * 8;
        img.style.height = height + 'px';
        img.style.top = -Math.round(height / 2) + 'px';
        img.className = 'walking-hedgehog ' + (Math.random() > 0.5 ? 'walk-right' : 'walk-left');

        groundEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 45000);
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

    function spawnCaterpillar() {
        if (!groundEl) return;

        const img = document.createElement('img');
        img.src = 'images/Rups1.gif';
        img.className = 'crawling-caterpillar crawl-normal';

        groundEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 90000);
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
        // Bloemen
        for (let i = 0; i < 4; i++) {
            setTimeout(addFlower, i * 1000);
        }
        biotoopTimers.flowers = setInterval(() => {
            if (state.flowers.length < 8) addFlower();
        }, CONFIG.timing.flowerInterval);

        // Egel - kinderen vinden egels geweldig!
        biotoopTimers.hedgehog = setTimeout(() => {
            spawnHedgehog();
            biotoopTimers.hedgehogInterval = setInterval(() => {
                if (Math.random() > 0.4) spawnHedgehog();
            }, CONFIG.timing.hedgehogInterval);
        }, CONFIG.timing.hedgehogFirst);

        // Vlinders
        biotoopTimers.butterfly = setTimeout(() => {
            spawnButterfly();
            biotoopTimers.butterflyInterval = setInterval(() => {
                if (Math.random() > 0.3) spawnButterfly();
            }, CONFIG.timing.butterflyInterval);
        }, CONFIG.timing.butterflyFirst);

        // Rups
        biotoopTimers.caterpillar = setTimeout(() => {
            spawnCaterpillar();
            biotoopTimers.caterpillarInterval = setInterval(() => {
                if (Math.random() > 0.5) spawnCaterpillar();
            }, CONFIG.timing.caterpillarInterval);
        }, CONFIG.timing.caterpillarFirst);

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
