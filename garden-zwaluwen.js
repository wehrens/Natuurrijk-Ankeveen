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

    function spawnSwallowGroup() {
        // Groepje van 2-4 zwaluwen kort na elkaar
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            setTimeout(spawnSwallow, i * 300);
        }
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
