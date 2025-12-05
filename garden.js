/* ===========================================
   NATUURRIJK ANKEVEEN - Biotoop Controller
   Volledige choreografie van de levende header
   =========================================== */

(function() {
    'use strict';

    // ===== CONFIGURATIE =====
    const CONFIG = {
        timing: {
            startDelay: 2000,
            flowerInterval: 10000,      // 10s tussen bloemen
            totalFlowerTime: 120000,    // 2 min voor alle bloemen
            pondAppears: 50000,         // Vijver na 50s
            roerdompAppears: 100000,    // Roerdomp na 100s
            animalStartDelay: 5000,     // Eerste dier al na 5s!
            animalInterval: 10000,      // Check elke 10s voor nieuw dier
        },
        maxAnimalsVisible: 3,
        maxFlowers: 10,
        navKey: 'natuurrijk_navigating'
    };

    // ===== BLOEMEN DATA =====
    const FLOWERS = [
        { src: 'images/Klaproos.png', size: 'size-md' },
        { src: 'images/Ridderspoor.png', size: 'size-lg' },
        { src: 'images/Digitalis.png', size: 'size-lg' },
        { src: 'images/Klaprozen2.png', size: 'size-md' },
        { src: 'images/Gelelis.png', size: 'size-sm' },
        { src: 'images/Ridderspoor2.png', size: 'size-md' },
        { src: 'images/Veldoeket.png', size: 'size-lg' },
        { src: 'images/Klaprozen.png', size: 'size-md' },
        { src: 'images/Lisdodde2.png', size: 'size-sm' },
    ];

    // Bloem posities (vermijd vijver zone 70-85%)
    const FLOWER_POSITIONS = [3, 9, 16, 24, 32, 41, 50, 59, 88, 95];

    // ===== STATE =====
    let state = {
        flowers: [],
        pondVisible: false,
        roerdompVisible: false,
        activeAnimals: []
    };

    // ===== DOM REFS =====
    let gardenEl, groundEl, flyingEl;

    // ===== HELPERS =====
    const rand = (min, max) => Math.random() * (max - min) + min;
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    // ===== BLOEMEN =====
    function addFlower() {
        // Vind vrije positie
        const used = state.flowers.map(f => f.pos);
        const free = FLOWER_POSITIONS.filter(p => !used.includes(p));
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

    function removeRandomFlower() {
        if (state.flowers.length <= 4) return; // Houd minimum
        
        const idx = Math.floor(Math.random() * state.flowers.length);
        const flower = state.flowers.splice(idx, 1)[0];
        flower.el.classList.remove('blooming');
        flower.el.classList.add('wilting');
        setTimeout(() => flower.el.remove(), 1500);
    }

    // ===== VIJVER & ROERDOMP =====
    function showPond() {
        if (state.pondVisible) return;

        // Maak vijver container (voor het gras)
        let pondEl = document.getElementById('headerPond');
        if (!pondEl) {
            pondEl = document.createElement('div');
            pondEl.id = 'headerPond';
            pondEl.className = 'header-pond';
            // Voeg toe na het gras
            const grassEl = document.getElementById('headerGrass');
            if (grassEl) {
                grassEl.parentNode.insertBefore(pondEl, grassEl.nextSibling);
            } else {
                document.body.appendChild(pondEl);
            }
        }

        const pond = document.createElement('img');
        pond.src = 'images/Poel1.png';
        pond.className = 'garden-pond';
        pondEl.appendChild(pond);

        // Lisdodde links van vijver (in garden container, achter vijver)
        setTimeout(() => {
            const left = document.createElement('img');
            left.src = 'images/Lisdodde.png';
            left.className = 'garden-flower size-md';
            left.style.left = '69%';
            gardenEl.appendChild(left);
            requestAnimationFrame(() => left.classList.add('blooming'));
        }, 1500);

        // Lisdodde rechts van vijver
        setTimeout(() => {
            const right = document.createElement('img');
            right.src = 'images/Lisdodde3.png';
            right.className = 'garden-flower size-md mirrored';
            right.style.left = '84%';
            gardenEl.appendChild(right);
            requestAnimationFrame(() => right.classList.add('blooming'));
        }, 3000);

        state.pondVisible = true;
    }

    function showRoerdomp() {
        if (!state.pondVisible || state.roerdompVisible) return;

        // Roerdomp komt in garden container (achter vijver door z-index)
        const roerdomp = document.createElement('img');
        roerdomp.src = 'images/Roerdomp.png';
        roerdomp.className = 'garden-roerdomp';
        gardenEl.appendChild(roerdomp);

        state.roerdompVisible = true;
    }

    // ===== DIEREN =====
    function canAddAnimal() {
        return state.activeAnimals.length < CONFIG.maxAnimalsVisible;
    }

    function removeAnimal(el, duration) {
        setTimeout(() => {
            el.remove();
            state.activeAnimals = state.activeAnimals.filter(a => a.el !== el);
        }, duration);
    }

    // Egel
    function spawnHedgehog() {
        if (!canAddAnimal()) return;

        const img = document.createElement('img');
        img.src = 'images/egel.png';
        img.className = 'walking-hedgehog ' + (Math.random() > 0.5 ? 'walk-right' : 'walk-left');
        
        groundEl.appendChild(img);
        state.activeAnimals.push({ type: 'hedgehog', el: img });
        removeAnimal(img, 45000);
    }

    // Rups
    function spawnCaterpillar() {
        if (!canAddAnimal()) return;

        const img = document.createElement('img');
        img.src = 'images/Rups1.gif';
        img.className = 'crawling-caterpillar';
        
        groundEl.appendChild(img);
        state.activeAnimals.push({ type: 'caterpillar', el: img });
        removeAnimal(img, 60000);
    }

    // Vlinder
    function spawnButterfly() {
        if (!canAddAnimal()) return;

        const img = document.createElement('img');
        const isBlue = Math.random() > 0.5;
        img.src = isBlue ? 'images/Vlinder2.gif' : 'images/Vlinder.gif';
        
        // Blauwe vlinder krijgt soepele animatie, oranje de fladderende
        const goingRight = Math.random() > 0.5;
        if (isBlue) {
            // Blauwe: soepel, kan van/naar boven
            img.className = 'flying-butterfly ' + (goingRight ? 'flutter-right-smooth' : 'flutter-left-smooth');
            flyingEl.appendChild(img);
            state.activeAnimals.push({ type: 'butterfly', el: img });
            removeAnimal(img, 26000); // 25s animatie
        } else {
            // Oranje: fladderend
            img.className = 'flying-butterfly ' + (goingRight ? 'flutter-right' : 'flutter-left');
            flyingEl.appendChild(img);
            state.activeAnimals.push({ type: 'butterfly', el: img });
            removeAnimal(img, 19000); // 18s animatie
        }
    }

    // Lieveheersbeestje
    function spawnLadybug() {
        if (!canAddAnimal()) return;

        const img = document.createElement('img');
        img.src = 'images/Ladybug.gif';
        img.className = 'flying-ladybug';
        img.style.left = rand(20, 80) + '%';
        
        flyingEl.appendChild(img);
        state.activeAnimals.push({ type: 'ladybug', el: img });
        removeAnimal(img, 8000);
    }

    // Zwaluw
    function spawnSwallow() {
        if (!canAddAnimal()) return;

        const img = document.createElement('img');
        // Gebruik willekeurig een van de drie zwaluwen
        const swallows = ['images/Swallowflight.png', 'images/Swallowflight2.png', 'images/Swallowflight3.png'];
        img.src = swallows[Math.floor(Math.random() * swallows.length)];
        img.className = 'flying-swallow ' + (Math.random() > 0.5 ? 'swoop-right' : 'swoop-left');
        
        flyingEl.appendChild(img);
        state.activeAnimals.push({ type: 'swallow', el: img });
        removeAnimal(img, 5500); // 5s animatie + marge
    }

    // Random dier spawnen
    const ANIMAL_SPAWNERS = [
        { fn: spawnHedgehog, weight: 2 },
        { fn: spawnCaterpillar, weight: 1 },
        { fn: spawnButterfly, weight: 3 },
        { fn: spawnLadybug, weight: 2 },
        { fn: spawnSwallow, weight: 3 },
    ];

    function spawnRandomAnimal() {
        if (!canAddAnimal()) return;

        const total = ANIMAL_SPAWNERS.reduce((s, a) => s + a.weight, 0);
        let r = Math.random() * total;

        for (const animal of ANIMAL_SPAWNERS) {
            r -= animal.weight;
            if (r <= 0) {
                animal.fn();
                break;
            }
        }
    }

    // ===== CHOREOGRAFIE =====
    function startFreshBiotoop() {
        // Fase 1: Bloemen verschijnen geleidelijk
        let flowerCount = 0;
        
        // Eerste bloem snel
        setTimeout(addFlower, CONFIG.timing.startDelay);
        flowerCount++;

        // Rest van de bloemen
        const flowerTimer = setInterval(() => {
            addFlower();
            flowerCount++;
            if (flowerCount >= CONFIG.maxFlowers) {
                clearInterval(flowerTimer);
            }
        }, CONFIG.timing.flowerInterval);

        // Fase 2: Vijver
        setTimeout(showPond, CONFIG.timing.pondAppears);

        // Fase 3: Roerdomp
        setTimeout(showRoerdomp, CONFIG.timing.roerdompAppears);

        // Fase 4: Dieren beginnen - EERSTE IS EEN ZWALUW
        setTimeout(() => {
            spawnSwallow(); // Eerste dier is altijd een zwaluw
            
            // Regelmatig nieuwe dieren
            setInterval(() => {
                if (Math.random() > 0.25) {
                    spawnRandomAnimal();
                }
            }, CONFIG.timing.animalInterval);
        }, CONFIG.timing.animalStartDelay);

        // Fase 5: Bloemen wisselen (na 2 min)
        setTimeout(() => {
            setInterval(() => {
                // Soms een bloem verwijderen
                if (Math.random() > 0.6 && state.flowers.length > 5) {
                    removeRandomFlower();
                }
                // En een nieuwe toevoegen
                setTimeout(() => {
                    if (state.flowers.length < CONFIG.maxFlowers) {
                        addFlower();
                    }
                }, rand(2000, 6000));
            }, 15000);
        }, CONFIG.timing.totalFlowerTime);
    }

    function startInstantBiotoop() {
        // Direct alles tonen (na navigatie)
        FLOWER_POSITIONS.slice(0, 7).forEach((pos, i) => {
            const data = FLOWERS[i % FLOWERS.length];
            const img = document.createElement('img');
            img.src = data.src;
            img.className = `garden-flower ${data.size}${i % 2 ? ' mirrored' : ''}`;
            img.style.left = pos + '%';
            img.style.opacity = '1';
            img.style.transform = i % 2 ? 'scaleX(-1)' : 'none';
            gardenEl.appendChild(img);
            state.flowers.push({ el: img, pos, data });
        });

        showPond();
        setTimeout(showRoerdomp, 500);

        // Start dieren cyclus
        setTimeout(() => {
            setInterval(() => {
                if (Math.random() > 0.3) spawnRandomAnimal();
            }, CONFIG.timing.animalInterval);
        }, 3000);
    }

    // ===== NAVIGATIE =====
    document.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (link && link.href && !link.href.startsWith('javascript:')) {
            if (link.href.includes(window.location.hostname) || link.href.startsWith('/')) {
                sessionStorage.setItem(CONFIG.navKey, 'true');
            }
        }
    });

    // ===== INIT =====
    function init() {
        gardenEl = document.getElementById('headerGarden');
        groundEl = document.getElementById('headerAnimalsGround');
        flyingEl = document.getElementById('headerAnimalsFlying');

        if (!gardenEl) return;

        // Maak flying container als nodig
        if (!flyingEl) {
            flyingEl = document.createElement('div');
            flyingEl.id = 'headerAnimalsFlying';
            flyingEl.className = 'header-animals-flying';
            document.body.appendChild(flyingEl);
        }

        // Check navigatie
        const isNav = sessionStorage.getItem(CONFIG.navKey) === 'true';
        sessionStorage.removeItem(CONFIG.navKey);

        if (isNav) {
            startInstantBiotoop();
        } else {
            startFreshBiotoop();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
