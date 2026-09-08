/* ===========================================
   NATUURRIJK ANKEVEEN – site.js
   Gedeeld: mobiel menu, contactvenster, lightbox
   =========================================== */
(function () {
    'use strict';

    // Mobiel menu
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            const open = navLinks.classList.toggle('open');
            menuBtn.setAttribute('aria-expanded', open);
        });
        navLinks.addEventListener('click', e => { if (e.target.closest('a, button')) navLinks.classList.remove('open'); });
    }

    // Contactvenster
    const modal = document.getElementById('contactModal');
    function openContact() { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeContact() { if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } }
    if (modal) {
        document.querySelectorAll('[data-open-contact]').forEach(b => b.addEventListener('click', openContact));
        document.getElementById('contactClose').addEventListener('click', closeContact);
        modal.addEventListener('click', e => { if (e.target === modal) closeContact(); });
    }

    // Lightbox: elk element met data-lightbox-src opent de foto, optioneel met tekst uit window.lightboxData
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightboxImg');
    const lbText = document.getElementById('lightboxText');
    function openLightbox(src, key, gold) {
        if (!lb) return;
        lbImg.src = src;
        lbImg.classList.toggle('gold', !!gold);
        const d = key && window.lightboxData && window.lightboxData[key];
        if (d && lbText) {
            document.getElementById('lightboxName').textContent = d.name;
            document.getElementById('lightboxRole').textContent = d.role;
            document.getElementById('lightboxQuote').textContent = d.quote;
            lbText.hidden = false;
        } else if (lbText) { lbText.hidden = true; }
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeLightbox() { if (lb) { lb.classList.remove('active'); document.body.style.overflow = ''; } }
    document.addEventListener('click', e => {
        const b = e.target.closest('[data-lightbox-src]');
        if (b) { openLightbox(b.dataset.lightboxSrc, b.dataset.lightboxKey, b.hasAttribute('data-lightbox-gold')); return; }
        if (e.target.matches('img[data-lightbox]')) { openLightbox(e.target.src); return; }
        if (lb && (e.target === lb || e.target.id === 'lightboxClose')) closeLightbox();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeLightbox(); closeContact(); } });
})();
