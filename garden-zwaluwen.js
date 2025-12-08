/**
 * Natuurrijk Ankeveen - Biotoop Zwaluwen
 * Lucht en beweging: veel zwaluwen, dynamisch
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 1500,
            swallowFirst: 2000,        // Snel beginnen!
            swallowInterval: 6000,     // Vaker
            butterflyFirst: 12000,
            butterflyInterval: 18000,
            biotoopReset: 480000
        }
    };

    let biotoopTimers = {};
    let flyingEl;

    const SWALLOWS = [
        'images/Swallowflight.png',
        'images/Swallowflight2.png',
        'images/Swallowflight3.png'
    ];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function spawnSwallow() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        img.src = pick(SWALLOWS);
        
        // Gebruik werkende swallow-path classes
        const pathNum = 1 + Math.floor(Math.random() * 3);
        img.className = 'flying-swallow swallow-path-' + pathNum;

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 12000);
    }

    function spawnSwallowGroup() {
        // Groepje van 2-4 zwaluwen kort na elkaar
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            setTimeout(spawnSwallow, i * 300);
        }
    }

    function spawnButterfly() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        img.src = Math.random() > 0.5 ? 'images/Vlinder.gif' : 'images/Vlinder2.gif';
        img.className = 'flying-butterfly ' + (Math.random() > 0.5 ? 'flight-path-1' : 'flight-path-2');

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 15000);
    }

    function startBiotoop() {
        // Eerste zwaluwen direct
        setTimeout(spawnSwallow, 1500);
        setTimeout(spawnSwallow, 2500);
        setTimeout(spawnSwallow, 4000);

        // Zwaluwen cyclus - soms solo, soms groepjes
        biotoopTimers.swallow = setTimeout(() => {
            biotoopTimers.swallowInterval = setInterval(() => {
                if (Math.random() > 0.2) { // 80% kans
                    if (Math.random() > 0.6) {
                        spawnSwallowGroup();
                    } else {
                        spawnSwallow();
                    }
                }
            }, CONFIG.timing.swallowInterval);
        }, CONFIG.timing.swallowFirst);

        // Af en toe een vlinder (waar ze op jagen)
        biotoopTimers.butterfly = setTimeout(() => {
            spawnButterfly();
            biotoopTimers.butterflyInterval = setInterval(() => {
                if (Math.random() > 0.5) spawnButterfly();
            }, CONFIG.timing.butterflyInterval);
        }, CONFIG.timing.butterflyFirst);

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
