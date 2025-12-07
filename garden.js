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
            otterAppears: 140000,       // Otter na 140s (na roerdomp)
            otterInterval: 90000,       // Otter komt elke 90s terug (zeldzaam!)
            kingfisherAppears: 60000,   // Ijsvogel na 60s (na vijver)
            kingfisherInterval: 45000,  // Ijsvogel komt elke 45s terug
            animalStartDelay: 4000,     // Eerste dier al na 4s!
            animalInterval: 8000,       // Check elke 8s voor nieuw dier
            biotoopReset: 480000,       // 8 minuten = 480000ms, dan reset
            roerdompFlipInterval: 25000, // Roerdomp kijkt elke 25s andere kant
        },
        maxAnimalsVisible: 5,
        maxFlowers: 10,
        navKey: 'natuurrijk_navigating'
    };

    // Timers opslaan zodat we ze kunnen clearen
    let biotoopTimers = {
        flowers: null,
        pond: null,
        roerdomp: null,
        otter: null,
        otterInterval: null,
        kingfisher: null,
        kingfisherInterval: null,
        animals: null,
        flowerCycle: null,
        reset: null,
        roerdompFlip: null
    };

    // ===== BLOEMEN DATA =====
    // Meerdere sizes per bloem type voor variatie
    const FLOWERS = [
        // Klaproos variaties
        { src: 'images/Klaproos.png', size: 'size-sm' },
        { src: 'images/Klaproos.png', size: 'size-md' },
        { src: 'images/Klaprozen2.png', size: 'size-sm' },
        { src: 'images/Klaprozen2.png', size: 'size-md' },
        { src: 'images/Klaprozen.png', size: 'size-sm' },
        { src: 'images/Klaprozen.png', size: 'size-md' },
        // Vingerhoedskruid (Digitalis) variaties
        { src: 'images/Digitalis.png', size: 'size-md' },
        { src: 'images/Digitalis.png', size: 'size-lg' },
        // Ridderspoor variaties
        { src: 'images/Ridderspoor.png', size: 'size-md' },
        { src: 'images/Ridderspoor.png', size: 'size-lg' },
        { src: 'images/Ridderspoor2.png', size: 'size-sm' },
        { src: 'images/Ridderspoor2.png', size: 'size-md' },
        // Andere bloemen
        { src: 'images/Gelelis.png', size: 'size-sm' },
        { src: 'images/Gelelis.png', size: 'size-md' },
        { src: 'images/Veldoeket.png', size: 'size-md' },
        { src: 'images/Veldoeket.png', size: 'size-lg' },
        { src: 'images/Lisdodde2.png', size: 'size-sm' },
    ];

    // Bloem posities (vermijd vijver zone 70-85%)
    const FLOWER_POSITIONS = [3, 9, 16, 24, 32, 41, 50, 59, 88, 95];

    // ===== STATE =====
    let state = {
        flowers: [],
        pondVisible: false,
        roerdompVisible: false,
        roerdompMirrored: false,
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

        // Lisdodde links van vijver (in garden container, over het gras)
        setTimeout(() => {
            const left = document.createElement('img');
            left.src = 'images/Lisdodde.png';
            left.className = 'garden-lisdodde size-lg';
            left.style.left = '69%';
            gardenEl.appendChild(left);
            requestAnimationFrame(() => left.classList.add('blooming'));
        }, 1500);

        // Tweede lisdodde - rechts van de eerste (roerdomp komt hier tussenin)
        setTimeout(() => {
            const second = document.createElement('img');
            second.src = 'images/Lisdodde.png';
            second.className = 'garden-lisdodde size-md mirrored';
            second.style.left = '76%';
            gardenEl.appendChild(second);
            requestAnimationFrame(() => second.classList.add('blooming'));
        }, 2500);

        // Lisdodde rechts van vijver
        setTimeout(() => {
            const right = document.createElement('img');
            right.src = 'images/Lisdodde3.png';
            right.className = 'garden-lisdodde size-md mirrored';
            right.style.left = '84%';
            gardenEl.appendChild(right);
            requestAnimationFrame(() => right.classList.add('blooming'));
        }, 3000);

        state.pondVisible = true;
    }

    function showRoerdomp() {
        if (!state.pondVisible || state.roerdompVisible) return;

        createRoerdomp();
        state.roerdompVisible = true;

        // Start roerdomp flip timer
        startRoerdompFlip();
    }

    function createRoerdomp() {
        // Verwijder bestaande roerdomp
        const existing = document.getElementById('roerdomp');
        if (existing) existing.remove();

        // Roerdomp komt in garden container (achter vijver door z-index)
        const roerdomp = document.createElement('img');
        roerdomp.src = 'images/Roerdomp.png';
        roerdomp.id = 'roerdomp';
        
        // 50% kans op gespiegeld
        const isMirrored = Math.random() > 0.5;
        state.roerdompMirrored = isMirrored;
        roerdomp.className = 'garden-roerdomp moving' + (isMirrored ? ' mirrored' : '');
        
        gardenEl.appendChild(roerdomp);
    }

    // Roerdomp draait af en toe om
    function startRoerdompFlip() {
        biotoopTimers.roerdompFlip = setInterval(() => {
            if (state.roerdompVisible) {
                // Toggle orientation
                state.roerdompMirrored = !state.roerdompMirrored;
                
                // Verwijder oude en maak nieuwe met andere richting
                const existing = document.getElementById('roerdomp');
                if (existing) {
                    existing.remove();
                    
                    const roerdomp = document.createElement('img');
                    roerdomp.src = 'images/Roerdomp.png';
                    roerdomp.id = 'roerdomp';
                    roerdomp.className = 'garden-roerdomp moving' + (state.roerdompMirrored ? ' mirrored' : '');
                    roerdomp.style.opacity = '1'; // Skip fade-in
                    gardenEl.appendChild(roerdomp);
                }
            }
        }, CONFIG.timing.roerdompFlipInterval);
    }

    // ===== OTTER =====
    function spawnOtter() {
        // Otter loopt in de ground container (z-index 1025, VOOR de nav)
        if (!groundEl) return;
        
        const img = document.createElement('img');
        img.src = 'images/Otter.gif';
        img.className = 'swimming-otter';
        
        groundEl.appendChild(img);
        
        // Verwijder na animatie (20s + marge)
        setTimeout(() => {
            if (img.parentNode) img.remove();
        }, 21000);
    }

    function startOtterCycle() {
        // Eerste otter
        spawnOtter();
        
        // Daarna elke 90s een kans op otter (50% kans)
        biotoopTimers.otterInterval = setInterval(() => {
            if (Math.random() > 0.5) {
                spawnOtter();
            }
        }, CONFIG.timing.otterInterval);
    }

    function startKingfisherCycle() {
        // Eerste ijsvogel
        spawnKingfisher();
        
        // Daarna elke 45s een kans op ijsvogel (60% kans)
        biotoopTimers.kingfisherInterval = setInterval(() => {
            if (Math.random() > 0.4) {
                spawnKingfisher();
            }
        }, CONFIG.timing.kingfisherInterval);
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

    // Egel - kan normaal lopen of zich ingraven
    function spawnHedgehog() {
        if (!canAddAnimal()) return;

        const img = document.createElement('img');
        img.src = 'images/egel.png';
        
        // Random hoogte variatie (25px - 35px) voor meer natuurlijke look
        const height = 25 + Math.random() * 10;
        img.style.height = height + 'px';
        
        // Kleinere egels lager positioneren (minder boven gras)
        // 30px = -15px top (standaard), 25px = -12px, 35px = -18px
        const topPos = -Math.round(height / 2);
        img.style.top = topPos + 'px';
        
        // 25% kans dat egel zich ingraaft
        const willBurrow = Math.random() < 0.25;
        
        if (willBurrow) {
            img.className = 'walking-hedgehog burrow';
            groundEl.appendChild(img);
            state.activeAnimals.push({ type: 'hedgehog', el: img });
            removeAnimal(img, 20000);
        } else {
            img.className = 'walking-hedgehog ' + (Math.random() > 0.5 ? 'walk-right' : 'walk-left');
            groundEl.appendChild(img);
            state.activeAnimals.push({ type: 'hedgehog', el: img });
            removeAnimal(img, 45000);
        }
    }

    // Rups - kan normaal kruipen of zich ingraven (LANGZAMER)
    function spawnCaterpillar() {
        if (!canAddAnimal()) return;

        const img = document.createElement('img');
        img.src = 'images/Rups1.gif';
        
        // 30% kans dat rups zich ingraaft
        const willBurrow = Math.random() < 0.3;
        
        if (willBurrow) {
            img.className = 'crawling-caterpillar crawl-burrow';
            groundEl.appendChild(img);
            state.activeAnimals.push({ type: 'caterpillar', el: img });
            removeAnimal(img, 50000); // 50s animatie
        } else {
            img.className = 'crawling-caterpillar crawl-normal';
            groundEl.appendChild(img);
            state.activeAnimals.push({ type: 'caterpillar', el: img });
            removeAnimal(img, 90000); // 90s animatie
        }
    }

    // Vlinder
    function spawnButterfly() {
        if (!canAddAnimal()) return;

        const img = document.createElement('img');
        const isBlue = Math.random() > 0.5;
        img.src = isBlue ? 'images/Vlinder2.gif' : 'images/Vlinder.gif';
        
        // Blauwe vlinder krijgt rustende animatie (stopt 2x op bloem), oranje de fladderende
        const goingRight = Math.random() > 0.5;
        if (isBlue) {
            // Blauwe: stopt 2x om te rusten
            img.className = 'flying-butterfly ' + (goingRight ? 'flutter-right-smooth' : 'flutter-left-smooth');
            flyingEl.appendChild(img);
            state.activeAnimals.push({ type: 'butterfly', el: img });
            removeAnimal(img, 29000); // 28s animatie
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

    // Ijsvogel - komt van rechts, bidt, duikt, vliegt gespiegeld terug naar rechts
    function spawnKingfisher() {
        if (!flyingEl) return;
        
        const img = document.createElement('img');
        img.src = 'images/Kingfisher.gif';
        img.className = 'flying-kingfisher';
        
        flyingEl.appendChild(img);
        
        // Verwijder na animatie (5s + marge)
        setTimeout(() => {
            if (img.parentNode) img.remove();
        }, 6000);
    }

    // Zwaluw - correcte oriëntatie per afbeelding, soms omhoog uit beeld
    // Swallowflight.png → kop naar RECHTS (vliegt naar rechts in origineel)
    // Swallowflight2.png → kop naar LINKS (vliegt naar links in origineel)
    // Swallowflight3.png → kop naar LINKS (vliegt naar links in origineel)
    function spawnSwallow(forceDirection, delayMs) {
        const spawn = () => {
            // Zwaluwen zijn snel, tel ze apart
            const nonSwallowAnimals = state.activeAnimals.filter(a => a.type !== 'swallow').length;
            if (nonSwallowAnimals >= 3) return false;

            const img = document.createElement('img');
            
            // Kies afbeelding met correcte oriëntatie
            const swallowOptions = [
                { src: 'images/Swallowflight.png', facesRight: true },   // Kijkt naar RECHTS
                { src: 'images/Swallowflight2.png', facesRight: false }, // Kijkt naar LINKS
                { src: 'images/Swallowflight3.png', facesRight: false }  // Kijkt naar LINKS
            ];
            const chosen = swallowOptions[Math.floor(Math.random() * swallowOptions.length)];
            img.src = chosen.src;
            
            // Bepaal vliegrichting
            const fliesRight = forceDirection !== undefined ? forceDirection : Math.random() > 0.5;
            
            // 30% kans om omhoog uit beeld te vliegen
            const fliesUp = Math.random() < 0.3;
            
            // Spiegeling nodig als richting niet overeenkomt met oriëntatie
            const needsMirror = chosen.facesRight !== fliesRight;
            
            let className = 'flying-swallow ';
            if (fliesUp) {
                // Omhoog uit beeld
                if (fliesRight) {
                    className += needsMirror ? 'fly-right-up-mirrored' : 'fly-right-up-normal';
                } else {
                    className += needsMirror ? 'fly-left-up-mirrored' : 'fly-left-up-normal';
                }
            } else {
                // Normale U-baan
                if (fliesRight) {
                    className += needsMirror ? 'fly-right-mirrored' : 'fly-right-normal';
                } else {
                    className += needsMirror ? 'fly-left-mirrored' : 'fly-left-normal';
                }
            }
            
            img.className = className;
            flyingEl.appendChild(img);
            state.activeAnimals.push({ type: 'swallow', el: img });
            removeAnimal(img, fliesUp ? 5500 : 6500);
            return true;
        };
        
        if (delayMs) {
            setTimeout(spawn, delayMs);
        } else {
            return spawn();
        }
    }

    // Groep zwaluwen spawnen (2-3 achter elkaar, zelfde richting)
    function spawnSwallowGroup() {
        const count = Math.random() > 0.4 ? 3 : 2;
        const direction = Math.random() > 0.5;
        
        for (let i = 0; i < count; i++) {
            spawnSwallow(direction, i * 700);
        }
    }

    // Random dier spawnen
    const ANIMAL_SPAWNERS = [
        { fn: spawnHedgehog, weight: 2 },
        { fn: spawnCaterpillar, weight: 1 },
        { fn: spawnButterfly, weight: 3 },
        { fn: spawnLadybug, weight: 2 },
        { fn: () => spawnSwallow(), weight: 4 },      // Enkele zwaluw - vaker
        { fn: spawnSwallowGroup, weight: 2 },          // Groep zwaluwen
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
    // Wis de biotoop volledig
    function clearBiotoop() {
        // Stop alle timers
        Object.keys(biotoopTimers).forEach(key => {
            if (biotoopTimers[key]) {
                clearInterval(biotoopTimers[key]);
                clearTimeout(biotoopTimers[key]);
                biotoopTimers[key] = null;
            }
        });

        // Verwijder alle elementen
        if (gardenEl) gardenEl.innerHTML = '';
        if (groundEl) groundEl.innerHTML = '';
        if (flyingEl) flyingEl.innerHTML = '';
        
        // Verwijder vijver container inhoud
        const pondEl = document.getElementById('headerPond');
        if (pondEl) pondEl.innerHTML = '';

        // Reset state
        state = {
            flowers: [],
            pondVisible: false,
            roerdompVisible: false,
            roerdompMirrored: false,
            activeAnimals: []
        };
    }

    function startFreshBiotoop() {
        // Fase 1: Bloemen verschijnen geleidelijk
        let flowerCount = 0;
        
        // Eerste bloem snel
        setTimeout(addFlower, CONFIG.timing.startDelay);
        flowerCount++;

        // Rest van de bloemen
        biotoopTimers.flowers = setInterval(() => {
            addFlower();
            flowerCount++;
            if (flowerCount >= CONFIG.maxFlowers) {
                clearInterval(biotoopTimers.flowers);
            }
        }, CONFIG.timing.flowerInterval);

        // Fase 2: Vijver
        biotoopTimers.pond = setTimeout(showPond, CONFIG.timing.pondAppears);

        // Fase 3: Roerdomp
        biotoopTimers.roerdomp = setTimeout(showRoerdomp, CONFIG.timing.roerdompAppears);

        // Fase 3b: Otter (na roerdomp)
        biotoopTimers.otter = setTimeout(startOtterCycle, CONFIG.timing.otterAppears);

        // Fase 3c: Ijsvogel (na vijver)
        biotoopTimers.kingfisher = setTimeout(startKingfisherCycle, CONFIG.timing.kingfisherAppears);

        // Fase 4: Dieren beginnen - START MET ZWALUW
        biotoopTimers.animals = setTimeout(() => {
            spawnSwallow(true); // Eerste zwaluw naar rechts
            
            // Na 3s een groepje zwaluwen
            setTimeout(() => {
                spawnSwallowGroup();
            }, 3000);
            
            // Regelmatig nieuwe dieren
            setInterval(() => {
                if (Math.random() > 0.2) {
                    spawnRandomAnimal();
                }
            }, CONFIG.timing.animalInterval);
        }, CONFIG.timing.animalStartDelay);

        // Fase 5: Bloemen wisselen (na 2 min)
        setTimeout(() => {
            biotoopTimers.flowerCycle = setInterval(() => {
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

        // Fase 6: Reset na 8 minuten
        biotoopTimers.reset = setTimeout(() => {
            clearBiotoop();
            // Wacht even en begin opnieuw
            setTimeout(() => {
                startFreshBiotoop();
            }, 500);
        }, CONFIG.timing.biotoopReset);
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
        
        // Start otter cyclus na 30s
        biotoopTimers.otter = setTimeout(startOtterCycle, 30000);

        // Start ijsvogel cyclus na 15s
        biotoopTimers.kingfisher = setTimeout(startKingfisherCycle, 15000);

        // Start dieren cyclus
        setTimeout(() => {
            setInterval(() => {
                if (Math.random() > 0.3) spawnRandomAnimal();
            }, CONFIG.timing.animalInterval);
        }, 3000);

        // Reset na 8 minuten ook bij instant
        biotoopTimers.reset = setTimeout(() => {
            clearBiotoop();
            setTimeout(() => {
                startFreshBiotoop();
            }, 500);
        }, CONFIG.timing.biotoopReset);
    }

    // ===== NAVIGATIE =====
    document.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (link && link.href && !link.href.startsWith('javascript:')) {
            // Negeer anchor-only links op dezelfde pagina
            const isAnchorOnly = link.getAttribute('href').startsWith('#');
            if (!isAnchorOnly && (link.href.includes(window.location.hostname) || link.href.startsWith('/'))) {
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
