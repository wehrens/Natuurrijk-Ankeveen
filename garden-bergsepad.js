/**
 * Natuurrijk Ankeveen - Biotoop Bergse Pad
 * Wandeling door het landschap: ganzen, zeearend in de verte, weids gevoel
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 1500,
            geeseFirst: 15000,
            geeseInterval: 45000,
            eagleAppears: 90000,      // Zeearend na 1.5 minuut
            swallowFirst: 20000,
            swallowInterval: 30000,
            biotoopReset: 480000
        }
    };

    let biotoopTimers = {};
    let flyingEl;

    function spawnGeese() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        
        // 50/50 kans op enkele gans of groep
        if (Math.random() > 0.5) {
            img.src = 'images/Goose.gif';
            img.className = 'flying-goose';
        } else {
            img.src = 'images/Geese.gif';
            img.className = 'flying-geese';
        }

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 15000);
    }

    function spawnEagle() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        img.src = 'images/Zeearend.png';
        img.className = 'flying-eagle';

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 20000);
    }

    function spawnSwallow() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        const swallows = ['images/Swallowflight.png', 'images/Swallowflight2.png', 'images/Swallowflight3.png'];
        img.src = swallows[Math.floor(Math.random() * swallows.length)];
        img.className = 'flying-swallow swallow-path-' + (1 + Math.floor(Math.random() * 3));

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 12000);
    }

    function startBiotoop() {
        // Ganzen - regelmatig overvliegend
        biotoopTimers.geese = setTimeout(() => {
            spawnGeese();
            biotoopTimers.geeseInterval = setInterval(() => {
                if (Math.random() > 0.35) spawnGeese();
            }, CONFIG.timing.geeseInterval);
        }, CONFIG.timing.geeseFirst);

        // Zeearend - één keer, heel speciaal moment
        biotoopTimers.eagle = setTimeout(spawnEagle, CONFIG.timing.eagleAppears);

        // Zwaluwen - af en toe
        biotoopTimers.swallow = setTimeout(() => {
            spawnSwallow();
            biotoopTimers.swallowInterval = setInterval(() => {
                if (Math.random() > 0.5) spawnSwallow();
            }, CONFIG.timing.swallowInterval);
        }, CONFIG.timing.swallowFirst);

        // Reset
        biotoopTimers.reset = setTimeout(() => {
            clearBiotoop();
            startBiotoop();
        }, CONFIG.timing.biotoopReset);
    }

    function clearBiotoop() {
        Object.values(biotoopTimers).forEach(t => { clearTimeout(t); clearInterval(t); });
        const el = document.getElementById('headerAnimalsFlying');
        if (el) el.innerHTML = '';
    }

    function setup() {
        flyingEl = document.getElementById('headerAnimalsFlying');
        setTimeout(startBiotoop, CONFIG.timing.startDelay);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
