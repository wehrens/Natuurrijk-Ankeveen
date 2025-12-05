/* ===========================================
   NATUURRIJK ANKEVEEN - Header Garden Script
   =========================================== */

(function() {
    'use strict';

    // ===== NAVIGATIE DETECTIE =====
    // Bij klik op link: zet flag VOORDAT pagina laadt
    // Bij page load: check flag. Geen flag = refresh/nieuw bezoek
    
    const isNavigation = sessionStorage.getItem('natuurrijk_navigating') === 'true';
    sessionStorage.removeItem('natuurrijk_navigating');
    
    if (!isNavigation) {
        // Refresh of nieuw bezoek: wis opgeslagen tuin
        sessionStorage.removeItem('natuurrijk_garden');
    }
    
    // Zet flag bij elke klik op een link
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && !link.href.startsWith('javascript:')) {
            sessionStorage.setItem('natuurrijk_navigating', 'true');
        }
    });

    // ===== CONFIGURATIE =====
    const POND_POSITION = 78; // Percentage van links
    const POND_ZONE_START = 72; // Geen bloemen vanaf hier
    const POND_ZONE_END = 93;   // Tot hier geen bloemen
    
    const TIMING = {
        FIRST_FLOWER: 2000,
        FLOWER_INTERVAL: 3500,
        POND: 5000,
        ROERDOMP: 25000
    };

    const FLOWERS = [
        { src: 'images/Klaproos.png', size: 'medium' },
        { src: 'images/Klaprozen.png', size: 'medium' },
        { src: 'images/Klaprozen2.png', size: 'small' },
        { src: 'images/Ridderspoor.png', size: 'medium' },
        { src: 'images/Ridderspoor2.png', size: 'small' },
        { src: 'images/Digitalis.png', size: 'medium' },
        { src: 'images/Gelelis.png', size: 'medium' },
        { src: 'images/Lisdodde.png', size: 'medium' },
        { src: 'images/Lisdodde2.png', size: 'small' },
        { src: 'images/Lisdodde3.png', size: 'medium' },
        { src: 'images/Veldoeket.png', size: 'small' }
    ];

    const GRASS_POSITIONS = [
        { left: -2, width: 25 },
        { left: 20, width: 25 },
        { left: 42, width: 25 },
        { left: 64, width: 25 },
        { left: 86, width: 18 }
    ];

    // ===== STATE =====
    let garden, grassContainer;
    let state = { flowers: [], pondAdded: false, roerdompAdded: false };
    let usedPositions = [];

    // ===== HELPER FUNCTIES =====
    function saveState() {
        sessionStorage.setItem('natuurrijk_garden', JSON.stringify(state));
    }

    function loadState() {
        try {
            const saved = sessionStorage.getItem('natuurrijk_garden');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }

    function isInPondZone(position) {
        return position >= POND_ZONE_START && position <= POND_ZONE_END;
    }

    function getFlowerPosition() {
        let position, attempts = 0;
        do {
            // Kies random positie, maar NIET in pond zone
            position = Math.random() * 100;
            attempts++;
        } while (
            (isInPondZone(position) || usedPositions.some(p => Math.abs(p - position) < 6)) 
            && attempts < 50
        );
        
        if (isInPondZone(position)) return null; // Geef op als we geen goede plek vinden
        
        usedPositions.push(position);
        return position;
    }

    // ===== ELEMENT CREATORS =====
    function createGrass() {
        GRASS_POSITIONS.forEach(pos => {
            const img = document.createElement('img');
            img.src = 'images/Gras.webp';
            img.className = 'garden-grass';
            img.style.left = pos.left + '%';
            img.style.width = pos.width + '%';
            grassContainer.appendChild(img);
        });
    }

    function createFlower(flowerData, position, mirrored, animated) {
        const img = document.createElement('img');
        img.src = flowerData.src;
        img.className = 'garden-flower ' + flowerData.size;
        if (mirrored) img.classList.add('mirrored');
        img.style.left = position + '%';
        
        if (!animated) {
            img.style.animation = 'none';
            img.style.opacity = '1';
            img.style.transform = mirrored ? 'scaleX(-1)' : 'none';
        }
        
        garden.appendChild(img);
    }

    function createPond(animated) {
        // Poel
        const pond = document.createElement('img');
        pond.src = 'images/Poel1.png';
        pond.className = 'garden-pond';
        pond.style.left = POND_POSITION + '%';
        if (!animated) {
            pond.style.animation = 'none';
            pond.style.opacity = '1';
        }
        garden.appendChild(pond);

        // Lisdodde links
        setTimeout(() => {
            const left = document.createElement('img');
            left.src = 'images/Lisdodde.png';
            left.className = 'pond-lisdodde';
            left.style.left = (POND_POSITION - 2) + '%';
            if (!animated) {
                left.style.animation = 'none';
                left.style.opacity = '1';
            }
            garden.appendChild(left);
        }, animated ? 800 : 0);

        // Lisdodde rechts
        setTimeout(() => {
            const right = document.createElement('img');
            right.src = 'images/Lisdodde.png';
            right.className = 'pond-lisdodde-right';
            if (!animated) {
                right.style.animation = 'none';
                right.style.opacity = '1';
            }
            garden.appendChild(right);
        }, animated ? 1200 : 0);

        state.pondAdded = true;
        saveState();
    }

    function createRoerdomp(animated) {
        const roerdomp = document.createElement('img');
        roerdomp.src = 'images/Roerdomp.png';
        roerdomp.className = 'pond-roerdomp';
        roerdomp.style.left = (POND_POSITION + 3) + '%';
        
        if (!animated) {
            roerdomp.style.animation = 'none';
            roerdomp.style.opacity = '1';
        }
        
        garden.appendChild(roerdomp);
        state.roerdompAdded = true;
        saveState();
    }

    function plantNewFlower() {
        if (state.flowers.length >= FLOWERS.length * 2) return;
        
        const position = getFlowerPosition();
        if (position === null) return; // Kon geen geldige positie vinden
        
        const flowerIndex = state.flowers.length % FLOWERS.length;
        const flower = FLOWERS[flowerIndex];
        const mirrored = Math.random() > 0.5;
        
        createFlower(flower, position, mirrored, true);
        
        state.flowers.push({ index: flowerIndex, position, mirrored });
        saveState();
    }

    // ===== HTML STRUCTUUR =====
    function createHTML() {
        const html = `
            <div class="header-grass" id="headerGrass"></div>
            <div class="header-garden" id="headerGarden"></div>
            <div class="header-animals-ground">
                <img src="images/egel.png" alt="" class="walking-hedgehog">
                <img src="images/egel.png" alt="" class="walking-hedgehog-reverse">
                <img src="images/Rups1.gif" alt="" class="crawling-caterpillar">
            </div>
            <div class="header-animals-flying">
                <img src="images/huiszwaluw.png" alt="" class="flying-swallow">
                <img src="images/Vlinder.gif" alt="" class="flying-butterfly2">
                <img src="images/Vlinder.gif" alt="" class="flying-butterfly3">
                <img src="images/Ladybug.gif" alt="" class="flying-ladybug">
                <img src="images/Ladybug.gif" alt="" class="flying-ladybug2">
            </div>
        `;
        
        const nav = document.querySelector('nav');
        if (nav) {
            nav.insertAdjacentHTML('afterend', html);
        }
    }

    // ===== INITIALISATIE =====
    function init() {
        createHTML();
        
        garden = document.getElementById('headerGarden');
        grassContainer = document.getElementById('headerGrass');
        
        if (!garden || !grassContainer) return;

        // Gras altijd meteen tonen
        createGrass();

        // Laad opgeslagen state
        const savedState = loadState();
        
        if (savedState && (savedState.flowers.length > 0 || savedState.pondAdded)) {
            // NAVIGATIE: Herstel opgeslagen tuin instant
            state = savedState;
            usedPositions = state.flowers.map(f => f.position);
            
            // Herstel bloemen
            state.flowers.forEach(f => {
                createFlower(FLOWERS[f.index], f.position, f.mirrored, false);
            });
            
            // Herstel poel
            if (state.pondAdded) {
                createPond(false);
            }
            
            // Herstel roerdomp
            if (state.roerdompAdded) {
                createRoerdomp(false);
            }
            
            // Ga door met nieuwe bloemen als nog niet vol
            if (state.flowers.length < FLOWERS.length * 2) {
                setInterval(plantNewFlower, TIMING.FLOWER_INTERVAL);
            }
            
            // Voeg roerdomp toe als die er nog niet was
            if (state.pondAdded && !state.roerdompAdded) {
                setTimeout(() => createRoerdomp(true), 5000);
            }
            
        } else {
            // NIEUW BEZOEK: Bouw tuin stap voor stap op
            
            // Start bloemen planten
            setTimeout(() => {
                plantNewFlower();
                setInterval(plantNewFlower, TIMING.FLOWER_INTERVAL);
            }, TIMING.FIRST_FLOWER);
            
            // Voeg poel toe
            setTimeout(() => {
                createPond(true);
            }, TIMING.POND);
            
            // Voeg roerdomp toe (de kers op de taart!)
            setTimeout(() => {
                createRoerdomp(true);
            }, TIMING.ROERDOMP);
        }
    }

    // Start als DOM klaar is
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
