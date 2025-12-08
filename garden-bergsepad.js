/**
 * Natuurrijk Ankeveen - Biotoop Bergse Pad
 * Wandeling door het landschap: ganzen, zeearend, rietkraag snoeien
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 1500,
            geeseFirst: 5000,
            geeseInterval: 35000,
            eagleAppears: 90000,
            reedGrowthStart: 2000,
            reedGrowthDuration: 20000,  // 20 sec groeiperiode
            reedCuttingStart: 25000,    // Na 25s begint snoeien
            reedCycleReset: 70000,      // Cyclus herhaalt na 70s
            biotoopReset: 480000
        }
    };

    let biotoopTimers = {};
    let flyingEl, reedsEl;
    let reedElements = [];
    let state = { biotoopActive: false };

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
    const TREE_POSITIONS = [
        { pos: 15, type: 0, survives: false },  // Iep links - wordt gesnoeid
        { pos: 50, type: 1, survives: true },   // Tree midden - blijft staan
        { pos: 85, type: 0, survives: false }   // Iep rechts - wordt gesnoeid
    ];
    
    // Welke posities mogen blijven staan na snoeien (minder survivors)
    const SURVIVOR_POSITIONS = [50]; // Alleen midden blijft staan
    
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
    
    function createTree(treeConfig, delay) {
        setTimeout(() => {
            console.log('createTree aangeroepen, reedsEl:', !!reedsEl, 'biotoopActive:', state.biotoopActive);
            if (!reedsEl || !state.biotoopActive) return;

            const tree = document.createElement('img');
            tree.src = TREE_TYPES[treeConfig.type].src;
            tree.className = 'garden-tree';
            tree.style.left = treeConfig.pos + '%';
            tree.style.height = TREE_TYPES[treeConfig.type].height + 'px';
            tree.dataset.position = treeConfig.pos;
            tree.dataset.survives = treeConfig.survives;

            console.log('Boom toegevoegd:', tree.src, 'op', treeConfig.pos + '%');
            reedsEl.appendChild(tree);
            treeElements.push({ element: tree, position: treeConfig.pos, survives: treeConfig.survives });

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
            createTree(treeConfig, index * 500);
        });

        // Start met 6 random riet plukjes (na de bomen)
        const initialPositions = shuffleArray(REED_POSITIONS).slice(0, 6);
        console.log('Riet plaatsen op posities:', initialPositions);
        
        initialPositions.forEach((pos, index) => {
            const type = REED_TYPES[rand(0, REED_TYPES.length - 1)];
            createReedClump(pos, type, 1500 + index * 300);
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
        console.log('startReedCutting aangeroepen');
        if (!state.biotoopActive) return;

        // Combineer riet en bomen, sorteer van links naar rechts
        const allElements = [
            ...reedElements.map(r => ({ ...r, isTree: false })),
            ...treeElements.map(t => ({ ...t, isTree: true }))
        ].sort((a, b) => a.position - b.position);

        let cutIndex = 0;
        const cutInterval = 350; // Sneller! 350ms tussen elke snit

        function cutNextElement() {
            if (!state.biotoopActive || cutIndex >= allElements.length) {
                // Snoeien klaar - filter de overgebleven elementen
                reedElements = reedElements.filter(r => {
                    const isSurvivor = SURVIVOR_POSITIONS.some(sp => Math.abs(r.position - sp) < 8);
                    return isSurvivor && r.element.parentNode;
                });
                
                treeElements = treeElements.filter(t => t.survives && t.element.parentNode);

                // Na een pauze, start nieuwe cyclus
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
                shouldSurvive = item.survives;
            } else {
                shouldSurvive = SURVIVOR_POSITIONS.some(sp => Math.abs(item.position - sp) < 8);
            }
            
            if (!shouldSurvive) {
                // Snoei dit element weg
                item.element.classList.add('cutting');
                setTimeout(() => {
                    if (item.element.parentNode) {
                        item.element.remove();
                    }
                }, 600);
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
        
        clearReeds();
    }

    function setup() {
        console.log('Bergse Pad biotoop setup gestart');
        
        flyingEl = document.getElementById('headerAnimalsFlying');
        console.log('flyingEl gevonden:', !!flyingEl);
        
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
        
        setTimeout(startBiotoop, CONFIG.timing.startDelay);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
