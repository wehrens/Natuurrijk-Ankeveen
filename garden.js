/* ===========================================
   NATUURRIJK ANKEVEEN - Header Garden Script
   FASE 1: Robuuste basis - scroll reset + gras
   =========================================== */

(function() {
    'use strict';

    // ===== CONFIGURATIE =====
    const CONFIG = {
        grassImage: 'images/Gras-cropped.png',
        grassSegments: 10  // Meer segmenten voor kleinere grashoogte
    };

    // ===== NAVIGATIE STATE =====
    // Voor later: state behouden bij navigatie binnen de site
    const isNavigation = sessionStorage.getItem('natuurrijk_navigating') === 'true';
    sessionStorage.removeItem('natuurrijk_navigating');
    
    if (!isNavigation) {
        sessionStorage.removeItem('natuurrijk_garden');
    }
    
    // Zet flag bij interne navigatie
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && 
            !link.href.startsWith('javascript:') &&
            link.href.includes(window.location.hostname)) {
            sessionStorage.setItem('natuurrijk_navigating', 'true');
        }
    });

    // ===== HTML STRUCTUUR MAKEN =====
    function createHeaderStructure() {
        // Check of structuur al bestaat
        if (document.getElementById('headerGrass')) {
            return;
        }

        const nav = document.querySelector('nav');
        if (!nav) {
            console.warn('Garden: nav element niet gevonden');
            return;
        }

        // Maak gras images HTML
        let grassHTML = '';
        for (let i = 0; i < CONFIG.grassSegments; i++) {
            grassHTML += `<img src="${CONFIG.grassImage}" class="garden-grass" alt="" aria-hidden="true">`;
        }

        // Maak de header elementen
        const html = `
            <div class="header-background"></div>
            <div class="header-grass" id="headerGrass">${grassHTML}</div>
        `;
        
        // Voeg in direct na de nav
        nav.insertAdjacentHTML('afterend', html);
    }

    // ===== INITIALISATIE =====
    function init() {
        createHeaderStructure();
        console.log('Garden: geïnitialiseerd (fase 1 - alleen gras)');
    }

    // Start zodra DOM klaar is
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
