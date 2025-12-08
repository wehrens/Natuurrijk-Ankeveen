/**
 * Natuurrijk Ankeveen - Biotoop Bergse Pad
 * Wandeling door het landschap: ganzen, zeearend in de verte, weids gevoel
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 1500,
            geeseFirst: 5000,          // Sneller! Na 5 seconden
            geeseInterval: 35000,
            eagleAppears: 90000,
            swallowFirst: 15000,
            swallowInterval: 25000,
            biotoopReset: 480000
        }
    };

    let biotoopTimers = {};
    let flyingEl;

    function spawnSingleGoose(delay) {
        setTimeout(() => {
            if (!flyingEl) return;
            const img = document.createElement('img');
            img.src = 'images/Goose.gif';
            img.className = 'flying-goose';
            // Kleine variatie in timing via animation-delay
            img.style.animationDuration = (9 + Math.random() * 2) + 's';
            flyingEl.appendChild(img);
            setTimeout(() => { if (img.parentNode) img.remove(); }, 15000);
        }, delay);
    }

    function spawnGeese() {
        if (!flyingEl) return;

        // 40% kans op groep ganzen, 60% kans op 3 losse ganzen
        if (Math.random() > 0.6) {
            // Groep ganzen
            const img = document.createElement('img');
            img.src = 'images/Geese.gif';
            img.className = 'flying-geese';
            flyingEl.appendChild(img);
            setTimeout(() => { if (img.parentNode) img.remove(); }, 15000);
        } else {
            // 3 losse ganzen met verschillende timing
            spawnSingleGoose(0);
            spawnSingleGoose(600 + Math.random() * 400);
            spawnSingleGoose(1400 + Math.random() * 600);
        }
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
        
        const swallowOptions = [
            { src: 'images/Swallowflight.png', facesRight: true },
            { src: 'images/Swallowflight2.png', facesRight: false },
            { src: 'images/Swallowflight3.png', facesRight: false }
        ];
        const chosen = swallowOptions[Math.floor(Math.random() * swallowOptions.length)];
        img.src = chosen.src;
        
        const fliesRight = Math.random() > 0.5;
        const fliesUp = Math.random() < 0.3;
        const needsMirror = chosen.facesRight !== fliesRight;
        
        let className = 'flying-swallow ';
        if (fliesUp) {
            if (fliesRight) {
                className += needsMirror ? 'fly-right-up-mirrored' : 'fly-right-up-normal';
            } else {
                className += needsMirror ? 'fly-left-up-mirrored' : 'fly-left-up-normal';
            }
        } else {
            if (fliesRight) {
                className += needsMirror ? 'fly-right-mirrored' : 'fly-right-normal';
            } else {
                className += needsMirror ? 'fly-left-mirrored' : 'fly-left-normal';
            }
        }
        
        img.className = className;
        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 8000);
    }

    function startBiotoop() {
        // Ganzen - snel beginnen!
        biotoopTimers.geese = setTimeout(() => {
            spawnGeese();
            biotoopTimers.geeseInterval = setInterval(() => {
                if (Math.random() > 0.25) spawnGeese();
            }, CONFIG.timing.geeseInterval);
        }, CONFIG.timing.geeseFirst);

        // Zeearend - één keer, heel speciaal moment
        biotoopTimers.eagle = setTimeout(spawnEagle, CONFIG.timing.eagleAppears);

        // Zwaluwen - af en toe
        biotoopTimers.swallow = setTimeout(() => {
            spawnSwallow();
            biotoopTimers.swallowInterval = setInterval(() => {
                if (Math.random() > 0.4) spawnSwallow();
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
