/* Ontmoetingsstrook voor de verenigingenpagina: groepjes mensen komen elkaar tegen.
   Web Animations API, alleen transform/opacity. Stil bij prefers-reduced-motion. */
(function () {
    'use strict';
    const strip = document.getElementById('ontmoeten');
    if (!strip) return;
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const KLEUR = ['#7B5CC4', '#F39A2B', '#2BB39A', '#D64541', '#3B8FE0', '#C9A227'];
    const H = strip.clientHeight, GROUND = H - 8;
    const W = () => strip.clientWidth;
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const chance = p => Math.random() < p;
    const running = new Set();
    function animate(el, frames, opts) {
        const a = el.animate(frames, Object.assign({ fill: 'forwards' }, opts));
        running.add(a); a.finished.then(() => running.delete(a)).catch(() => running.delete(a));
        return a;
    }
    document.addEventListener('visibilitychange', () => running.forEach(a => document.hidden ? a.pause() : a.play()));

    // Een poppetje: hoofd, romp, benen; h = lengte in px
    function person(color, h) {
        const w = document.createElement('div');
        w.className = 'om-p';
        w.style.height = h + 'px'; w.style.width = h * .45 + 'px';
        const s = h / 40;
        w.innerHTML = `<svg viewBox="0 0 18 40" width="${h * .45}" height="${h}" aria-hidden="true">
            <circle cx="9" cy="5" r="4.6" fill="${color}"/>
            <path d="M3 13 q6 -4 12 0 l1.5 13 h-3 l-1 12 h-3 l-0.5 -11 l-0.5 11 h-3 l-1 -12 h-3 z" fill="${color}"/>
            <path class="om-leg" d="M6 26 l-1 12 h3 l0.5 -11z" fill="${color}"/></svg>`;
        void s;
        return w;
    }
    function bob(el, dur) {
        return animate(el.firstElementChild, [{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(-1px) rotate(1.4deg)' }],
            { duration: dur, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
    }
    function bubble(x, y, color) {
        const b = document.createElement('div');
        b.className = 'om-bubble'; b.style.borderColor = color;
        b.innerHTML = '<span></span><span></span><span></span>';
        b.style.transform = `translate(${x}px, ${y}px)`;
        b.style.opacity = 0; strip.appendChild(b);
        animate(b, [{ opacity: 0, transform: `translate(${x}px, ${y + 6}px)` }, { opacity: 1, transform: `translate(${x}px, ${y}px)` }], { duration: 500 });
        return b;
    }

    // Een ontmoeting: een groepje van links en een van rechts lopen naar hetzelfde punt,
    // staan even te kletsen, en gaan dan samen verder of ieder hun eigen kant op
    let active = 0;
    function party(fromLeft, meet, color, speed) {
        const n = pick([1, 2, 2, 3]), width = W(), members = [];
        for (let i = 0; i < n; i++) {
            const h = chance(.25) ? rand(13, 16) : rand(20, 25);
            const p = person(chance(.3) ? pick(KLEUR) : color, h);
            strip.appendChild(p);
            const off = i * rand(8, 11);
            const x0 = fromLeft ? -40 - off : width + 20 + off;
            const x1 = fromLeft ? meet - 9 - off : meet + 9 + off;
            const y = GROUND - h, f = fromLeft ? 1 : -1;
            p.style.transform = `translate(${x0}px, ${y}px) scaleX(${f})`;
            const b = bob(p, rand(380, 460)), dur = Math.abs(x1 - x0) * speed;
            animate(p, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})`, opacity: 0 },
                { transform: `translate(${x0 + (x1 - x0) * .06}px, ${y}px) scaleX(${f})`, opacity: 1, offset: .06 },
                { transform: `translate(${x1}px, ${y}px) scaleX(${f})`, opacity: 1 }], { duration: dur, easing: 'linear' });
            members.push({ p, b, x1, y, h, dur, f });
        }
        return members;
    }
    function leave(members, dir, speed) {
        const width = W();
        members.forEach((m, i) => {
            m.b.play();
            const x2 = dir > 0 ? width + 40 + i * 9 : -60 - i * 9, d = Math.abs(x2 - m.x1) * speed;
            animate(m.p, [{ transform: `translate(${m.x1}px, ${m.y}px) scaleX(${dir})`, opacity: 1 },
                { transform: `translate(${m.x1 + (x2 - m.x1) * .93}px, ${m.y}px) scaleX(${dir})`, opacity: 1, offset: .93 },
                { transform: `translate(${x2}px, ${m.y}px) scaleX(${dir})`, opacity: 0 }], { duration: d, easing: 'linear' })
                .finished.then(() => { m.b.cancel(); m.p.remove(); }).catch(() => m.p.remove());
        });
    }
    function meeting() {
        if (document.hidden || active >= 3) return;
        active++;
        const width = W(), meet = rand(width * .2, width * .8), speed = rand(15, 21);
        const cl = pick(KLEUR), cr = chance(.5) ? cl : pick(KLEUR);
        const L = party(true, meet, cl, speed), R = party(false, meet, cr, speed);
        const all = L.concat(R), arrive = Math.max(...all.map(m => m.dur));
        setTimeout(() => {
            all.forEach(m => m.b.pause());
            const bb = bubble(meet - 10, GROUND - Math.max(...all.map(m => m.h)) - 16, cl);
            setTimeout(() => {
                animate(bb, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).finished.then(() => bb.remove()).catch(() => bb.remove());
                const together = chance(.45);
                if (together) { const dir = chance(.5) ? 1 : -1; leave(all.sort((a, b) => dir * (b.x1 - a.x1)), dir, speed); }
                else { leave(L, 1, speed); leave(R, -1, speed); }
                setTimeout(() => { active--; }, 1500);
            }, rand(3500, 6500));
        }, arrive + 100);
    }

    // Wielrenner: racefiets met draaiende wielen, voorovergebogen renner
    function racer(color) {
        const w = document.createElement('div'); w.className = 'om-p';
        w.innerHTML = `<svg viewBox="0 0 60 34" width="38" height="22" aria-hidden="true">
            <g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="11" cy="25" r="8" fill="none" stroke="#3d4a5c" stroke-width="1.6"/><path d="M11 17v16M3 25h16M5.3 19.3l11.4 11.4M16.7 19.3L5.3 30.7" stroke="#3d4a5c" stroke-width=".9"/></g>
            <g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="47" cy="25" r="8" fill="none" stroke="#3d4a5c" stroke-width="1.6"/><path d="M47 17v16M39 25h16M41.3 19.3l11.4 11.4M52.7 19.3L41.3 30.7" stroke="#3d4a5c" stroke-width=".9"/></g>
            <path d="M11 25 L24 11 L40 11 L47 25 M24 11 L30 25 M27 25 h7 M40 11 L43 7 h5" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/>
            <circle cx="30" cy="25" r="2.2" fill="#3d4a5c"/>
            <path d="M25 13 q8 -9 18 -6 l3 4 l-4 3 l-7 -1 l-6 7 l-2 -1 z" fill="${color}"/>
            <path d="M44 7 l-6 6 M30 17 l-4 6" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>
            <circle cx="47" cy="5" r="3.4" fill="#2b2b2b"/><circle cx="47.6" cy="5.6" r="2.4" fill="${color}"/></svg>`;
        return w;
    }
    // Peloton: vijf renners dicht achter elkaar, snel
    function peloton() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, y = GROUND - 22 + 1;
        const dur = (width + 300) * 4.5;
        for (let i = 0; i < 5; i++) {
            const w = racer(pick(KLEUR)); strip.appendChild(w);
            w.querySelectorAll('.wheel').forEach(g => animate(g, [{ transform: 'rotate(0deg)' }, { transform: `rotate(${f * 360}deg)` }], { duration: 420, iterations: Infinity, easing: 'linear' }));
            const off = i * 34 + (i % 2) * 6;
            const x0 = fromLeft ? -60 - off : width + 20 + off, x1 = fromLeft ? width + 40 - off * .2 : -80 + off * .2;
            animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
                .finished.then(() => w.remove()).catch(() => w.remove());
        }
    }

    // Fanfare: een rij muzikanten marcheert in de maat, met muzieknootjes
    function musician(color, kind, h) {
        const w = document.createElement('div'); w.className = 'om-p';
        const inst = kind === 'drum' ? `<circle cx="16" cy="24" r="6" fill="#fff" stroke="${color}" stroke-width="1.5"/><path d="M12 22h8" stroke="${color}" stroke-width="1.2"/>`
            : kind === 'trumpet' ? `<path d="M11 10 h7 l4 -3 v8 l-4 -3 h-7 z" fill="#C9A227"/>`
            : `<path d="M11 12 q6 -8 8 -2 l-3 4 z" fill="#C9A227"/>`;
        w.innerHTML = `<svg viewBox="0 0 24 40" width="${h * .6}" height="${h}" aria-hidden="true">
            <circle cx="9" cy="5" r="4.6" fill="${color}"/><path d="M5 2 h8 l-1 -3 h-6 z" fill="#16233a"/>
            <path d="M3 13 q6 -4 12 0 l1.5 13 h-3 l-1 12 h-3 l-0.5 -11 l-0.5 11 h-3 l-1 -12 h-3 z" fill="${color}"/>${inst}</svg>`;
        return w;
    }
    function note(x, y, color) {
        const n = document.createElement('div'); n.className = 'om-note'; n.style.color = color;
        n.textContent = pick(['\u266a', '\u266b', '\u2669']);
        strip.appendChild(n);
        const dx = rand(-10, 10);
        animate(n, [{ transform: `translate(${x}px, ${y}px)`, opacity: 0 }, { transform: `translate(${x + dx * .4}px, ${y - 8}px)`, opacity: 1, offset: .25 },
            { transform: `translate(${x + dx}px, ${y - 26}px)`, opacity: 0 }], { duration: rand(1600, 2400), easing: 'ease-out' })
            .finished.then(() => n.remove()).catch(() => n.remove());
    }
    function fanfare() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, color = '#D81E1E', noteColor = '#16233a';
        const n = 6, h = 23, y = GROUND - h, speed = 24, dur = (width + 200) * speed;
        const kinds = ['trumpet', 'trumpet', 'horn', 'drum', 'trumpet', 'horn'];
        const members = [];
        for (let i = 0; i < n; i++) {
            const w = musician(color, kinds[i], h); strip.appendChild(w);
            const off = i * 15, x0 = fromLeft ? -40 - off : width + 20 + off, x1 = fromLeft ? width + 40 - off : -60 + off;
            animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
                .finished.then(() => w.remove()).catch(() => w.remove());
            animate(w.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }], { duration: 300, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
            members.push({ w, x0, x1 });
        }
        const t0 = performance.now();
        const tick = setInterval(() => {
            const p = (performance.now() - t0) / dur; if (p >= 1) { clearInterval(tick); return; }
            const m = pick(members); const x = m.x0 + (m.x1 - m.x0) * p + f * 6;
            note(x, y - 6, noteColor);
        }, 450);
    }

    if (REDUCE) {                                   // stil beeld: twee groepjes die praten
        [[.3, 3], [.68, 2]].forEach(([f, n]) => {
            const c = pick(KLEUR);
            for (let i = 0; i < n; i++) { const h = 22; const p = person(c, h); p.style.transform = `translate(${W() * f + i * 10}px, ${GROUND - h}px) scaleX(${i ? -1 : 1})`; strip.appendChild(p); }
            bubble(W() * f + 4, GROUND - 38, c);
        });
        return;
    }
    meeting(); setTimeout(meeting, 4000);
    setInterval(() => { if (chance(.75)) meeting(); }, 7000);
    setTimeout(peloton, 12000); setInterval(() => { if (chance(.5)) peloton(); }, 40000);
    setTimeout(fanfare, 26000); setInterval(() => { if (chance(.5)) fanfare(); }, 55000);
})();
