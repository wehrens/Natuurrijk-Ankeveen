/**
 * Natuurrijk Ankeveen - Biotoop Oevers
 * Waterrijke biotoop: vijver, lisdoddes, roerdomp, ijsvogel, otter
 */
(function() {
    'use strict';

    // ===== CONFIGURATIE =====
    const CONFIG = {
        timing: {
            startDelay: 1500,
            pondAppears: 3000,           // Vijver komt snel
            lisdoddesStart: 5000,        // Lisdoddes kort na vijver
            roerdompAppears: 15000,      // Roerdomp na 15s
            kingfisherFirst: 25000,      // Eerste ijsvogel na 25s
            kingfisherInterval: 35000,   // Ijsvogel elke 35s (vaker!)
            otterFirst: 45000,           // Otter na 45s
            otterInterval: 60000,        // Otter elke 60s
            biotoopReset: 480000,        // 8 minuten reset
            roerdompFlipInterval: 20000, // Roerdomp kijkt vaker om
        }
    };

    // ===== STATE =====
    let state = {
        pondVisible: false,
        roerdompVisible: false
    };

    let biotoopTimers = {
        pond: null,
        pondTransition: null,
        lisdoddes: null,
        roerdomp: null,
        kingfisher: null,
        kingfisherInterval: null,
        otter: null,
        otterInterval: null,
        reset: null,
        roerdompFlip: null
    };

    // ===== DOM ELEMENTS =====
    let gardenEl, groundEl, flyingEl;

    // ===== HELPER FUNCTIONS =====
    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ===== VIJVER =====
    function showPond() {
        if (state.pondVisible) return;

        let pondEl = document.getElementById('headerPond');
        if (!pondEl) {
            pondEl = document.createElement('div');
            pondEl.id = 'headerPond';
            pondEl.className = 'header-pond';
            const grassEl = document.getElementById('headerGrass');
            if (grassEl) {
                grassEl.parentNode.insertBefore(pondEl, grassEl.nextSibling);
            } else {
                document.body.appendChild(pondEl);
            }
        }

        // Start direct met Poel3 (waterrijk)
        const pond = document.createElement('img');
        pond.src = 'images/Poel3.png';
        pond.id = 'currentPond';
        pond.className = 'garden-pond poel3';
        pondEl.appendChild(pond);

        state.pondVisible = true;
    }

    // ===== LISDODDES =====
    function showLisdoddes() {
        if (!gardenEl) return;

        // Lisdodde links
        setTimeout(() => {
            const left = document.createElement('img');
            left.src = 'images/Lisdodde.png';
            left.className = 'garden-lisdodde size-md';
            left.style.left = '65%';
            gardenEl.appendChild(left);
            requestAnimationFrame(() => left.classList.add('blooming'));
        }, 0);

        // Lisdodde midden-links
        setTimeout(() => {
            const mid1 = document.createElement('img');
            mid1.src = 'images/Lisdodde2.png';
            mid1.className = 'garden-lisdodde size-sm';
            mid1.style.left = '72%';
            gardenEl.appendChild(mid1);
            requestAnimationFrame(() => mid1.classList.add('blooming'));
        }, 800);

        // Lisdodde midden-rechts
        setTimeout(() => {
            const mid2 = document.createElement('img');
            mid2.src = 'images/Lisdodde.png';
            mid2.className = 'garden-lisdodde size-md mirrored';
            mid2.style.left = '79%';
            gardenEl.appendChild(mid2);
            requestAnimationFrame(() => mid2.classList.add('blooming'));
        }, 1500);

        // Lisdodde rechts
        setTimeout(() => {
            const right = document.createElement('img');
            right.src = 'images/Lisdodde3.png';
            right.className = 'garden-lisdodde size-md mirrored';
            right.style.left = '86%';
            gardenEl.appendChild(right);
            requestAnimationFrame(() => right.classList.add('blooming'));
        }, 2200);

        // Extra lisdodde links voor meer volume
        setTimeout(() => {
            const extra = document.createElement('img');
            extra.src = 'images/Lisdodde2.png';
            extra.className = 'garden-lisdodde size-sm';
            extra.style.left = '60%';
            gardenEl.appendChild(extra);
            requestAnimationFrame(() => extra.classList.add('blooming'));
        }, 3000);
    }

    // ===== ROERDOMP =====
    function showRoerdomp() {
        if (state.roerdompVisible || !gardenEl) return;

        const roerdomp = document.createElement('img');
        roerdomp.src = 'images/Roerdomp.png';
        roerdomp.className = 'garden-roerdomp';
        roerdomp.id = 'biotoop-roerdomp';
        gardenEl.appendChild(roerdomp);

        requestAnimationFrame(() => {
            roerdomp.classList.add('visible');
        });

        state.roerdompVisible = true;

        // Roerdomp kijkt regelmatig andere kant op
        let facingRight = false;
        biotoopTimers.roerdompFlip = setInterval(() => {
            facingRight = !facingRight;
            roerdomp.style.transform = facingRight ? 'scaleX(-1)' : 'scaleX(1)';
        }, CONFIG.timing.roerdompFlipInterval);
    }

    // ===== IJSVOGEL =====
    function spawnKingfisher() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        img.src = 'images/Kingfisher.gif';
        img.className = 'flying-kingfisher';

        flyingEl.appendChild(img);

        setTimeout(() => {
            if (img.parentNode) img.remove();
        }, 6000);
    }

    function startKingfisherCycle() {
        spawnKingfisher();

        biotoopTimers.kingfisherInterval = setInterval(() => {
            if (Math.random() > 0.3) { // 70% kans (vaker dan normaal!)
                spawnKingfisher();
            }
        }, CONFIG.timing.kingfisherInterval);
    }

    // ===== OTTER =====
    function spawnOtter() {
        if (!groundEl) return;

        const img = document.createElement('img');
        img.src = 'images/Otter.gif';
        img.className = 'swimming-otter';

        groundEl.appendChild(img);

        setTimeout(() => {
            if (img.parentNode) img.remove();
        }, 21000);
    }

    function startOtterCycle() {
        spawnOtter();

        biotoopTimers.otterInterval = setInterval(() => {
            if (Math.random() > 0.4) { // 60% kans (vaker!)
                spawnOtter();
            }
        }, CONFIG.timing.otterInterval);
    }

    // ===== CLEANUP =====
    function clearBiotoop() {
        Object.values(biotoopTimers).forEach(timer => {
            if (timer) {
                clearTimeout(timer);
                clearInterval(timer);
            }
        });

        // Clear alles behalve gras (dat blijft altijd staan)
        ['headerGarden', 'headerPond', 'headerAnimalsGround', 'headerAnimalsFlying'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });

        state.pondVisible = false;
        state.roerdompVisible = false;
    }

    // ===== BIOTOOP START =====
    function startBiotoop() {
        clearBiotoop();

        // Fase 1: Vijver (snel!)
        biotoopTimers.pond = setTimeout(showPond, CONFIG.timing.pondAppears);

        // Fase 2: Lisdoddes
        biotoopTimers.lisdoddes = setTimeout(showLisdoddes, CONFIG.timing.lisdoddesStart);

        // Fase 3: Roerdomp
        biotoopTimers.roerdomp = setTimeout(showRoerdomp, CONFIG.timing.roerdompAppears);

        // Fase 4: IJsvogel cyclus
        biotoopTimers.kingfisher = setTimeout(startKingfisherCycle, CONFIG.timing.kingfisherFirst);

        // Fase 5: Otter cyclus
        biotoopTimers.otter = setTimeout(startOtterCycle, CONFIG.timing.otterFirst);

        // Reset na 8 minuten
        biotoopTimers.reset = setTimeout(() => {
            startBiotoop();
        }, CONFIG.timing.biotoopReset);
    }

    // ===== INIT =====
    function init() {
        // Wacht op DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
    }

    function setup() {
        // Maak containers aan
        const nav = document.querySelector('nav');
        if (!nav) return;

        // Header background (achtergrond)
        let bgEl = document.getElementById('headerBackground');
        if (!bgEl) {
            bgEl = document.createElement('div');
            bgEl.id = 'headerBackground';
            bgEl.className = 'header-background';
            document.body.insertBefore(bgEl, document.body.firstChild);
        }

        // Gras container - gebruik bestaande (al in HTML)
        let grassEl = document.getElementById('headerGrass');
        if (!grassEl) {
            grassEl = document.createElement('div');
            grassEl.id = 'headerGrass';
            grassEl.className = 'header-grass';
            // Voeg gras images toe
            for (let i = 0; i < 10; i++) {
                const grassImg = document.createElement('img');
                grassImg.src = 'images/Gras-cropped.png';
                grassImg.className = 'garden-grass';
                grassEl.appendChild(grassImg);
            }
            document.body.insertBefore(grassEl, nav.nextSibling);
        }

        // Garden container (bloemen, lisdoddes, roerdomp)
        gardenEl = document.getElementById('headerGarden');
        if (!gardenEl) {
            gardenEl = document.createElement('div');
            gardenEl.id = 'headerGarden';
            gardenEl.className = 'header-garden';
            document.body.insertBefore(gardenEl, grassEl.nextSibling);
        }

        // Ground animals container (otter)
        groundEl = document.getElementById('headerAnimalsGround');
        if (!groundEl) {
            groundEl = document.createElement('div');
            groundEl.id = 'headerAnimalsGround';
            groundEl.className = 'header-animals-ground';
            document.body.insertBefore(groundEl, gardenEl.nextSibling);
        }

        // Flying animals container (ijsvogel)
        flyingEl = document.getElementById('headerAnimalsFlying');
        if (!flyingEl) {
            flyingEl = document.createElement('div');
            flyingEl.id = 'headerAnimalsFlying';
            flyingEl.className = 'header-animals-flying';
            document.body.insertBefore(flyingEl, groundEl.nextSibling);
        }

        // Start de biotoop
        setTimeout(startBiotoop, CONFIG.timing.startDelay);
    }

    // Start!
    init();
})();
