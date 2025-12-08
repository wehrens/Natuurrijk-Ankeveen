/**
 * Email Protection - Voorkomt Cloudflare email obfuscation
 * Door emails dynamisch te bouwen ziet Cloudflare ze niet
 */
(function() {
    'use strict';
    
    // Email adressen in stukjes (Cloudflare herkent dit niet)
    const EMAILS = {
        info: ['info', 'natuurrijkankeveen', 'nl'],
        ron: ['r.wehrens', 'phasuma', 'com']
    };
    
    // Bouw email uit stukjes
    function buildEmail(key) {
        const parts = EMAILS[key];
        if (!parts) return '';
        return parts[0] + '@' + parts[1] + '.' + parts[2];
    }
    
    // Bouw mailto link
    function buildMailto(key) {
        return 'mail' + 'to:' + buildEmail(key);
    }
    
    // Vul alle elementen met data-email attribuut
    function fillEmails() {
        // Links met data-email attribuut
        document.querySelectorAll('a[data-email]').forEach(function(el) {
            const key = el.getAttribute('data-email');
            el.href = buildMailto(key);
        });
        
        // Spans met data-email-text attribuut (voor zichtbare tekst)
        document.querySelectorAll('[data-email-text]').forEach(function(el) {
            const key = el.getAttribute('data-email-text');
            el.textContent = buildEmail(key);
        });
        
        // Elementen met data-email-full (zowel href als tekst)
        document.querySelectorAll('a[data-email-full]').forEach(function(el) {
            const key = el.getAttribute('data-email-full');
            el.href = buildMailto(key);
            el.textContent = buildEmail(key);
        });
    }
    
    // Run wanneer DOM klaar is
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fillEmails);
    } else {
        fillEmails();
    }
})();
