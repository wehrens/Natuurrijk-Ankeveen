/**
 * Natuurrijk Ankeveen - Biotoop Oevers
 * Waterrijke biotoop: vijver, lisdoddes, roerdomp, ijsvogel, otter
 * Plus: dansende vlinders en ladybugs bij het water
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
            butterfliesStart: 20000,     // Vlinders na 20s
            ladybugFirst: 25000,         // Ladybug na 25s
            ladybugInterval: 20000,      // Ladybug elke 20s
            kingfisherFirst: 30000,      // Eerste ijsvogel na 30s
            kingfisherInterval: 35000,   // Ijsvogel elke 35s
            otterFirst: 45000,           // Otter na 45s
            otterInterval: 60000,        // Otter elke 60s
            slobeendFirst: 20000,        // Slobeend na 20s
            slobeendInterval: 50000,     // Slobeend elke 50s
            biotoopReset: 480000,        // 8 minuten reset
            roerdompFlipInterval: 20000, // Roerdomp kijkt vaker om
        }
    };

    // ===== STATE =====
    let state = {
        pondVisible: false,
        roerdompVisible: false,
        biotoopActive: false
    };

    let biotoopTimers = {
        pond: null,
        pondTransition: null,
        lisdoddes: null,
        roerdomp: null,
        butterflies: null,
        ladybug: null,
        ladybugInterval: null,
        kingfisher: null,
        kingfisherInterval: null,
        otter: null,
        otterInterval: null,
        slobeend: null,
        slobeendInterval: null,
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

    // ===== DANSENDE VLINDERS BIJ VIJVER =====
    const POND_BUTTERFLIES = [
        { src: 'images/Vlinder.gif', mirrored: false },   // Oranje
        { src: 'images/Vlinder.gif', mirrored: true },    // Oranje gespiegeld
        { src: 'images/Vlinder2.gif', mirrored: false },  // Blauw
        { src: 'images/Vlinder2.gif', mirrored: true }    // Blauw gespiegeld
    ];

    function createDancingButterfly(config, index) {
        if (!flyingEl || !state.biotoopActive) return;

        const butterfly = document.createElement('img');
        butterfly.src = config.src;
        butterfly.className = 'pond-butterfly pond-butterfly-' + index;
        if (config.mirrored) {
            butterfly.classList.add('mirrored');
        }
        flyingEl.appendChild(butterfly);

        // Start de dans-cyclus
        animateButterfly(butterfly, index);
    }

    function animateButterfly(butterfly, index) {
        if (!state.biotoopActive || !butterfly.parentNode) return;

        // Gebied rond de vijver (55% - 95%)
        const minX = 55;
        const maxX = 92;
        const minY = 10;
        const maxY = 60;

        // Startpositie (gespreid over het gebied)
        const startX = minX + (index * 10) + rand(-5, 5);
        const startY = minY + rand(0, 20);

        let currentX = startX;
        let currentY = startY;
        let goingRight = index % 2 === 0;

        function doFlight() {
            if (!state.biotoopActive || !butterfly.parentNode) return;

            // Bepaal nieuwe bestemming (dwarrelig)
            const deltaX = rand(8, 20) * (goingRight ? 1 : -1);
            const deltaY = rand(-15, 15);
            
            let newX = currentX + deltaX;
            let newY = currentY + deltaY;

            // Houd binnen gebied
            if (newX < minX) { newX = minX + rand(5, 15); goingRight = true; }
            if (newX > maxX) { newX = maxX - rand(5, 15); goingRight = false; }
            if (newY < minY) newY = minY + rand(5, 10);
            if (newY > maxY) newY = maxY - rand(5, 10);

            // Vliegduur
            const flightDuration = rand(2000, 4000);

            // Spiegel de vlinder als richting verandert
            if (goingRight) {
                butterfly.classList.remove('flying-left');
                butterfly.classList.add('flying-right');
            } else {
                butterfly.classList.remove('flying-right');
                butterfly.classList.add('flying-left');
            }

            // Animate naar nieuwe positie
            butterfly.style.transition = `left ${flightDuration}ms ease-in-out, top ${flightDuration}ms ease-in-out`;
            butterfly.style.left = newX + '%';
            butterfly.style.top = newY + 'px';

            currentX = newX;
            currentY = newY;

            // Na vlucht: soms stoppen, dan weer verder
            setTimeout(() => {
                if (!state.biotoopActive || !butterfly.parentNode) return;

                // 40% kans om even te stoppen
                const pauseDuration = Math.random() > 0.6 ? rand(1000, 3000) : rand(200, 500);
                
                // Wissel soms van richting
                if (Math.random() > 0.7) {
                    goingRight = !goingRight;
                }

                setTimeout(doFlight, pauseDuration);
            }, flightDuration);
        }

        // Zet startpositie
        butterfly.style.left = startX + '%';
        butterfly.style.top = startY + 'px';
        butterfly.style.opacity = '0';

        // Fade in en start vlucht
        setTimeout(() => {
            butterfly.style.transition = 'opacity 1s ease';
            butterfly.style.opacity = '1';
            setTimeout(doFlight, 1000 + (index * 500));
        }, index * 800);
    }

    function startPondButterflies() {
        if (!flyingEl || !state.biotoopActive) return;

        // Spawn 4 vlinders met vertraging
        POND_BUTTERFLIES.forEach((config, index) => {
            setTimeout(() => {
                createDancingButterfly(config, index);
            }, index * 1000);
        });
    }

    // ===== LADYBUG BIJ VIJVER =====
    function spawnPondLadybug() {
        if (!flyingEl || !state.biotoopActive) return;

        const img = document.createElement('img');
        img.src = 'images/Ladybug.gif';
        img.className = 'pond-ladybug';
        // Spawn in de buurt van vijver
        img.style.left = (60 + rand(0, 25)) + '%';

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 8000);
    }

    function startLadybugCycle() {
        spawnPondLadybug();

        biotoopTimers.ladybugInterval = setInterval(() => {
            if (state.biotoopActive && Math.random() > 0.4) {
                spawnPondLadybug();
            }
        }, CONFIG.timing.ladybugInterval);
    }

    // ===== OTTER =====
    function spawnOtter() {
        if (!groundEl) return;

        const img = document.createElement('img');
        img.src = 'images/Otter.gif';
        img.className = 'swimming-otter otter-to-pond';

        groundEl.appendChild(img);

        setTimeout(() => {
            if (img.parentNode) img.remove();
        }, 13000);
    }

    function startOtterCycle() {
        spawnOtter();

        biotoopTimers.otterInterval = setInterval(() => {
            if (Math.random() > 0.4) { // 60% kans (vaker!)
                spawnOtter();
            }
        }, CONFIG.timing.otterInterval);
    }

    // ===== SLOBEEND =====
    let slobeendDirection = 'left'; // Start richting
    
    function spawnSlobeend() {
        // Slobeend drijft door de hele pagina, niet beperkt tot header
        const img = document.createElement('img');
        img.src = 'images/Slobeend.png';
        img.className = 'swimming-slobeend';
        
        if (slobeendDirection === 'left') {
            // Van vijver naar links
            img.classList.add('slobeend-to-left');
            slobeendDirection = 'right'; // Volgende keer terug
        } else {
            // Van links terug naar vijver (gespiegeld)
            img.classList.add('slobeend-to-right');
            slobeendDirection = 'left';
        }
        
        document.body.appendChild(img);
        
        // Verwijder na animatie (40s)
        setTimeout(() => {
            if (img.parentNode) img.remove();
        }, 42000);
    }
    
    function startSlobeendCycle() {
        spawnSlobeend();
        
        biotoopTimers.slobeendInterval = setInterval(() => {
            spawnSlobeend();
        }, CONFIG.timing.slobeendInterval);
    }

    // ===== CLEANUP =====
    function clearBiotoop() {
        state.biotoopActive = false;
        
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
        state.biotoopActive = true;

        // Fase 1: Vijver (snel!)
        biotoopTimers.pond = setTimeout(showPond, CONFIG.timing.pondAppears);

        // Fase 2: Lisdoddes
        biotoopTimers.lisdoddes = setTimeout(showLisdoddes, CONFIG.timing.lisdoddesStart);

        // Fase 3: Roerdomp
        biotoopTimers.roerdomp = setTimeout(showRoerdomp, CONFIG.timing.roerdompAppears);

        // Fase 4: Dansende vlinders bij vijver
        biotoopTimers.butterflies = setTimeout(startPondButterflies, CONFIG.timing.butterfliesStart);

        // Fase 5: Ladybugs
        biotoopTimers.ladybug = setTimeout(startLadybugCycle, CONFIG.timing.ladybugFirst);

        // Fase 6: IJsvogel cyclus
        biotoopTimers.kingfisher = setTimeout(startKingfisherCycle, CONFIG.timing.kingfisherFirst);

        // Fase 7: Otter cyclus
        biotoopTimers.otter = setTimeout(startOtterCycle, CONFIG.timing.otterFirst);

        // Fase 8: Slobeend cyclus
        biotoopTimers.slobeend = setTimeout(startSlobeendCycle, CONFIG.timing.slobeendFirst);

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
        // Vind bestaande containers (al in HTML)
        const nav = document.querySelector('nav');
        if (!nav) return;

        // Gebruik bestaande elementen
        gardenEl = document.getElementById('headerGarden');
        groundEl = document.getElementById('headerAnimalsGround');
        flyingEl = document.getElementById('headerAnimalsFlying');

        // Start de biotoop (zonder clear bij eerste keer)
        setTimeout(() => {
            state.biotoopActive = true;
            
            // Fase 1: Vijver (snel!)
            biotoopTimers.pond = setTimeout(showPond, CONFIG.timing.pondAppears);

            // Fase 2: Lisdoddes
            biotoopTimers.lisdoddes = setTimeout(showLisdoddes, CONFIG.timing.lisdoddesStart);

            // Fase 3: Roerdomp
            biotoopTimers.roerdomp = setTimeout(showRoerdomp, CONFIG.timing.roerdompAppears);

            // Fase 4: Dansende vlinders bij vijver
            biotoopTimers.butterflies = setTimeout(startPondButterflies, CONFIG.timing.butterfliesStart);

            // Fase 5: Ladybugs
            biotoopTimers.ladybug = setTimeout(startLadybugCycle, CONFIG.timing.ladybugFirst);

            // Fase 6: IJsvogel cyclus
            biotoopTimers.kingfisher = setTimeout(startKingfisherCycle, CONFIG.timing.kingfisherFirst);

            // Fase 7: Otter cyclus
            biotoopTimers.otter = setTimeout(startOtterCycle, CONFIG.timing.otterFirst);

            // Reset na 8 minuten
            biotoopTimers.reset = setTimeout(() => {
                startBiotoop();
            }, CONFIG.timing.biotoopReset);
        }, CONFIG.timing.startDelay);
    }

    // Start!
    init();
})();
