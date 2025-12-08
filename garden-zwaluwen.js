/**
 * Natuurrijk Ankeveen - Biotoop Zwaluwen
 * Lucht en beweging: veel zwaluwen, dynamisch
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 1500,
            swallowFirst: 3000,
            swallowInterval: 8000,
            butterflyFirst: 15000,
            butterflyInterval: 20000,
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
        
        // Variatie in vliegpatronen
        const patterns = ['swallow-path-1', 'swallow-path-2', 'swallow-path-3'];
        img.className = 'flying-swallow ' + pick(patterns);

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 12000);
    }

    function spawnSwallowGroup() {
        // Groepje van 2-4 zwaluwen kort na elkaar
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            setTimeout(spawnSwallow, i * 400);
        }
    }

    function spawnButterfly() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        img.src = Math.random() > 0.5 ? 'images/Vlinder.gif' : 'images/Vlinder2.gif';
        img.className = 'flying-butterfly ' + (Math.random() > 0.5 ? 'flight-path-1' : 'flight-path-2');

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 20000);
    }

    function startBiotoop() {
        // Eerste zwaluwen snel
        setTimeout(spawnSwallow, 2000);
        setTimeout(spawnSwallow, 3500);

        // Zwaluwen cyclus - soms solo, soms groepjes
        biotoopTimers.swallow = setTimeout(() => {
            biotoopTimers.swallowInterval = setInterval(() => {
                if (Math.random() > 0.3) { // 70% kans
                    if (Math.random() > 0.5) {
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
                if (Math.random() > 0.6) spawnButterfly();
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
