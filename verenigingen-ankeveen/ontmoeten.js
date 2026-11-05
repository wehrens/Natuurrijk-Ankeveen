/* Ontmoetingsstrook voor de verenigingenpagina: groepjes mensen komen elkaar tegen.
   Web Animations API, alleen transform/opacity. Stil bij prefers-reduced-motion. */
(function () {
    'use strict';
    const strip = document.getElementById('ontmoeten');
    if (!strip) return;
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const KLEUR = ['#7B5CC4', '#F39A2B', '#2BB39A', '#D64541', '#3B8FE0', '#C9A227'];
    const H = strip.clientHeight, GROUND = H - 14;
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
        return animate(el.firstElementChild, [{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(-1.6px) rotate(1.4deg)' }],
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
            const h = chance(.25) ? rand(22, 28) : rand(34, 42);
            const p = person(chance(.3) ? pick(KLEUR) : color, h);
            strip.appendChild(p);
            const off = i * rand(13, 18);
            const x0 = fromLeft ? -40 - off : width + 20 + off;
            const x1 = fromLeft ? meet - 14 - off : meet + 14 + off;
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
            const x2 = dir > 0 ? width + 40 + i * 14 : -60 - i * 14, d = Math.abs(x2 - m.x1) * speed;
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
            const bb = bubble(meet - 14, GROUND - Math.max(...all.map(m => m.h)) - 24, cl);
            setTimeout(() => {
                animate(bb, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).finished.then(() => bb.remove()).catch(() => bb.remove());
                const together = chance(.45);
                if (together) { const dir = chance(.5) ? 1 : -1; leave(all.sort((a, b) => dir * (b.x1 - a.x1)), dir, speed); }
                else { leave(L, 1, speed); leave(R, -1, speed); }
                setTimeout(() => { active--; }, 1500);
            }, rand(3500, 6500));
        }, arrive + 100);
    }

    // Fietser: snel langs, af en toe
    function cyclist() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), h = 30, color = pick(KLEUR);
        const w = document.createElement('div'); w.className = 'om-p';
        w.innerHTML = `<svg viewBox="0 0 48 30" width="48" height="30" aria-hidden="true">
            <circle cx="10" cy="22" r="7" fill="none" stroke="#5a6a7e" stroke-width="2"/><circle cx="38" cy="22" r="7" fill="none" stroke="#5a6a7e" stroke-width="2"/>
            <path d="M10 22 L20 10 L34 10 L38 22 M20 10 L24 22 M18 22 h12" fill="none" stroke="#5a6a7e" stroke-width="2"/>
            <circle cx="27" cy="4" r="3.6" fill="${color}"/><path d="M23 9 q4 -3 8 0 l3 8 l-6 5 l-4 -3 z" fill="${color}"/></svg>`;
        strip.appendChild(w);
        const y = GROUND - h + 2, x0 = fromLeft ? -60 : width + 20, x1 = fromLeft ? width + 20 : -60, dur = (width + 80) * 9;
        animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${fromLeft ? 1 : -1})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${fromLeft ? 1 : -1})` }], { duration: dur, easing: 'linear' })
            .finished.then(() => w.remove()).catch(() => w.remove());
    }

    if (REDUCE) {                                   // stil beeld: twee groepjes die praten
        [[.3, 3], [.68, 2]].forEach(([f, n]) => {
            const c = pick(KLEUR);
            for (let i = 0; i < n; i++) { const h = 36; const p = person(c, h); p.style.transform = `translate(${W() * f + i * 16}px, ${GROUND - h}px) scaleX(${i ? -1 : 1})`; strip.appendChild(p); }
            bubble(W() * f + 6, GROUND - 58, c);
        });
        return;
    }
    meeting(); setTimeout(meeting, 4000);
    setInterval(() => { if (chance(.75)) meeting(); }, 7000);
    setTimeout(cyclist, 9000); setInterval(() => { if (chance(.5)) cyclist(); }, 24000);
})();
