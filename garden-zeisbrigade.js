/**
 * Natuurrijk Ankeveen - Biotoop Zeisbrigade
 * Hooiland sfeer: veel bloemen, vlinders, rustig zomers gevoel
 */
(function() {
    'use strict';

    const CONFIG = {
        timing: {
            startDelay: 1500,
            flowerInterval: 2500,
            butterflyFirst: 6000,
            butterflyInterval: 10000,
            ladybugFirst: 15000,
            ladybugInterval: 20000,
            biotoopReset: 480000
        }
    };

    let state = { flowers: [], activeAnimals: [], biotoopActive: false };
    let biotoopTimers = {};
    let gardenEl, groundEl, flyingEl;

    // ALLE bloemen voor hooiland effect
    const FLOWERS = [
        { src: 'images/Klaproos.png', size: 'size-xs' },
        { src: 'images/Klaproos.png', size: 'size-sm' },
        { src: 'images/Klaproos.png', size: 'size-md' },
        { src: 'images/Klaprozen2.png', size: 'size-xs' },
        { src: 'images/Klaprozen2.png', size: 'size-sm' },
        { src: 'images/Klaprozen2.png', size: 'size-md' },
        { src: 'images/Klaprozen.png', size: 'size-xs' },
        { src: 'images/Klaprozen.png', size: 'size-sm' },
        { src: 'images/Ridderspoor.png', size: 'size-sm' },
        { src: 'images/Ridderspoor.png', size: 'size-md' },
        { src: 'images/Ridderspoor.png', size: 'size-lg' },
        { src: 'images/Ridderspoor2.png', size: 'size-xs' },
        { src: 'images/Ridderspoor2.png', size: 'size-sm' },
        { src: 'images/Ridderspoor2.png', size: 'size-md' },
        { src: 'images/Digitalis.png', size: 'size-sm' },
        { src: 'images/Digitalis.png', size: 'size-md' },
        { src: 'images/Digitalis.png', size: 'size-lg' },
        { src: 'images/Veldoeket.png', size: 'size-sm' },
        { src: 'images/Veldoeket.png', size: 'size-md' },
        { src: 'images/Veldoeket.png', size: 'size-lg' },
        { src: 'images/Gelelis.png', size: 'size-sm', extraClass: 'lower' },
        { src: 'images/Gelelis.png', size: 'size-md', extraClass: 'lower' },
        { src: 'images/Lisdodde2.png', size: 'size-sm' },
    ];

    // Meer posities voor vol hooiland
    const FLOWER_POSITIONS = [3, 8, 14, 20, 27, 34, 42, 50, 58, 66, 74, 82, 89, 95];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function addFlower() {
        if (!gardenEl || state.flowers.length >= 16) return;

        const usedPositions = state.flowers.map(f => f.pos);
        const free = FLOWER_POSITIONS.filter(p => !usedPositions.includes(p));
        if (free.length === 0) return;

        const pos = pick(free);
        const data = pick(FLOWERS);
        const mirrored = Math.random() > 0.5;

        const img = document.createElement('img');
        img.src = data.src;
        img.className = `garden-flower ${data.size}${mirrored ? ' mirrored' : ''}${data.extraClass ? ' ' + data.extraClass : ''}`;
        img.style.left = pos + '%';

        gardenEl.appendChild(img);
        requestAnimationFrame(() => img.classList.add('blooming'));

        state.flowers.push({ el: img, pos, data });
    }

    function spawnButterfly() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        const isBlue = Math.random() > 0.5;
        img.src = isBlue ? 'images/Vlinder2.gif' : 'images/Vlinder.gif';
        
        const goingRight = Math.random() > 0.5;
        if (isBlue) {
            img.className = 'flying-butterfly ' + (goingRight ? 'flutter-right-smooth' : 'flutter-left-smooth');
        } else {
            img.className = 'flying-butterfly ' + (goingRight ? 'flutter-right' : 'flutter-left');
        }

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 30000);
    }

    function spawnLadybug() {
        if (!flyingEl) return;

        const img = document.createElement('img');
        img.src = 'images/Ladybug.gif';
        img.className = 'flying-ladybug';
        img.style.left = (20 + Math.random() * 60) + '%';

        flyingEl.appendChild(img);
        setTimeout(() => { if (img.parentNode) img.remove(); }, 8000);
    }

    let currentScythe = null;
    let scytheMirrored = false;
    
    // Wisselende posities voor maaisel hoopjes
    const MAAISEL_POSITIONS = [20, 35, 50, 65, 80];
    let maaiselPositionIndex = 0;
    
    // Wisselende posities voor de zeis
    const ZEIS_POSITIONS = [15, 30, 45, 60, 75];
    let zeisPositionIndex = 0;

    function startMaaiselZeisCyclus() {
        if (!groundEl || !state.biotoopActive) return;

        function runCycle() {
            if (!state.biotoopActive) return;
            
            // Kies positie voor dit hoopje
            const maaiselLeft = MAAISEL_POSITIONS[maaiselPositionIndex];
            maaiselPositionIndex = (maaiselPositionIndex + 1) % MAAISEL_POSITIONS.length;
            
            // Kies positie voor de zeis
            const zeisLeft = ZEIS_POSITIONS[zeisPositionIndex];
            zeisPositionIndex = (zeisPositionIndex + 1) % ZEIS_POSITIONS.length;

            // Stap 1: Zeis verschijnt
            currentScythe = document.createElement('img');
            currentScythe.src = scytheMirrored ? 'images/Zeis2.png' : 'images/Zeis.png';
            currentScythe.className = scytheMirrored ? 'ground-scythe ground-scythe-2' : 'ground-scythe';
            currentScythe.style.left = zeisLeft + '%';
            groundEl.appendChild(currentScythe);
            requestAnimationFrame(() => currentScythe.classList.add('visible'));

            // Stap 2: Na 3 sec, vers maaisel (Maaisel2) verschijnt
            setTimeout(() => {
                if (!state.biotoopActive) return;
                
                const maaisel2 = document.createElement('img');
                maaisel2.src = 'images/Maaisel2.png';
                maaisel2.className = 'ground-maaisel maaisel-2';
                maaisel2.style.left = maaiselLeft + '%';
                groundEl.appendChild(maaisel2);
                requestAnimationFrame(() => maaisel2.classList.add('visible'));

                // Stap 3: Na 8 sec, gedroogd maaisel verschijnt er overheen
                setTimeout(() => {
                    if (!state.biotoopActive) return;
                    
                    const maaisel1 = document.createElement('img');
                    maaisel1.src = 'images/Maaisel.png';
                    maaisel1.className = 'ground-maaisel maaisel-1';
                    maaisel1.style.left = maaiselLeft + '%';
                    groundEl.appendChild(maaisel1);
                    requestAnimationFrame(() => maaisel1.classList.add('visible'));

                    // Stap 4: Na 5 sec, vers maaisel verdwijnt (is nu "gedroogd")
                    setTimeout(() => {
                        if (!state.biotoopActive) return;
                        maaisel2.classList.add('removed');
                        setTimeout(() => { if (maaisel2.parentNode) maaisel2.remove(); }, 1500);

                        // Stap 5: Na 6 sec, gedroogd maaisel vervaagt (afgevoerd)
                        setTimeout(() => {
                            if (!state.biotoopActive) return;
                            maaisel1.classList.add('removed');
                            setTimeout(() => { if (maaisel1.parentNode) maaisel1.remove(); }, 1500);

                            // Stap 6: Na 3 sec, Zeis verdwijnt
                            setTimeout(() => {
                                if (!state.biotoopActive || !currentScythe) return;
                                currentScythe.classList.add('removed');
                                setTimeout(() => { 
                                    if (currentScythe && currentScythe.parentNode) currentScythe.remove(); 
                                    
                                    // Wissel spiegeling voor volgende cyclus
                                    scytheMirrored = !scytheMirrored;
                                    
                                    // Stap 7: Na 3 sec, start nieuwe cyclus
                                    setTimeout(runCycle, 3000);
                                }, 1500);
                            }, 3000);

                        }, 6000);
                    }, 5000);
                }, 8000);
            }, 3000);
        }

        // Start de eerste cyclus
        runCycle();
    }

    function startBiotoop() {
        state.biotoopActive = true;
        scytheMirrored = false;
        maaiselPositionIndex = 0;
        zeisPositionIndex = 0;
        
        // Start de zeis en maaisel cyclus
        startMaaiselZeisCyclus();
        
        // Snel veel bloemen opbouwen voor hooiland effect
        for (let i = 0; i < 8; i++) {
            setTimeout(addFlower, i * 600);
        }

        biotoopTimers.flowers = setInterval(() => {
            if (state.flowers.length < 16) addFlower();
        }, CONFIG.timing.flowerInterval);

        // Vlinders - vaker en sneller
        biotoopTimers.butterfly = setTimeout(() => {
            spawnButterfly();
            biotoopTimers.butterflyInterval = setInterval(() => {
                if (Math.random() > 0.25) spawnButterfly();
            }, CONFIG.timing.butterflyInterval);
        }, CONFIG.timing.butterflyFirst);

        // Lieveheersbeestjes
        biotoopTimers.ladybug = setTimeout(() => {
            spawnLadybug();
            biotoopTimers.ladybugInterval = setInterval(() => {
                if (Math.random() > 0.5) spawnLadybug();
            }, CONFIG.timing.ladybugInterval);
        }, CONFIG.timing.ladybugFirst);

        // Reset
        biotoopTimers.reset = setTimeout(() => {
            clearBiotoop();
            startBiotoop();
        }, CONFIG.timing.biotoopReset);
    }

    function clearBiotoop() {
        state.biotoopActive = false;
        currentScythe = null;
        Object.values(biotoopTimers).forEach(t => { clearTimeout(t); clearInterval(t); });
        ['headerGarden', 'headerAnimalsGround', 'headerAnimalsFlying'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });
        state.flowers = [];
        state.activeAnimals = [];
    }

    function setup() {
        gardenEl = document.getElementById('headerGarden');
        groundEl = document.getElementById('headerAnimalsGround');
        flyingEl = document.getElementById('headerAnimalsFlying');
        setTimeout(startBiotoop, CONFIG.timing.startDelay);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
