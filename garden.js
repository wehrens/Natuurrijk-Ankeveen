/* ===========================================
   NATUURRIJK ANKEVEEN - Header Garden Script
   FASE 2: Biotoop met bloemen - langzaam opbloeien
   =========================================== */

(function() {
    'use strict';

    // ===== CONFIGURATIE =====
    const CONFIG = {
        // Timing (in milliseconden)
        firstFlowerDelay: 3000,      // 3 seconden na laden
        totalBloomTime: 120000,       // 2 minuten voor alle bloemen
        
        // State
        navigationKey: 'natuurrijk_navigating',
        gardenStateKey: 'natuurrijk_garden_state'
    };

    // ===== NAVIGATIE DETECTIE =====
    const isNavigation = sessionStorage.getItem(CONFIG.navigationKey) === 'true';
    sessionStorage.removeItem(CONFIG.navigationKey);
    
    if (!isNavigation) {
        sessionStorage.removeItem(CONFIG.gardenStateKey);
    }
    
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && 
            !link.href.startsWith('javascript:') &&
            link.href.includes(window.location.hostname)) {
            sessionStorage.setItem(CONFIG.navigationKey, 'true');
        }
    });

    // ===== BLOEMEN LATEN BLOEIEN =====
    function bloomFlowers() {
        const flowers = document.querySelectorAll('.garden-flower');
        if (flowers.length === 0) return;

        // Check of we al gebloeid waren (navigatie binnen site)
        const savedState = sessionStorage.getItem(CONFIG.gardenStateKey);
        
        if (savedState === 'bloomed') {
            // Direct alle bloemen tonen
            flowers.forEach(flower => {
                flower.style.opacity = '1';
                flower.style.transform = flower.classList.contains('mirrored') 
                    ? 'scaleX(-1) scale(1)' 
                    : 'scale(1)';
            });
            return;
        }

        // Bereken interval tussen bloemen
        const flowerCount = flowers.length;
        const interval = CONFIG.totalBloomTime / flowerCount;
        
        // Shuffle de bloemen voor willekeurige volgorde
        const shuffledFlowers = Array.from(flowers).sort(() => Math.random() - 0.5);
        
        // Start bloemen laten opbloeien
        shuffledFlowers.forEach((flower, index) => {
            setTimeout(() => {
                flower.classList.add('blooming');
            }, CONFIG.firstFlowerDelay + (index * interval));
        });

        // Sla state op na alle bloemen
        setTimeout(() => {
            sessionStorage.setItem(CONFIG.gardenStateKey, 'bloomed');
        }, CONFIG.firstFlowerDelay + CONFIG.totalBloomTime);
    }

    // ===== INITIALISATIE =====
    function init() {
        // Wacht even tot alles geladen is
        setTimeout(bloomFlowers, 100);
    }

    // Start zodra DOM klaar is
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
