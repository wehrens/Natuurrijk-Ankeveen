/**
 * Natuurrijk Ankeveen - Biotoop Zwaluwen
 * Lucht en beweging: veel zwaluwen, dynamisch
 * Met zwaluwtil waar zwaluwen omheen cirkelen
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 1500,
            swallowFirst: 2000,
            swallowInterval: 6000,
            tilCircleFirst: 8000,      // Eerste rondje om til
            tilCircleInterval: 15000,  // Elke 15 sec een rondje
            biotoopReset: 480000
        },
        til: {
            position: 78,  // % van links
            height: 130    // px hoogte
        }
    };

    let biotoopTimers = {};
    let flyingEl, gardenEl;

    const SWALLOWS = [
        { src: 'images/Swallowflight.png', facesRight: true },
        { src: 'images/Swallowflight2.png', facesRight: false },
        { src: 'images/Swallowflight3.png', facesRight: false }
    ];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // ===== ZWALUWTIL =====
    
    function placeZwaluwtil() {
        if (!gardenEl) return;
        
        const til = document.createElement('img');
        til.src = 'images/Zwaluwtil.png';
        til.className = 'zwaluwtil';
        til.style.left = CONFIG.til.position + '%';
        til.style.height = CONFIG.til.height + 'px';
        
        gardenEl.appendChild(til);
        
        // Fade in
        requestAnimationFrame(() => til.classList.add('visible'));
    }

    // ===== NORMALE ZWALUWEN =====

    function spawnSwallow() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        const chosen = pick(SWALLOWS);
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
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            setTimeout(spawnSwallow, i * 300);
        }
    }

    // ===== ZWALUWEN OM DE TIL =====
    
    function spawnTilCircleSwallow() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        const chosen = pick(SWALLOWS);
        img.src = chosen.src;
        
        // Random richting: met de klok mee of tegen de klok in
        const clockwise = Math.random() > 0.5;
        
        img.className = 'flying-swallow til-circle ' + (clockwise ? 'circle-cw' : 'circle-ccw');
        
        // Positioneer bij de til
        img.style.left = CONFIG.til.position + '%';
        
        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 6000);
    }
    
    function spawnTilCircleGroup() {
        // 2-3 zwaluwen cirkelen om de til
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            setTimeout(spawnTilCircleSwallow, i * 400);
        }
    }

    // ===== BIOTOOP LIFECYCLE =====

    function startBiotoop() {
        // Plaats de zwaluwtil
        placeZwaluwtil();
        
        // Eerste zwaluwen direct
        setTimeout(spawnSwallow, 1500);
        setTimeout(spawnSwallow, 2500);
        setTimeout(spawnSwallow, 4000);

        // Zwaluwen cyclus - soms solo, soms groepjes
        biotoopTimers.swallow = setTimeout(() => {
            biotoopTimers.swallowInterval = setInterval(() => {
                if (Math.random() > 0.2) {
                    if (Math.random() > 0.6) {
                        spawnSwallowGroup();
                    } else {
                        spawnSwallow();
                    }
                }
            }, CONFIG.timing.swallowInterval);
        }, CONFIG.timing.swallowFirst);

        // Zwaluwen om de til - speciaal effect
        biotoopTimers.tilCircle = setTimeout(() => {
            spawnTilCircleGroup();
            biotoopTimers.tilCircleInterval = setInterval(() => {
                if (Math.random() > 0.3) { // 70% kans
                    spawnTilCircleGroup();
                }
            }, CONFIG.timing.tilCircleInterval);
        }, CONFIG.timing.tilCircleFirst);

        // Reset
        biotoopTimers.reset = setTimeout(() => {
            clearBiotoop();
            startBiotoop();
        }, CONFIG.timing.biotoopReset);
    }

    function clearBiotoop() {
        Object.values(biotoopTimers).forEach(t => { clearTimeout(t); clearInterval(t); });
        
        const flyEl = document.getElementById('headerAnimalsFlying');
        if (flyEl) flyEl.innerHTML = '';
        
        const gardEl = document.getElementById('headerGarden');
        if (gardEl) {
            const til = gardEl.querySelector('.zwaluwtil');
            if (til) til.remove();
        }
    }

    function setup() {
        flyingEl = document.getElementById('headerAnimalsFlying');
        gardenEl = document.getElementById('headerGarden');
        setTimeout(startBiotoop, CONFIG.timing.startDelay);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
