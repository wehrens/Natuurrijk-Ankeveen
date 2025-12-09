/**
 * Natuurrijk Ankeveen - Biotoop Bergse Pad
 * Wandeling door het landschap: ganzen, zeearend, rietkraag snoeien, wandelaars
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 1500,
            geeseFirst: 5000,
            geeseInterval: 35000,
            eagleAppears: 90000,
            reedGrowthStart: 1500,
            reedGrowthDuration: 15000,  // 15 sec groeiperiode
            reedCuttingStart: 18000,    // Na 18s begint snoeien
            reedCycleReset: 35000,      // Nog sneller! Cyclus herhaalt na 35s
            walkerFirst: 3000,          // Eerste wandelaar na 3s
            walkerInterval: 25000,      // Om de 25s een wandelaar
            biotoopReset: 480000
        }
    };

    let biotoopTimers = {};
    let flyingEl, reedsEl, gardenEl;
    let reedElements = [];
    let state = { biotoopActive: false };
    let cycleCount = 0; // Telt cycli voor wisselende survivors

    // Maria beeldje configuratie
    const MARIA = {
        src: 'images/Maria.png',
        position: 80,  // 4/5 van het pad = 80%
        height: 55     // Ongeveer halve meter schaal
    };

    // Bankje configuratie
    const BANKJE = {
        src: 'images/Bankje.png',
        position: 65,  // Links van Maria
        height: 40     // Passend bij wandelaars
    };

    // Riet en lisdodde types
    const REED_TYPES = [
        { src: 'images/Rietkraag.png', height: 85, overlap: true, bottomOffset: 0 },
        { src: 'images/Lisdodde.png', height: 70, overlap: false, bottomOffset: 0 },
        { src: 'images/Lisdodde2.png', height: 55, overlap: false, bottomOffset: -25 },  // Lager
        { src: 'images/Lisdodde3.png', height: 80, overlap: false, bottomOffset: -20 }   // Lager
    ];

    // Bomen - hoger dan riet
    const TREE_TYPES = [
        { src: 'images/Iep.png', height: 140 },
        { src: 'images/Tree.png', height: 140 }
    ];

    // Posities waar riet kan groeien (% van links)
    const REED_POSITIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
    
    // Vaste posities voor bomen (verspreid over het veld)
    // survives wordt dynamisch bepaald op basis van cycleCount
    const TREE_POSITIONS = [
        { pos: 15, type: 0 },  // Iep links
        { pos: 50, type: 1 },  // Tree midden
        { pos: 85, type: 0 }   // Iep rechts
    ];
    
    // Wisselende survivor posities per cyclus
    const SURVIVOR_SETS = [
        { reedPos: [30], treeIndex: 1 },  // Cyclus 0: midden riet + midden boom
        { reedPos: [70], treeIndex: 0 },  // Cyclus 1: rechts riet + linker boom
        { reedPos: [20], treeIndex: 2 },  // Cyclus 2: links riet + rechter boom
        { reedPos: [50], treeIndex: 1 },  // Cyclus 3: midden riet + midden boom
        { reedPos: [80], treeIndex: 0 },  // Cyclus 4: rechts riet + linker boom
    ];
    
    let treeElements = [];

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // ===== RIETKRAAG FUNCTIES =====
    
    function createTree(treeConfig, index, delay) {
        setTimeout(() => {
            console.log('createTree aangeroepen, reedsEl:', !!reedsEl, 'biotoopActive:', state.biotoopActive);
            if (!reedsEl || !state.biotoopActive) return;

            const tree = document.createElement('img');
            tree.src = TREE_TYPES[treeConfig.type].src;
            tree.className = 'garden-tree';
            tree.style.left = treeConfig.pos + '%';
            tree.style.height = TREE_TYPES[treeConfig.type].height + 'px';
            tree.dataset.position = treeConfig.pos;
            
            // Lisdodde krijgt lagere z-index zodat Maria ervoor staat
            if (tree.src.includes('Lisdodde')) {
                tree.style.zIndex = '110';
            }

            console.log('Boom toegevoegd:', tree.src, 'op', treeConfig.pos + '%');
            reedsEl.appendChild(tree);
            treeElements.push({ element: tree, position: treeConfig.pos, treeIndex: index });

            // Fade in
            requestAnimationFrame(() => tree.classList.add('visible'));
        }, delay);
    }

    function createReedClump(position, type, delay) {
        setTimeout(() => {
            if (!reedsEl || !state.biotoopActive) return;

            const clump = document.createElement('div');
            clump.className = 'reed-clump';
            clump.style.left = position + '%';
            clump.dataset.position = position;
            
            // Pas bottom offset toe indien aanwezig
            if (type.bottomOffset !== undefined && type.bottomOffset !== 0) {
                clump.style.bottom = (3 + type.bottomOffset) + 'px';
            }

            // Voor rietkraag: maak 3 overlappende images voor volume
            const numImages = type.overlap ? 3 : 1;
            
            for (let i = 0; i < numImages; i++) {
                const img = document.createElement('img');
                img.src = type.src;
                img.className = 'reed-plant';
                img.style.height = (type.height + rand(-10, 10)) + 'px';
                
                if (type.overlap && i > 0) {
                    // Kleine offset voor overlapping
                    img.style.marginLeft = (-20 + rand(-5, 5)) + 'px';
                    if (i === 1) img.style.transform = 'scaleX(-1)';
                }
                
                clump.appendChild(img);
            }

            reedsEl.appendChild(clump);
            reedElements.push({ element: clump, position: position });

            // Fade in
            requestAnimationFrame(() => clump.classList.add('visible'));
        }, delay);
    }

    function growInitialReeds() {
        console.log('growInitialReeds aangeroepen, reedsEl:', !!reedsEl, 'biotoopActive:', state.biotoopActive);
        if (!reedsEl || !state.biotoopActive) return;

        // Plaats eerst de bomen (met kleine vertraging)
        console.log('Bomen plaatsen:', TREE_POSITIONS.length);
        TREE_POSITIONS.forEach((treeConfig, index) => {
            createTree(treeConfig, index, index * 400);
        });

        // Start met 6 random riet plukjes (na de bomen)
        const initialPositions = shuffleArray(REED_POSITIONS).slice(0, 6);
        console.log('Riet plaatsen op posities:', initialPositions);
        
        initialPositions.forEach((pos, index) => {
            const type = REED_TYPES[rand(0, REED_TYPES.length - 1)];
            createReedClump(pos, type, 1200 + index * 250);
        });
    }

    function growMoreReeds() {
        if (!reedsEl || !state.biotoopActive) return;

        // Voeg over 25 seconden meer riet toe
        const usedPositions = reedElements.map(r => r.position);
        const availablePositions = REED_POSITIONS.filter(p => !usedPositions.includes(p));
        const newPositions = shuffleArray(availablePositions).slice(0, 10);

        newPositions.forEach((pos, index) => {
            const type = REED_TYPES[rand(0, REED_TYPES.length - 1)];
            const delay = rand(500, CONFIG.timing.reedGrowthDuration - 2000);
            createReedClump(pos, type, delay);
        });
    }

    function startReedCutting() {
        console.log('startReedCutting aangeroepen, cyclus:', cycleCount);
        if (!state.biotoopActive) return;

        // Haal survivor set voor deze cyclus
        const currentSurvivorSet = SURVIVOR_SETS[cycleCount % SURVIVOR_SETS.length];
        const survivorReedPositions = currentSurvivorSet.reedPos;
        const survivorTreeIndex = currentSurvivorSet.treeIndex;

        // Combineer riet en bomen, sorteer van links naar rechts
        const allElements = [
            ...reedElements.map(r => ({ ...r, isTree: false })),
            ...treeElements.map(t => ({ ...t, isTree: true }))
        ].sort((a, b) => a.position - b.position);

        let cutIndex = 0;
        const cutInterval = 300; // Nog sneller! 300ms tussen elke snit

        function cutNextElement() {
            if (!state.biotoopActive || cutIndex >= allElements.length) {
                // Snoeien klaar - verhoog cycleCount voor volgende ronde
                cycleCount++;
                
                // Filter overgebleven elementen
                reedElements = reedElements.filter(r => {
                    const isSurvivor = survivorReedPositions.some(sp => Math.abs(r.position - sp) < 12);
                    return isSurvivor && r.element.parentNode;
                });
                
                treeElements = treeElements.filter(t => t.treeIndex === survivorTreeIndex && t.element.parentNode);

                // Na een korte pauze, start nieuwe cyclus
                biotoopTimers.reedCycle = setTimeout(() => {
                    clearReeds();
                    startReedCycle();
                }, CONFIG.timing.reedCycleReset - CONFIG.timing.reedCuttingStart);
                return;
            }

            const item = allElements[cutIndex];
            
            // Check of dit element mag blijven staan
            let shouldSurvive = false;
            if (item.isTree) {
                shouldSurvive = (item.treeIndex === survivorTreeIndex);
            } else {
                shouldSurvive = survivorReedPositions.some(sp => Math.abs(item.position - sp) < 12);
            }
            
            if (!shouldSurvive) {
                // Snoei dit element weg
                item.element.classList.add('cutting');
                setTimeout(() => {
                    if (item.element.parentNode) {
                        item.element.remove();
                    }
                }, 500);
            }

            cutIndex++;
            
            if (cutIndex < allElements.length) {
                setTimeout(cutNextElement, cutInterval);
            } else {
                // Roep nog een keer aan om cleanup te doen
                setTimeout(cutNextElement, cutInterval);
            }
        }

        cutNextElement();
    }

    function clearReeds() {
        reedElements.forEach(r => {
            if (r.element.parentNode) r.element.remove();
        });
        reedElements = [];
        
        treeElements.forEach(t => {
            if (t.element.parentNode) t.element.remove();
        });
        treeElements = [];
    }

    function startReedCycle() {
        console.log('startReedCycle aangeroepen, biotoopActive:', state.biotoopActive);
        if (!state.biotoopActive) return;

        // Fase 1: Initiële riet
        growInitialReeds();

        // Fase 2: Meer riet laten groeien
        biotoopTimers.reedGrowth = setTimeout(growMoreReeds, CONFIG.timing.reedGrowthStart);

        // Fase 3: Begin met snoeien
        biotoopTimers.reedCutting = setTimeout(startReedCutting, CONFIG.timing.reedCuttingStart);
    }

    // ===== VOGEL FUNCTIES =====

    function spawnSingleGoose(delay) {
        setTimeout(() => {
            if (!flyingEl) return;
            const img = document.createElement('img');
            img.src = 'images/Goose.gif';
            img.className = 'flying-goose';
            img.style.animationDuration = (9 + Math.random() * 2) + 's';
            flyingEl.appendChild(img);
            setTimeout(() => { if (img.parentNode) img.remove(); }, 15000);
        }, delay);
    }

    function spawnGeese() {
        if (!flyingEl) return;

        if (Math.random() > 0.6) {
            const img = document.createElement('img');
            img.src = 'images/Geese.gif';
            img.className = 'flying-geese';
            flyingEl.appendChild(img);
            setTimeout(() => { if (img.parentNode) img.remove(); }, 15000);
        } else {
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

    // ===== MARIA BEELDJE =====
    
    function placeMaria() {
        if (!gardenEl) return;
        
        const maria = document.createElement('img');
        maria.src = MARIA.src;
        maria.className = 'maria-statue';
        maria.style.left = MARIA.position + '%';
        maria.style.height = MARIA.height + 'px';
        
        gardenEl.appendChild(maria);
    }

    // ===== BANKJE =====
    
    function placeBankje() {
        if (!gardenEl) return;
        
        const bankje = document.createElement('img');
        bankje.src = BANKJE.src;
        bankje.className = 'bankje';
        bankje.style.left = BANKJE.position + '%';
        bankje.style.height = BANKJE.height + 'px';
        
        gardenEl.appendChild(bankje);
    }

    // ===== WANDELAARS =====
    
    // Vaste volgorde: vrouw rechts, man rechts, vrouw links, man links
    const WALKER_SEQUENCE = [
        { src: 'images/Walkinggirl.gif', direction: 'right', mirror: false },
        { src: 'images/WalkingGuy2.gif', direction: 'right', mirror: false },
        { src: 'images/Walkinggirl.gif', direction: 'left', mirror: true },
        { src: 'images/WalkingGuy2.gif', direction: 'left', mirror: true }
    ];
    
    let walkerSequenceIndex = 0;
    let walkerActive = false;
    
    function spawnWalker() {
        if (!gardenEl || walkerActive) return;
        
        walkerActive = true;
        
        const walker = WALKER_SEQUENCE[walkerSequenceIndex];
        walkerSequenceIndex = (walkerSequenceIndex + 1) % WALKER_SEQUENCE.length;
        
        const img = document.createElement('img');
        img.src = walker.src;
        img.className = 'walking-person';
        img.style.opacity = '0';
        
        // Spiegel indien nodig (voor links lopend)
        if (walker.mirror) {
            img.style.transform = 'scaleX(-1)';
        }
        
        // Start positie en richting
        if (walker.direction === 'right') {
            img.style.left = '-80px';
            img.style.transition = 'left 20s linear, opacity 0.5s';
            gardenEl.appendChild(img);
            setTimeout(() => { img.style.opacity = '1'; }, 50);
            setTimeout(() => { img.style.left = '110%'; }, 100);
        } else {
            img.style.left = 'calc(100% + 80px)';
            img.style.transition = 'left 20s linear, opacity 0.5s';
            gardenEl.appendChild(img);
            setTimeout(() => { img.style.opacity = '1'; }, 50);
            setTimeout(() => { img.style.left = '-100px'; }, 100);
        }
        
        // Fade out
        setTimeout(() => { img.style.opacity = '0'; }, 19000);
        
        // Verwijder en markeer als niet-actief
        setTimeout(() => { 
            if (img.parentNode) img.remove();
            walkerActive = false;
        }, 21000);
    }

    // ===== BIOTOOP LIFECYCLE =====

    function startBiotoop() {
        console.log('startBiotoop aangeroepen');
        state.biotoopActive = true;

        // Rietkraag cyclus starten
        startReedCycle();

        // Ganzen
        biotoopTimers.geese = setTimeout(() => {
            spawnGeese();
            biotoopTimers.geeseInterval = setInterval(() => {
                if (Math.random() > 0.25) spawnGeese();
            }, CONFIG.timing.geeseInterval);
        }, CONFIG.timing.geeseFirst);

        // Zeearend
        biotoopTimers.eagle = setTimeout(spawnEagle, CONFIG.timing.eagleAppears);

        // Wandelaars
        biotoopTimers.walker = setTimeout(() => {
            spawnWalker();
            biotoopTimers.walkerInterval = setInterval(() => {
                if (Math.random() > 0.3) spawnWalker(); // 70% kans
            }, CONFIG.timing.walkerInterval);
        }, CONFIG.timing.walkerFirst);

        // Reset
        biotoopTimers.reset = setTimeout(() => {
            clearBiotoop();
            startBiotoop();
        }, CONFIG.timing.biotoopReset);
    }

    function clearBiotoop() {
        state.biotoopActive = false;
        Object.values(biotoopTimers).forEach(t => { clearTimeout(t); clearInterval(t); });
        
        const flyEl = document.getElementById('headerAnimalsFlying');
        if (flyEl) flyEl.innerHTML = '';
        
        // Verwijder wandelaars
        if (gardenEl) {
            gardenEl.querySelectorAll('.walking-person').forEach(w => w.remove());
        }
        
        clearReeds();
    }

    function setup() {
        console.log('Bergse Pad biotoop setup gestart');
        
        flyingEl = document.getElementById('headerAnimalsFlying');
        console.log('flyingEl gevonden:', !!flyingEl);
        
        gardenEl = document.getElementById('headerGarden');
        console.log('gardenEl gevonden:', !!gardenEl);
        
        // Gebruik headerReeds als die bestaat, anders headerGarden
        reedsEl = document.getElementById('headerReeds');
        console.log('headerReeds gevonden:', !!reedsEl);
        
        if (!reedsEl) {
            reedsEl = document.getElementById('headerGarden');
            console.log('headerGarden als fallback:', !!reedsEl);
        }
        
        // Als er nog steeds geen container is, maak er een aan
        if (!reedsEl) {
            const nav = document.querySelector('nav');
            console.log('nav gevonden:', !!nav);
            if (nav) {
                reedsEl = document.createElement('div');
                reedsEl.id = 'headerReeds';
                reedsEl.className = 'header-reeds';
                nav.parentNode.insertBefore(reedsEl, nav.nextSibling);
                console.log('headerReeds aangemaakt');
            }
        }
        
        console.log('reedsEl final:', reedsEl);
        
        // Plaats Maria beeldje en bankje direct - nog voor de biotoop start
        placeMaria();
        placeBankje();
        
        setTimeout(startBiotoop, CONFIG.timing.startDelay);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
