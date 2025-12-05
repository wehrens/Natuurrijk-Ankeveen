/* ===========================================
   NATUURRIJK ANKEVEEN - Header Garden Script
   Include this JS in all pages (at end of body)
   =========================================== */

(function() {
    'use strict';

    // Create HTML structure for garden
    function createGardenHTML() {
        const gardenHTML = `
            <!-- Grass layer - BEHIND everything -->
            <div class="header-grass" id="headerGrass"></div>

            <!-- Garden flowers and pond -->
            <div class="header-garden" id="headerGarden"></div>

            <!-- Ground Animals - walk BEHIND flowers but IN FRONT of grass -->
            <div class="header-animals-ground">
                <img src="images/egel.png" alt="" class="walking-hedgehog">
                <img src="images/egel.png" alt="" class="walking-hedgehog-reverse">
                <img src="images/Rups1.gif" alt="" class="crawling-caterpillar">
            </div>

            <!-- Flying Animals - fly IN FRONT of everything -->
            <div class="header-animals-flying">
                <img src="images/huiszwaluw.png" alt="" class="flying-swallow">
                <img src="images/Vlinder.gif" alt="" class="flying-butterfly2">
                <img src="images/Vlinder.gif" alt="" class="flying-butterfly3">
                <img src="images/Ladybug.gif" alt="" class="flying-ladybug">
                <img src="images/Ladybug.gif" alt="" class="flying-ladybug2">
            </div>
        `;

        // Insert after nav element
        const nav = document.querySelector('nav');
        if (nav) {
            nav.insertAdjacentHTML('afterend', gardenHTML);
        }
    }

    // Flower definitions
    const gardenFlowers = [
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
        { src: 'images/Veldoeket.png', size: 'small' },
        { src: 'images/Klaproos.png', size: 'small' },
        { src: 'images/Ridderspoor.png', size: 'small' },
        { src: 'images/Digitalis.png', size: 'small' },
        { src: 'images/Gelelis.png', size: 'small' },
        { src: 'images/Klaprozen2.png', size: 'medium' },
        { src: 'images/Veldoeket.png', size: 'medium' }
    ];

    // Grass positions
    const grassPositions = [
        { left: -5, width: 28 },
        { left: 20, width: 28 },
        { left: 45, width: 28 },
        { left: 70, width: 28 },
        { left: 92, width: 18 }
    ];

    // Flower zones (avoiding text and pond)
    const flowerZones = [
        { start: 0, end: 3, weight: 1 },
        { start: 23, end: 38, weight: 3 },
        { start: 39, end: 54, weight: 3 },
        { start: 55, end: 72, weight: 3 },
        { start: 93, end: 100, weight: 2 }
    ];

    // Pond settings
    const pondPosition = 78;
    const pondWidth = 10;

    // State
    let garden, grassContainer;
    let gardenState;
    let usedPositions;
    let flowerIndex;

    function overlapsWithPond(position) {
        return position > (pondPosition - 6) && position < (pondPosition + pondWidth + 4);
    }

    function getValidPosition() {
        const windowWidth = window.innerWidth;
        let position;
        let attempts = 0;

        do {
            if (windowWidth > 768) {
                const totalWeight = flowerZones.reduce((sum, z) => sum + z.weight, 0);
                let rand = Math.random() * totalWeight;
                let selectedZone = flowerZones[0];

                for (const zone of flowerZones) {
                    rand -= zone.weight;
                    if (rand <= 0) {
                        selectedZone = zone;
                        break;
                    }
                }
                position = selectedZone.start + Math.random() * (selectedZone.end - selectedZone.start);
            } else {
                const rand = Math.random();
                if (rand < 0.15) {
                    position = Math.random() * 5;
                } else {
                    position = 56 + Math.random() * 44;
                }
            }
            attempts++;
        } while ((usedPositions.some(p => Math.abs(p - position) < 5) || overlapsWithPond(position)) && attempts < 30);

        usedPositions.push(position);
        return position;
    }

    function saveGardenState() {
        try {
            localStorage.setItem('natuurrijkGarden', JSON.stringify(gardenState));
        } catch (e) {
            // localStorage might not be available
        }
    }

    function loadGardenState() {
        try {
            const saved = localStorage.getItem('natuurrijkGarden');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }

    function createFlowerElement(flowerData, position, mirrored, animated) {
        const img = document.createElement('img');
        img.src = flowerData.src;
        img.className = 'garden-flower ' + flowerData.size;
        img.style.left = position + '%';
        img.style.zIndex = '3';
        if (mirrored) {
            img.classList.add('mirrored');
        }
        if (!animated) {
            img.style.animation = 'none';
            img.style.opacity = '1';
            img.style.transform = mirrored ? 'scaleX(-1)' : 'none';
        }
        garden.appendChild(img);
    }

    function plantFlower() {
        if (flowerIndex >= gardenFlowers.length * 2) return;

        const flower = gardenFlowers[flowerIndex % gardenFlowers.length];
        const position = getValidPosition();
        const mirrored = Math.random() > 0.5;

        createFlowerElement(flower, position, mirrored, true);

        gardenState.flowers.push({
            index: flowerIndex,
            position: position,
            mirrored: mirrored
        });
        gardenState.flowerIndex = flowerIndex + 1;
        saveGardenState();

        flowerIndex++;
    }

    function restoreFlowers() {
        gardenState.flowers.forEach(savedFlower => {
            const flower = gardenFlowers[savedFlower.index % gardenFlowers.length];
            createFlowerElement(flower, savedFlower.position, savedFlower.mirrored, false);
        });
    }

    function addAllGrass() {
        grassPositions.forEach(pos => {
            const img = document.createElement('img');
            img.src = 'images/Gras.webp';
            img.className = 'garden-grass';
            img.style.left = pos.left + '%';
            img.style.width = pos.width + '%';
            grassContainer.appendChild(img);
        });
    }

    function addPondWithLisdodde(instant) {
        const pond = document.createElement('img');
        pond.src = 'images/Poel1.png';
        pond.className = 'garden-pond';
        pond.style.left = pondPosition + '%';
        pond.style.zIndex = '2';
        if (instant) {
            pond.style.animation = 'none';
            pond.style.opacity = '1';
        }
        garden.appendChild(pond);

        const delay1 = instant ? 0 : 800;
        const delay2 = instant ? 0 : 1200;

        setTimeout(() => {
            const lisdoddeLeft = document.createElement('img');
            lisdoddeLeft.src = 'images/Lisdodde.png';
            lisdoddeLeft.className = 'pond-lisdodde';
            lisdoddeLeft.style.left = (pondPosition - 2) + '%';
            lisdoddeLeft.style.zIndex = '4';
            if (instant) {
                lisdoddeLeft.style.animation = 'none';
                lisdoddeLeft.style.opacity = '1';
            }
            garden.appendChild(lisdoddeLeft);
        }, delay1);

        setTimeout(() => {
            const lisdoddeRight = document.createElement('img');
            lisdoddeRight.src = 'images/Lisdodde.png';
            lisdoddeRight.className = 'pond-lisdodde-right';
            lisdoddeRight.style.zIndex = '4';
            if (instant) {
                lisdoddeRight.style.animation = 'none';
                lisdoddeRight.style.opacity = '1';
            }
            garden.appendChild(lisdoddeRight);
        }, delay2);

        gardenState.pondAdded = true;
        saveGardenState();
    }

    function initGarden() {
        // Create HTML elements
        createGardenHTML();

        // Get references
        garden = document.getElementById('headerGarden');
        grassContainer = document.getElementById('headerGrass');

        if (!garden || !grassContainer) {
            console.warn('Garden containers not found');
            return;
        }

        // Load saved state
        const savedState = loadGardenState();
        gardenState = savedState || {
            flowers: [],
            pondAdded: false,
            flowerIndex: 0
        };

        usedPositions = gardenState.flowers.map(f => f.position);
        flowerIndex = gardenState.flowerIndex;

        // Always add grass immediately
        addAllGrass();

        // Check if we have saved state to restore
        if (gardenState.flowers.length > 0 || gardenState.pondAdded) {
            // Restore saved garden instantly
            if (gardenState.pondAdded) {
                addPondWithLisdodde(true);
            }
            restoreFlowers();

            // Continue adding new flowers
            if (flowerIndex < gardenFlowers.length * 2) {
                setInterval(() => {
                    plantFlower();
                }, 3000 + Math.random() * 2000);
            }
        } else {
            // Fresh start - build garden gradually
            setTimeout(() => {
                addPondWithLisdodde(false);
            }, 3000);

            setTimeout(() => {
                plantFlower();
                setInterval(() => {
                    plantFlower();
                }, 3000 + Math.random() * 2000);
            }, 2000);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGarden);
    } else {
        initGarden();
    }

})();
