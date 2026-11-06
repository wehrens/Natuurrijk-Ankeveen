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
    const EX = 220;   // extra loopafstand: ook de achterste van een groep loopt helemaal uit beeld
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const chance = p => Math.random() < p;
    const running = new Set();
    // Looptochten (rechtlijnig van A naar B) onthouden we, zodat ze bij het kantelen van een telefoon
    // (strook wordt breder) gewoon doorlopen tot de nieuwe rand in plaats van halverwege te verdwijnen.
    const tochten = new Set(), TR = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)(.*)/;
    function animate(el, frames, opts) {
        const a = el.animate(frames, Object.assign({ fill: 'forwards' }, opts));
        running.add(a); a.finished.then(() => running.delete(a)).catch(() => running.delete(a));
        if (frames.length === 2 && opts && opts.easing === 'linear' && el.classList && el.classList.contains('om-p')) {
            const m0 = TR.exec(frames[0].transform || ''), m1 = TR.exec(frames[1].transform || '');
            if (m0 && m1) {
                const t = { a, x0: +m0[1], x1: +m1[1], y: m0[2], rest: m1[3], dur: opts.duration };
                tochten.add(t); const weg = () => tochten.delete(t); a.finished.then(weg).catch(weg);
            }
        }
        return a;
    }
    let breedte = strip.clientWidth;
    addEventListener('resize', () => {
        const nu = strip.clientWidth, extra = nu - breedte; breedte = nu;
        if (extra <= 0) return;
        tochten.forEach(t => {
            if (t.x1 > t.x0 && t.x1 >= nu - extra - 1) {             // loopt naar de rechterrand: verder doorlopen
                const x1 = t.x1 + extra, dur = t.dur * (x1 - t.x0) / (t.x1 - t.x0);
                t.a.effect.setKeyframes([{ transform: `translate(${t.x0}px, ${t.y}px)${t.rest}` }, { transform: `translate(${x1}px, ${t.y}px)${t.rest}` }]);
                t.a.effect.updateTiming({ duration: dur }); t.x1 = x1; t.dur = dur;
            }
        });
    });
    document.addEventListener('visibilitychange', () => running.forEach(a => document.hidden ? a.pause() : a.play()));

    // Een poppetje: hoofd (huid + haar), trui in clubkleur, eigen broek; h = lengte in px
    const HUID = ['#F2C9B0', '#E3B093', '#C68A5C', '#8D5A3C', '#F6D6C2'];
    const HAAR = ['#2b2b2b', '#5a3a2a', '#8b5a2b', '#d9b36a', '#b0b0b0', '#c0392b'];
    const BROEK = ['#2f3e55', '#4a5568', '#6b7b8c', '#3b3b3b', '#7a5c3e', '#1f4e79', '#9aa5b1'];
    function person(color, h) {
        const w = document.createElement('div');
        w.className = 'om-p';
        w.style.height = h + 'px'; w.style.width = h * .45 + 'px';
        const huid = pick(HUID), haar = pick(HAAR), broek = pick(BROEK);
        const hairStyle = pick([
            `<path d="M4.4 5 q0 -5.5 4.6 -5.5 q4.6 0 4.6 5.5 q-1.5 -2.5 -4.6 -2.5 q-3.1 0 -4.6 2.5z" fill="${haar}"/>`,        // kort
            `<path d="M4.4 6 q0 -6.5 4.6 -6.5 q4.6 0 4.6 6.5 l0 6 l-2 0 l0 -4 q-2.6 -1.5 -5.2 0 l0 4 l-2 0 z" fill="${haar}"/>`, // lang
            `<path d="M4.6 4 q1 -4.6 4.4 -4.6 q3.4 0 4.4 4.6 q-2 -1.6 -4.4 -1.6 q-2.4 0 -4.4 1.6z" fill="${haar}"/>`,         // pet-achtig kort
            `<path d="M9 0.2 q5 0 4.8 5.6 q-1.8 -2.8 -4.8 -2.8 q-3 0 -4.8 2.8 q-0.2 -5.6 4.8 -5.6z M4 5 l10 0" fill="${haar}"/>` // bob
        ]);
        w.innerHTML = `<svg viewBox="0 0 18 40" width="${h * .45}" height="${h}" aria-hidden="true">
            <circle cx="9" cy="5" r="4.6" fill="${huid}"/>${hairStyle}
            <path d="M3 13 q6 -4 12 0 l1.5 13 h-3 l-0.3 -3 h-8.4 l-0.3 3 h-3 z" fill="${color}"/>
            <path d="M4.8 23 h8.4 l-1 15 h-3 l-0.2 -11 l-0.2 11 h-3 z" fill="${broek}"/></svg>`;
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

    // Bejaarden: grijs of wit haar, iets voorovergebogen, met een wandelstok of een rollator
    function oudje(color, h, hulp) {
        const w = document.createElement('div'); w.className = 'om-p';
        const huid = pick(HUID), haar = pick(['#d9d9d9', '#bdbdbd', '#f2f2f2', '#a8a8a8']), broek = pick(BROEK);
        const vw = hulp === 'rollator' ? 30 : 22;
        w.style.height = h + 'px'; w.style.width = h * vw / 40 + 'px';
        const kap = pick([`<path d="M4.4 5 q0 -5.5 4.6 -5.5 q4.6 0 4.6 5.5 q-1.5 -2.5 -4.6 -2.5 q-3.1 0 -4.6 2.5z" fill="${haar}"/>`,
            `<path d="M4.2 6.4 q-0.6 -6.8 4.8 -6.8 q5.4 0 4.8 6.8 q-1 -3 -4.8 -3.2 q-3.8 0.2 -4.8 3.2z" fill="${haar}"/><circle cx="9" cy="0.2" r="2" fill="${haar}"/>`]);
        const stok = `<path d="M14.6 20.5 q1 -1.4 2.2 -0.2 l1.2 19.6" fill="none" stroke="#7a5c3e" stroke-width="1.1" stroke-linecap="round"/>`;
        const rollator = `<path d="M15.5 21 h9.5 l2 17.4 M18.4 21 l-0.6 17.4 M18 31 h8" fill="none" stroke="#5a6a7e" stroke-width="1.1" stroke-linejoin="round"/>
            <path d="M18.4 26 h7.4 l-0.4 3 h-6.8 z" fill="#3d4a5c"/><circle cx="17.8" cy="38.6" r="1.4" fill="#2b2b2b"/><circle cx="27.4" cy="38.6" r="1.4" fill="#2b2b2b"/>`;
        w.innerHTML = `<svg viewBox="0 0 ${vw} 40" width="${h * vw / 40}" height="${h}" aria-hidden="true" style="overflow:visible">
            <g transform="rotate(7 9 39)"><circle cx="9" cy="5" r="4.6" fill="${huid}"/>${kap}
            <path d="M3 13 q6 -4 12 0 l1.5 13 h-3 l-0.3 -3 h-8.4 l-0.3 3 h-3 z" fill="${color}"/>
            <path d="M13.5 15 l1.6 5.8" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/><circle cx="15.2" cy="21" r="1.2" fill="${huid}"/></g>
            <path d="M4.8 23 h8.4 l-1 15 h-3 l-0.2 -11 l-0.2 11 h-3 z" fill="${broek}"/>
            ${hulp === 'rollator' ? rollator : stok}</svg>`;
        return w;
    }
    // Een ontmoeting: een groepje van links en een van rechts lopen naar hetzelfde punt,
    // staan even te kletsen, en gaan dan samen verder of ieder hun eigen kant op
    let active = 0; const chatting = [];
    function party(fromLeft, meet, color, speed) {
        const oud = chance(.2);                                  // af en toe twee bejaarden: langzamer
        const n = oud ? 2 : pick([1, 2, 2, 3]), width = W(), members = [];
        for (let i = 0; i < n; i++) {
            const h = oud ? rand(20.5, 23) : chance(.25) ? rand(13, 16) : rand(20, 25);
            const kleur = chance(.3) ? pick(KLEUR) : color;
            const p = oud ? oudje(kleur, h, i === 0 && chance(.6) ? 'rollator' : 'stok') : person(kleur, h);
            strip.appendChild(p);
            const off = oud ? i * rand(13, 16) : i * rand(8, 11), sp = oud ? speed * 1.8 : speed;
            const x0 = fromLeft ? -40 - off : width + 20 + off;
            const x1 = fromLeft ? meet - 9 - off : meet + 9 + off;
            const y = GROUND - h, f = fromLeft ? 1 : -1;
            p.style.transform = `translate(${x0}px, ${y}px) scaleX(${f})`;
            const b = bob(p, oud ? rand(620, 720) : rand(380, 460)), dur = Math.abs(x1 - x0) * sp;
            animate(p, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` },
                { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' });
            members.push({ p, b, x1, y, h, dur, f, sp });
        }
        return members;
    }
    function leave(members, dir, speed) {
        const width = W();
        members.forEach((m, i) => {
            m.b.play();
            const x2 = dir > 0 ? width + 40 + i * 9 : -60 - i * 9, d = Math.abs(x2 - m.x1) * (m.sp || speed);
            animate(m.p, [{ transform: `translate(${m.x1}px, ${m.y}px) scaleX(${dir})` },
                { transform: `translate(${x2}px, ${m.y}px) scaleX(${dir})` }], { duration: d, easing: 'linear' })
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
            const top = GROUND - Math.max(...all.map(m => m.h)) - 16;
            const bb = bubble(meet - 10, top, cl);
            const chat = { x: meet, top, bb }; chatting.push(chat);
            setTimeout(() => {
                chatting.splice(chatting.indexOf(chat), 1);
                animate(bb, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).finished.then(() => bb.remove()).catch(() => bb.remove());
                const together = chance(.45);
                if (together) { const dir = chance(.5) ? 1 : -1; leave(all.sort((a, b) => dir * (b.x1 - a.x1)), dir, speed); }
                else { leave(L, 1, speed); leave(R, -1, speed); }
                setTimeout(() => { active--; }, 1500);
            }, rand(3500, 6500));
        }, arrive + 100);
    }

    // Wielrenner: grijze racefiets, renner in clubshirt met zwarte broek, helm en gezicht.
    // De benen trappen echt rond: knie en voet volgen de pedalen (eenvoudige twee-botten-berekening).
    const trappers = new Set();
    function racer(color) {
        const w = document.createElement('div'); w.className = 'om-p';
        const huid = pick(HUID), helm = pick(['#ffffff', '#16233a', '#F2C318', color]);
        const wiel = cx => `<g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="${cx}" cy="30" r="8.2" fill="none" stroke="#2b2b2b" stroke-width="1.9"/><circle cx="${cx}" cy="30" r="6.9" fill="none" stroke="#b8c0cc" stroke-width=".5"/><path d="M${cx} 22.4v15.2M${cx - 7.6} 30h15.2M${cx - 5.4} 24.6l10.8 10.8M${cx + 5.4} 24.6l-10.8 10.8" stroke="#9aa5b1" stroke-width=".45"/></g>`;
        w.innerHTML = `<svg viewBox="0 0 60 40" width="38" height="25" aria-hidden="true" style="overflow:visible">
            <path class="legB" d="" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>
            ${wiel(12)}${wiel(48)}
            <path d="M12 30 L28 30 L22.5 15.5 Z M22.5 15.5 L42 15.5 L28 30 M42 15.5 L48 30" fill="none" stroke="#8a96a6" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M42 15.5 l3.6 -1.2 q2.8 0 2.4 3 q-0.4 2.6 -2.6 2.6" fill="none" stroke="#3d4a5c" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M19.5 14.6 h6.5" stroke="#2b2b2b" stroke-width="1.8" stroke-linecap="round"/>
            <path class="crank" d="" stroke="#3d4a5c" stroke-width="1.3" stroke-linecap="round"/><circle cx="28" cy="30" r="1.8" fill="#3d4a5c"/>
            <path d="M23.5 13.5 Q30 8.6 39.5 9.6" fill="none" stroke="${color}" stroke-width="5.6" stroke-linecap="round"/>
            <path d="M21.6 13.6 q2 -2.6 4.6 -1.4 l-0.4 3.6 h-4.6 z" fill="#2b2b2b"/>
            <path class="legA" d="" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M39 10 L42.4 13 L45.4 14.4" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="45.6" cy="14.6" r="1.1" fill="${huid}"/>
            <circle cx="44" cy="7.2" r="3.3" fill="${huid}"/>
            <path d="M40.2 7 q0.4 -4.8 4.6 -4.6 q3.4 0.4 3.4 3.4 l-2.2 0.4 q-1.6 -1.4 -5.8 0.8 z" fill="${helm}" stroke="#16233a" stroke-width=".35"/>
            <circle cx="46" cy="7" r=".55" fill="#16233a"/></svg>`;
        const rider = { w, a: w.querySelector('.legA'), b: w.querySelector('.legB'), c: w.querySelector('.crank'), phase: rand(0, 6.28) };
        trappers.add(rider);
        return rider;
    }
    function been(hx, hy, px, py) {                         // heup -> knie -> voet, knie naar voren
        const L1 = 10.6, L2 = 10.2, dx = px - hx, dy = py - hy, d = Math.min(Math.hypot(dx, dy), L1 + L2 - .01);
        const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
        const bx = hx + a * dx / d, by = hy + a * dy / d;
        let kx = bx - h * dy / d, ky = by + h * dx / d;
        const k2x = bx + h * dy / d, k2y = by - h * dx / d; if (k2x > kx) { kx = k2x; ky = k2y; }
        return `M${hx} ${hy} L${kx.toFixed(2)} ${ky.toFixed(2)} L${px.toFixed(2)} ${py.toFixed(2)} l2.4 0`;
    }
    let trapLoop = null;
    function trap(t) {
        if (!trappers.size) { trapLoop = null; return; }
        trappers.forEach(r => {
            if (!r.w.isConnected) { trappers.delete(r); return; }
            const th = r.phase + t / 1000 * 2 * Math.PI * 1.9, R = 4.6;
            const ax = 28 + R * Math.cos(th), ay = 30 + R * Math.sin(th), bx = 28 - R * Math.cos(th), by = 30 - R * Math.sin(th);
            r.a.setAttribute('d', been(23.5, 13.6, ax, ay)); r.b.setAttribute('d', been(23.5, 13.6, bx, by));
            r.c.setAttribute('d', `M${ax.toFixed(2)} ${ay.toFixed(2)} L${bx.toFixed(2)} ${by.toFixed(2)}`);
        });
        trapLoop = requestAnimationFrame(trap);
    }
    function startTrappen() { if (!trapLoop) trapLoop = requestAnimationFrame(trap); }
    // Peloton: vijf renners dicht achter elkaar, snel
    function peloton() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, y = GROUND - 25 + 1.2;
        const dur = (width + 300 + EX) * 4.5;
        for (let i = 0; i < 5; i++) {
            const w = racer(pick(KLEUR)).w; strip.appendChild(w); startTrappen();
            w.querySelectorAll('.wheel').forEach(g => animate(g, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 420, iterations: Infinity, easing: 'linear' }));
            const off = i * 40 + (i % 2) * 6;
            const x0 = fromLeft ? -60 - off : width + 20 + off, x1 = fromLeft ? width + 40 + EX - off * .2 : -80 - EX + off * .2;
            animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
                .finished.then(() => w.remove()).catch(() => w.remove());
        }
    }

    // Fanfare: een rij muzikanten marcheert in de maat, met muzieknootjes
    function musician(color, kind, h) {
        const w = document.createElement('div'); w.className = 'om-p';
        const inst = kind === 'drum' ? `<circle cx="16" cy="24" r="6" fill="#fff" stroke="#111" stroke-width="1.5"/><path d="M12 22h8" stroke="#111" stroke-width="1.2"/>`
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
        const n = 6, h = 23, y = GROUND - h, speed = 24, dur = (width + 200 + EX) * speed;
        const kinds = ['drum', 'trumpet', 'trumpet', 'horn', 'trumpet', 'horn'];   // trom voorop
        const members = [];
        for (let i = 0; i < n; i++) {
            const w = musician(color, kinds[i], h); strip.appendChild(w);
            const off = i * 15, x0 = fromLeft ? -40 - off : width + 20 + off, x1 = fromLeft ? width + 40 + EX - off : -60 - EX + off;
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

    // Naturisten (ALB): een rozig groepje slentert ontspannen voorbij met een handdoek over de schouder.
    // Kletsende groepjes die ze passeren kijken even op (wolkje wordt "!"), een van de naturisten zwaait.
    function naturist(h, male, female) {
        const w = document.createElement('div'); w.className = 'om-p';
        const skin = pick(['#F2B5A0', '#E8A58E', '#F6C6B2']);
        w.innerHTML = `<svg viewBox="0 0 22 40" width="${h * .55}" height="${h}" aria-hidden="true">
            ${female ? '<path d="M4.2 6 q0 -6.8 4.8 -6.8 q4.8 0 4.8 6.8 l0.6 8 l-2.4 0 l-0.4 -6 q-2.6 -1 -5.2 0 l-0.4 6 l-2.4 0 z" fill="#5a3a2a"/>' : ''}
            <circle cx="9" cy="5" r="4.6" fill="${skin}"/>
            <path d="M3 13 q6 -4 12 0 l1.5 13 h-3 l-1 12 h-3 l-0.5 -11 l-0.5 11 h-3 l-1 -12 h-3 z" fill="${skin}"/>
            <path d="M12 11 l6 2 l-1 13 l-3 0.5 z" fill="#ffffff" stroke="#9DC3E6" stroke-width=".8"/>
            <path d="M14 14 h3 M14 17 h3 M14 20 h3" stroke="#9DC3E6" stroke-width=".8"/>
            <path d="M5.2 3.2 q3.8 -3.2 7.6 0" fill="none" stroke="#5a3a2a" stroke-width="1.3"/>
            <circle cx="7.4" cy="5.4" r=".7" fill="#2b2b2b"/><circle cx="10.6" cy="5.4" r=".7" fill="#2b2b2b"/>
            ${female ? '<circle cx="6.3" cy="16.8" r="2.1" fill="' + skin + '" stroke="#D98B70" stroke-width=".5"/><circle cx="11.7" cy="16.8" r="2.1" fill="' + skin + '" stroke="#D98B70" stroke-width=".5"/><circle cx="6.3" cy="17.2" r=".7" fill="#D98B70"/><circle cx="11.7" cy="17.2" r=".7" fill="#D98B70"/><path d="M7.2 25.2 l1.8 2.4 l1.8 -2.4 z" fill="#5a3a2a"/>' : '<circle cx="6.4" cy="16.5" r=".9" fill="#D98B70"/><circle cx="11.6" cy="16.5" r=".9" fill="#D98B70"/>'}
            ${male ? '<circle cx="8.2" cy="27.4" r="1.1" fill="#D98B70"/><circle cx="9.9" cy="27.4" r="1.1" fill="#D98B70"/><path d="M9 26.3 v4.2" stroke="#D98B70" stroke-width="1.5" stroke-linecap="round"/>' : ''}</svg>`;
        return w;
    }
    function naturists() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, n = pick([3, 4, 5]);
        const speed = 26, dur = (width + 160 + EX) * speed, members = [];
        const hs = []; for (let i = 0; i < n; i++) hs.push(rand(21, 25));                   // alleen volwassenen
        const tallest = hs.indexOf(Math.max(...hs));
        const adults = hs.map((h, i) => i).filter(i => i !== tallest && hs[i] >= 20);
        const woman = adults.length ? pick(adults) : -1;
        for (let i = 0; i < n; i++) {
            const h = hs[i], w = naturist(h, i === tallest, i === woman); strip.appendChild(w);
            const off = i * rand(11, 14), y = GROUND - h;
            const x0 = fromLeft ? -40 - off : width + 20 + off, x1 = fromLeft ? width + 40 + EX - off : -60 - EX + off;
            animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
                .finished.then(() => w.remove()).catch(() => w.remove());
            const b = bob(w, rand(520, 640));
            members.push({ w, x0, x1, b });
            if (i === 0) {                                   // de voorste zwaait af en toe
                const arm = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                arm.setAttribute('d', 'M14 13 l5 -7'); arm.setAttribute('stroke', '#F2B5A0'); arm.setAttribute('stroke-width', '2.4'); arm.setAttribute('stroke-linecap', 'round');
                arm.style.transformBox = 'fill-box'; arm.style.transformOrigin = '0% 100%';
                w.firstElementChild.appendChild(arm);
                animate(arm, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(25deg)' }], { duration: 350, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
            }
        }
        const t0 = performance.now(), seen = new Set();
        const tick = setInterval(() => {
            const p = (performance.now() - t0) / dur; if (p >= 1) { clearInterval(tick); return; }
            const x = members[0].x0 + (members[0].x1 - members[0].x0) * p;
            chatting.forEach(c => {
                if (seen.has(c) || Math.abs(c.x - x) > 60) return;
                seen.add(c);
                c.bb.innerHTML = '<b style="font:700 11px/1 Inter,sans-serif;color:#16233a">!</b>';
                c.bb.style.borderColor = '#D64541';
                animate(c.bb, [{ transform: c.bb.style.transform + ' scale(1)' }, { transform: c.bb.style.transform + ' scale(1.35)' }, { transform: c.bb.style.transform + ' scale(1)' }], { duration: 500 });
            });
        }, 200);
    }

    // Carnaval: de prins met steek voorop, daarachter de Raad van Elf met pruiken, in polonaise
    const CARN = ['#D81E1E', '#F2C318', '#1E9E3E'];
    const PRUIK = ['#FF2BB3', '#7A3BFF', '#1FD2FF', '#39FF6E', '#FF8A00', '#FFE600'];
    function reveler(i) {
        const w = document.createElement('div'); w.className = 'om-p';
        const huid = pick(HUID), shirt = CARN[i % 3], broek = CARN[(i + 1) % 3], pruik = pick(PRUIK);
        w.innerHTML = `<svg viewBox="0 0 22 40" width="12" height="22" aria-hidden="true">
            <circle cx="9" cy="6" r="4.6" fill="${huid}"/>
            <path d="M2.5 7 q0 -8 6.5 -8 q6.5 0 6.5 8 q-1 -2 -2.5 -1 q-1 -3 -4 -3 q-3 0 -4 3 q-1.5 -1 -2.5 1z M2.5 7 q-1 4 1 7 M15.5 7 q1 4 -1 7" fill="${pruik}" stroke="${pruik}" stroke-width="1.4" stroke-linejoin="round"/>
            <path d="M3 14 q6 -4 12 0 l1.5 12 h-3 l-0.3 -3 h-8.4 l-0.3 3 h-3 z" fill="${shirt}"/>
            <path d="M4.8 23 h8.4 l-1 15 h-3 l-0.2 -11 l-0.2 11 h-3 z" fill="${broek}"/>
            <path d="M14.5 15 l6 -4" stroke="${huid}" stroke-width="2.2" stroke-linecap="round"/></svg>`;
        return w;
    }
    function prince() {
        const w = document.createElement('div'); w.className = 'om-p';
        const huid = pick(HUID);
        w.innerHTML = `<svg viewBox="0 0 26 40" width="14" height="22" aria-hidden="true">
            <path d="M6 10 q0 -4 2 -3 l-1 -5 q6 3 12 0 l-1 5 q2 -1 2 3 z" fill="#111"/>
            <path d="M17 2 q4 -4 6 -1 q-2 0 -3 3" fill="#fff" stroke="#ddd" stroke-width=".6"/>
            <circle cx="13" cy="10" r="4.4" fill="${huid}"/>
            <path d="M6 18 q7 -4 14 0 l3 14 h-3 l-1.5 -9 l-11 0 l-1.5 9 h-3 z" fill="#D81E1E"/>
            <path d="M7 18 q6 -4 12 0 l1.5 12 h-3 l-0.3 -3 h-8.4 l-0.3 3 h-3 z" fill="#111"/>
            <path d="M9.5 15 h7 M8.5 20 h9" stroke="#F2C318" stroke-width="1.6"/>
            <path d="M8.8 27 h8.4 l-1 11 h-3 l-0.2 -8 l-0.2 8 h-3 z" fill="#fff"/>
            <path d="M20 19 l5 -6" stroke="#F2C318" stroke-width="2" stroke-linecap="round"/><circle cx="25" cy="12" r="1.6" fill="#F2C318"/></svg>`;
        return w;
    }
    function carnaval() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, speed = 22, dur = (width + 260 + EX) * speed;
        for (let i = 0; i < 12; i++) {
            const w = i === 0 ? prince() : reveler(i - 1); strip.appendChild(w);
            const off = i * 13 + (i ? 4 : 0), h = 22, y = GROUND - h;
            const x0 = fromLeft ? -40 - off : width + 20 + off, x1 = fromLeft ? width + 60 + EX - off : -80 - EX + off;
            animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
                .finished.then(() => w.remove()).catch(() => w.remove());
            // polonaise: hossen in de maat, om en om naar links en rechts
            animate(w.firstElementChild, [{ transform: 'translate(-2px, 0) rotate(-6deg)' }, { transform: 'translate(0, -2.5px) rotate(0deg)' }, { transform: 'translate(2px, 0) rotate(6deg)' }],
                { duration: 520, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: -(i % 2) * 520 });
        }
        // confetti boven de stoet
        const t0 = performance.now();
        const tick = setInterval(() => {
            const p = (performance.now() - t0) / dur; if (p >= 1) { clearInterval(tick); return; }
            const x = (fromLeft ? -40 : width + 20) + f * (width + 100) * p - f * rand(-6, 165);   // boven de stoet, van prins tot staart
            const c = document.createElement('div'); c.className = 'om-conf'; c.style.background = pick(CARN.concat(PRUIK)); strip.appendChild(c);
            animate(c, [{ transform: `translate(${x}px, ${GROUND - 44}px) rotate(0deg)`, opacity: 0 }, { transform: `translate(${x + rand(-3, 3)}px, ${GROUND - 36}px) rotate(90deg)`, opacity: 1, offset: .15 }, { transform: `translate(${x - f * rand(4, 14)}px, ${GROUND - 4}px) rotate(${rand(360, 720)}deg)`, opacity: .3 }], { duration: rand(1500, 2300), easing: 'ease-in' })
                .finished.then(() => c.remove()).catch(() => c.remove());
        }, 160);
    }

    // Schaatsers: drie in een treintje in de klassieke houding: diep door de knieen, platte rug,
    // handen op de rug. Om de beurt zet een been af naar achteren en komt laag weer naar voren;
    // de lange schaats blijft daarbij plat op het ijs.
    function skater(color) {
        const w = document.createElement('div'); w.className = 'om-p';
        const huid = pick(HUID), muts = pick(['#D64541', '#1b4f9c', '#F39A2B', '#2BB39A', '#16233a']), pak = color;
        const leg = (cls, op) => `<g class="${cls}" style="transform-box:view-box;transform-origin:15px 23px" opacity="${op}">
              <path d="M15 23 L21.5 29.5 L17.2 36.4" fill="none" stroke="${pak}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
              <g class="blade"><path d="M15 35.6 h5 l0.6 1.6 h-5.8 z" fill="#2b2b2b"/><path d="M11.4 38.2 h13.4 q1 0 1 -0.8" fill="none" stroke="#8a96a6" stroke-width="1.1" stroke-linecap="round"/></g></g>`;
        w.innerHTML = `<svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true" style="overflow:visible">
            ${leg('legB', .6)}
            <g class="torso" style="transform-box:view-box;transform-origin:15px 23px">
              <path d="M14.6 23.2 Q21 17.6 29.2 17.8" fill="none" stroke="${pak}" stroke-width="6.4" stroke-linecap="round"/>
              <path d="M28.4 18.2 L25.2 13.8 L19.4 19.4" fill="none" stroke="${pak}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="19" cy="19.6" r="1.4" fill="${huid}"/>
              <circle cx="33.2" cy="15.8" r="3.7" fill="${huid}"/>
              <path d="M29.4 15.4 q0.2 -4.8 4.2 -4.6 q3.2 0.3 3.4 3.4 q-3.6 -1.6 -7.6 1.2 z" fill="${muts}"/>
              <circle cx="35.6" cy="16" r=".55" fill="#16233a"/>
            </g>
            ${leg('legA', 1)}</svg>`;
        return w;
    }
    function skaters() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, dur = (width + 200 + EX) * 7.5;
        const colors = [pick(KLEUR), pick(KLEUR), pick(KLEUR)];
        for (let i = 0; i < 3; i++) {
            const w = skater(colors[i]); strip.appendChild(w);
            const off = i * 34, y = GROUND - 26 + 0.6;
            const x0 = fromLeft ? -60 - off : width + 20 + off, x1 = fromLeft ? width + 40 + EX - off : -80 - EX + off;
            animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
                .finished.then(() => w.remove()).catch(() => w.remove());
            const T = 1400, d = -i * 230;
            // een slag: 0-55% krachtig afzetten naar achteren, 55-100% laag en snel terughalen
            const stroke = [{ transform: 'rotate(-4deg)', easing: 'ease-in' }, { transform: 'rotate(52deg)', offset: .55, easing: 'ease-out' },
                { transform: 'translate(0,-1.8px) rotate(22deg)', offset: .78 }, { transform: 'rotate(-4deg)' }];
            const flat = [{ transform: 'rotate(4deg)', easing: 'ease-in' }, { transform: 'rotate(-52deg)', offset: .55, easing: 'ease-out' },
                { transform: 'rotate(-22deg)', offset: .78 }, { transform: 'rotate(4deg)' }];
            ['legA', 'legB'].forEach((c, j) => {
                const g = w.querySelector('.' + c), bl = g.querySelector('.blade');
                bl.style.transformBox = 'fill-box'; bl.style.transformOrigin = '40% 50%';
                const o = { duration: T, iterations: Infinity, delay: d - j * T / 2 };
                animate(g, stroke, o); animate(bl, flat, o);
            });
            // romp zakt bij elke afzet iets en glijdt een tikje vooruit
            animate(w.querySelector('.torso'), [{ transform: 'translate(0,0)' }, { transform: 'translate(1.2px,1px)', offset: .3 }, { transform: 'translate(0,0)', offset: .5 }, { transform: 'translate(1.2px,1px)', offset: .8 }, { transform: 'translate(0,0)' }], { duration: T, iterations: Infinity, easing: 'ease-in-out', delay: d });
        }
    }

    // Yogi: drie mediterende figuren in lotushouding, handen tegen elkaar, zweven langzaam voorbij
    function yogi() {
        const w = document.createElement('div'); w.className = 'om-p';
        const huid = pick(HUID), kleur = pick(['#2BB39A', '#7B5CC4', '#F39A2B', '#5C9BD6', '#C9A227']), haar = pick(HAAR);
        w.innerHTML = `<svg viewBox="0 0 30 30" width="18" height="18" aria-hidden="true">
            <ellipse cx="15" cy="27.5" rx="12" ry="1.6" fill="#16233a" opacity=".08"/>
            <path d="M4 25 q0 -5 7 -6 l4 0 l4 0 q7 1 7 6 q-5 1.5 -11 1.5 q-6 0 -11 -1.5 z" fill="${kleur}"/>
            <path d="M6.5 24.6 q3 -4.5 8.5 -3 M23.5 24.6 q-3 -4.5 -8.5 -3" fill="none" stroke="${huid}" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M10 20 q0 -8 5 -9 q5 1 5 9 z" fill="${kleur}"/>
            <path d="M10.5 13 q-2.5 4 -0.5 8 M19.5 13 q2.5 4 0.5 8" fill="none" stroke="${huid}" stroke-width="2" stroke-linecap="round"/>
            <path d="M15 17.5 l-1.4 4.2 l2.8 0 z" fill="${huid}"/>
            <circle cx="15" cy="7.5" r="4" fill="${huid}"/>
            <path d="M11 7 q0 -5 4 -5 q4 0 4 5 q-1.5 -2.2 -4 -2.2 q-2.5 0 -4 2.2z" fill="${haar}"/>
            <path d="M13.3 8.2 q0.6 0.5 1.2 0 M15.5 8.2 q0.6 0.5 1.2 0" stroke="#2b2b2b" stroke-width=".6" fill="none" stroke-linecap="round"/></svg>`;
        return w;
    }
    function yogis() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, dur = (width + 200 + EX) * 40;
        for (let i = 0; i < 3; i++) {
            const w = yogi(); strip.appendChild(w);
            const off = i * 30, y = GROUND - 18 + 1;
            const x0 = fromLeft ? -40 - off : width + 20 + off, x1 = fromLeft ? width + 40 + EX - off : -60 - EX + off;
            animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
                .finished.then(() => w.remove()).catch(() => w.remove());
            animate(w.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }], { duration: 2400, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: -i * 800 });
        }
        // af en toe een klein "om"-kringetje dat opstijgt
        const t0 = performance.now();
        const tick = setInterval(() => {
            const p = (performance.now() - t0) / dur; if (p >= 1) { clearInterval(tick); return; }
            const x = (fromLeft ? -40 : width + 20) + f * (width + 80 + EX) * p - f * rand(0, 70);
            const c = document.createElement('div'); c.className = 'om-ring'; strip.appendChild(c);
            animate(c, [{ transform: `translate(${x}px, ${GROUND - 26}px) scale(.4)`, opacity: .6 }, { transform: `translate(${x}px, ${GROUND - 46}px) scale(1.2)`, opacity: 0 }], { duration: 2600, easing: 'ease-out' })
                .finished.then(() => c.remove()).catch(() => c.remove());
        }, 1800);
    }

    // Voetballers van ASV '65: groen-witte shirts, witte broek, groene kousen. Drie spelers joggen voorbij
    // en spelen de bal over naar elkaar.
    function footballer() {
        const w = document.createElement('div'); w.className = 'om-p';
        const huid = pick(HUID), haar = pick(HAAR);
        const leg = cls => `<g class="${cls}" style="transform-box:view-box;transform-origin:9px 24px"><path d="M9 24 l-0.5 6" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/><path d="M8.5 30 l-0.3 7" stroke="#1E9E3E" stroke-width="2.8" stroke-linecap="round"/><path d="M6.8 37.5 h4" stroke="#222" stroke-width="2" stroke-linecap="round"/></g>`;
        w.innerHTML = `<svg viewBox="0 0 18 40" width="11" height="24" aria-hidden="true">
            ${leg('legA')}${leg('legB')}
            <path d="M3 13 q6 -4 12 0 l1.5 12 h-15 z" fill="#ffffff"/>
            <path d="M6.2 11.2 h5.6 l1 13.8 h-7.6 z" fill="#1E9E3E"/>
            <path d="M2.8 25 h12.4 l-0.6 4 h-11.2 z" fill="#ffffff"/>
            <path d="M3.5 14 l-1.5 8 M14.5 14 l1.5 8" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="9" cy="5" r="4.6" fill="${huid}"/>
            <path d="M4.4 5 q0 -5.5 4.6 -5.5 q4.6 0 4.6 5.5 q-1.5 -2.5 -4.6 -2.5 q-3.1 0 -4.6 2.5z" fill="${haar}"/></svg>`;
        return w;
    }
    function footballers() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, speed = 11, dur = (width + 220) * speed;
        const players = [];
        for (let i = 0; i < 3; i++) {
            const w = footballer(); strip.appendChild(w);
            const off = i * 44, y = GROUND - 24;
            const x0 = fromLeft ? -40 - off : width + 20 + off, x1 = fromLeft ? width + 60 - off : -80 + off;
            animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
                .finished.then(() => w.remove()).catch(() => w.remove());
            const T = 420, d = -i * 140;
            animate(w.querySelector('.legA'), [{ transform: 'rotate(-32deg)' }, { transform: 'rotate(32deg)' }], { duration: T, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: d });
            animate(w.querySelector('.legB'), [{ transform: 'rotate(32deg)' }, { transform: 'rotate(-32deg)' }], { duration: T, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: d });
            animate(w.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }], { duration: T / 2, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: d });
            players.push({ x0, x1 });
        }
        // de bal: om de beurt naar een andere speler, met een boogje
        const ball = document.createElement('div'); ball.className = 'om-ball'; strip.appendChild(ball);
        const t0 = performance.now(), pos = (p, tm) => p.x0 + (p.x1 - p.x0) * Math.min(1, (tm - t0) / dur) + f * 6;
        let holder = 0;
        function pass() {
            const now = performance.now(); if (now - t0 > dur - 800) { ball.remove(); return; }
            let next; do { next = Math.floor(Math.random() * 3); } while (next === holder);
            const flight = 520, xa = pos(players[holder], now), xb = pos(players[next], now + flight);
            animate(ball, [{ transform: `translate(${xa}px, ${GROUND - 7}px)` }, { transform: `translate(${(xa + xb) / 2}px, ${GROUND - 18}px)`, offset: .5 }, { transform: `translate(${xb}px, ${GROUND - 7}px)` }], { duration: flight, easing: 'linear' });
            holder = next;
            // bal rolt even mee met de ontvanger, dan de volgende pass
            const hold = rand(500, 1100), startHold = now + flight;
            const roll = setInterval(() => { const n = performance.now(); if (n >= startHold + hold) { clearInterval(roll); pass(); return; } ball.style.transform = `translate(${pos(players[holder], n)}px, ${GROUND - 7}px)`; }, 40);
            setTimeout(() => {}, 0);
        }
        setTimeout(pass, 600);
    }

    if (REDUCE) {                                   // stil beeld: twee groepjes die praten
        [[.3, 3], [.68, 2]].forEach(([f, n]) => {
            const c = pick(KLEUR);
            for (let i = 0; i < n; i++) { const h = 22; const p = person(c, h); p.style.transform = `translate(${W() * f + i * 10}px, ${GROUND - h}px) scaleX(${i ? -1 : 1})`; strip.appendChild(p); }
            bubble(W() * f + 4, GROUND - 38, c);
        });
        return;
    }
    // Schoolklasje: een begeleider voorop en een achteraan, ertussen kinderen die rommelig huppelen.
    // Iedereen in een feloranje hesje met reflecterende band.
    function hesje(h) {
        const w = person('#FF6A00', h);
        const svg = w.firstElementChild;
        svg.insertAdjacentHTML('beforeend', '<path d="M3.6 18.5 h10.8" stroke="#F4F4F4" stroke-width="1.6"/><path d="M3.3 21.5 h11.4" stroke="#F4F4F4" stroke-width="1.2" opacity=".8"/>');
        return w;
    }
    function klasje() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1;
        const nKids = pick([6, 7, 8]), speed = 22, dur = (width + 220 + EX) * speed;
        const rij = [{ h: rand(23, 25), kid: false }];
        for (let i = 0; i < nKids; i++) rij.push({ h: rand(12, 15.5), kid: true });
        rij.push({ h: rand(22, 25), kid: false });
        let off = 0;
        rij.forEach((m, i) => {
            const w = hesje(m.h); strip.appendChild(w);
            off += i === 0 ? 0 : (m.kid && rij[i - 1].kid ? rand(5, 11) : rand(12, 16));
            const y = GROUND - m.h;
            const x0 = fromLeft ? -40 - off : width + 20 + off, x1 = fromLeft ? width + 40 + EX - off : -60 - EX + off;
            animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
                .finished.then(() => w.remove()).catch(() => w.remove());
            if (m.kid) {                                    // huppelen: elk kind in een eigen ritme, met wat heen-en-weer
                animate(w.firstElementChild, [{ transform: 'translate(0, 0)' }, { transform: `translate(${rand(-3, 3)}px, -${rand(2.5, 5)}px)` }],
                    { duration: rand(230, 380), direction: 'alternate', iterations: Infinity, easing: 'ease-out', delay: rand(0, 300) });
            } else bob(w, rand(420, 500));
        });
    }
    // Voetballer in korte broek loopt rustig voorbij en houdt de bal hoog met zijn hoofd
    function voetballer() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, h = 24, y = GROUND - h;
        const huid = pick(HUID), haar = pick(HAAR), shirt = '#1E9E3E';   // ASV '65: groen-wit
        const w = document.createElement('div'); w.className = 'om-p';
        w.style.height = h + 'px'; w.style.width = h * .45 + 'px';
        w.innerHTML = `<svg viewBox="0 0 18 40" width="${h * .45}" height="${h}" aria-hidden="true" style="overflow:visible">
            <circle cx="9" cy="5" r="4.6" fill="${huid}"/><path d="M4.4 5 q0 -5.5 4.6 -5.5 q4.6 0 4.6 5.5 q-1.5 -2.5 -4.6 -2.5 q-3.1 0 -4.6 2.5z" fill="${haar}"/>
            <path d="M3 13 q6 -4 12 0 l1.5 9 h-3 l-0.3 -2 h-8.4 l-0.3 2 h-3 z" fill="#ffffff"/>
            <path d="M6.3 11.3 h5.4 l0.9 8.7 h-7.2 z" fill="${shirt}"/>
            <path d="M3 13 l1.5 9 h-3 z M15 13 l1.5 9 h-3 z" fill="${shirt}"/>
            <path d="M4.8 20 h8.4 l0.5 6 h-3.8 l-0.9 -2.6 l-0.9 2.6 h-3.8 z" fill="#ffffff"/>
            <path d="M5.4 26 h2.7 l-0.2 8.5 h-2.5 z M9.9 26 h2.7 l0.2 8.5 h-2.5 z" fill="${huid}"/>
            <path d="M5.4 33 h2.5 v3.5 h-2.5 z M10.1 33 h2.5 v3.5 h-2.5 z" fill="${shirt}"/>
            <path d="M4.6 36.5 h3.4 l0.6 3.5 h-4.8 z M10 36.5 h3.4 l1.6 3.5 h-5.2 z" fill="#1d1d1d"/></svg>`;
        const bal = document.createElement('div');
        bal.style.cssText = 'position:absolute;left:2.1px;top:-6.6px;width:6.6px;height:6.6px';
        bal.innerHTML = '<svg viewBox="0 0 10 10" width="6.6" height="6.6" aria-hidden="true"><circle cx="5" cy="5" r="4.6" fill="#fff" stroke="#16233a" stroke-width=".9"/><path d="M5 2.8 l2 1.5 l-0.8 2.4 h-2.4 l-0.8 -2.4 z" fill="#16233a"/></svg>';
        w.appendChild(bal); strip.appendChild(w);
        const dur = (width + 100) * 30, T = 760;
        const x0 = fromLeft ? -40 : width + 20, x1 = fromLeft ? width + 40 : -60;
        animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
            .finished.then(() => w.remove()).catch(() => w.remove());
        // bal: omhoog (afremmen), omlaag (versnellen), tik op het hoofd
        animate(bal, [{ transform: 'translateY(0) rotate(0deg)', easing: 'cubic-bezier(.2,.7,.4,1)' },
            { transform: 'translateY(-11px) rotate(180deg)', offset: .5, easing: 'cubic-bezier(.6,0,.8,.3)' },
            { transform: 'translateY(0) rotate(360deg)' }], { duration: T, iterations: Infinity });
        // hoofd en lijf geven een tikje mee op het moment dat de bal landt
        animate(w.firstElementChild, [{ transform: 'translateY(-1.6px)' }, { transform: 'translateY(0)', offset: .18 },
            { transform: 'translateY(0.6px)', offset: .8 }, { transform: 'translateY(-1.6px)' }], { duration: T, iterations: Infinity, easing: 'ease-in-out' });
    }
    // Hardloopsters: een soepel groepje met blonde paardenstaarten, achteraan een steviger loopster die goed bijblijft
    function runner(h, thick) {
        const w = document.createElement('div'); w.className = 'om-p';
        const top = pick(['#D64541', '#7B5CC4', '#3B8FE0', '#2BB39A', '#FF4F9A']), tight = pick(['#16233a', '#2f3e55', '#3b3b3b']);
        const huid = pick(HUID), blond = pick(['#E9C46A', '#F1D27B', '#E2BC5C']), k = thick ? 1.7 : 1;
        const torso = thick ? 'M5 12.6 q7 -4.6 14 0 q2.4 5.5 1.4 11.6 h-16.8 q-1 -6.1 1.4 -11.6 z' : 'M8 13 q4 -3 8 0 l0.6 11 h-9.2 z';
        const shorts = thick ? 'M3.8 22 h16.4 l0.4 5 h-17.2 z' : 'M7.3 22 h9.4 l0.5 4 h-10.4 z';
        const leg = `fill="none" stroke="${tight}" stroke-width="${2.6 * k}" stroke-linecap="round" stroke-linejoin="round"`;
        const arm = `fill="none" stroke="${huid}" stroke-width="${1.9 * k}" stroke-linecap="round" stroke-linejoin="round"`;
        w.innerHTML = `<svg viewBox="0 0 24 40" width="${h * .6}" height="${h}" aria-hidden="true" style="overflow:visible"><g transform="rotate(6 12 38)">
            <path class="armB" d="M12 14 l-1.5 5 l3.5 3" ${arm} opacity=".75"/>
            <path class="legB" d="M12 24 l1.2 7 l-2 7" ${leg} opacity=".8"/>
            <path d="${torso}" fill="${top}"/><path d="${shorts}" fill="${tight}"/>
            <path class="legA" d="M12 24 l1.2 7 l-2 7" ${leg}/>
            <path class="armA" d="M12 14 l-1.5 5 l3.5 3" ${arm}/>
            <path class="pony" d="M8.2 3.6 q-5.2 0.6 -6 6.4 q2.2 -2.4 6.4 -4 z" fill="${blond}"/>
            <circle cx="12" cy="6" r="${thick ? 4.9 : 4.4}" fill="${huid}"/>
            <path d="M7.6 6 q0 -5 4.4 -5 q4.4 0 4.4 5 q-1.6 -2.3 -4.4 -2.3 q-2.8 0 -4.4 2.3z" fill="${blond}"/></g></svg>`;
        return w;
    }
    function hardloopsters() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, speed = 9, dur = (width + 180 + EX) * speed;
        const n = pick([4, 5]); let off = 0;
        for (let i = 0; i <= n; i++) {
            const thick = i === n, h = thick ? rand(22.5, 24) : rand(22.5, 25);
            const w = runner(h, thick); strip.appendChild(w);
            off += i === 0 ? 0 : (thick ? rand(18, 24) : rand(12, 17));
            const y = GROUND - h;
            const x0 = fromLeft ? -40 - off : width + 20 + off, x1 = fromLeft ? width + 40 + EX - off : -60 - EX + off;
            animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
                .finished.then(() => w.remove()).catch(() => w.remove());
            const T = thick ? 460 : rand(380, 430), d = -rand(0, T), o = { iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', delay: d };
            const swing = (sel, a, b, origin, dd) => { const el = w.querySelector(sel); el.style.transformBox = 'fill-box'; el.style.transformOrigin = origin;
                animate(el, [{ transform: `rotate(${a}deg)` }, { transform: `rotate(${b}deg)` }], Object.assign({}, o, { duration: dd })); };
            swing('.legA', -32, 32, '50% 0%', T / 2); swing('.legB', 32, -32, '50% 0%', T / 2);
            swing('.armA', 38, -38, '50% 0%', T / 2); swing('.armB', -38, 38, '50% 0%', T / 2);
            swing('.pony', 6, -22, '100% 0%', T / 4);
            animate(w.firstElementChild, [{ transform: 'translateY(0)' }, { transform: `translateY(-${thick ? 1.5 : 2}px)` }], Object.assign({}, o, { duration: T / 4 }));
        }
    }
    // Hondenuitlaters: een baasje met een hondje aan de lijn. Komen er twee elkaar tegen, dan snuffelen
    // de hondjes aan elkaar en kletsen de baasjes even, daarna loopt ieder door.
    const VACHT = ['#8b5a2b', '#2b2b2b', '#d9b36a', '#f4efe6', '#a0522d', '#6b6b6b'];
    function baasMetHond() {
        const h = rand(21, 24.5), w = document.createElement('div'); w.className = 'om-p';
        w.style.width = '34px'; w.style.height = h + 'px';
        const pers = person(pick(KLEUR), h); pers.style.position = 'absolute'; pers.style.left = '0'; pers.style.top = '0';
        const vacht = pick(VACHT), vlek = pick(VACHT), klein = chance(.5), dw = klein ? 12 : 15, dh = dw * .65;
        const licht = vacht === '#f4efe6' || vacht === '#d9b36a';                // lichte vacht krijgt een randje
        const rand_ = licht ? 'stroke="#8a7560" stroke-width=".6"' : '', poot = licht ? '#c9bca8' : vacht;
        const dog = document.createElement('div');
        dog.style.cssText = `position:absolute;left:${33 - dw}px;top:${h - dh}px;width:${dw}px;height:${dh}px`;
        dog.innerHTML = `<svg viewBox="0 0 20 13" width="${dw}" height="${dh}" aria-hidden="true" style="overflow:visible">
            <path class="tail" d="M3.2 5.5 q-2.6 -1.4 -2.6 -4.4" fill="none" stroke="${poot}" stroke-width="1.5" stroke-linecap="round"/>
            <ellipse cx="9" cy="6.6" rx="6.2" ry="3.2" fill="${vacht}" ${rand_}/>
            <ellipse cx="7" cy="6" rx="2.2" ry="1.6" fill="${vlek}" opacity=".7"/>
            <path d="M4.6 8.5 v4.3 M7 8.8 v4 M11.4 8.8 v4 M13.6 8.5 v4.3" stroke="${poot}" stroke-width="1.5" stroke-linecap="round"/>
            <ellipse cx="18.4" cy="4.9" rx="1.6" ry="1.1" fill="${vacht}" ${rand_}/><circle cx="15.6" cy="4" r="2.9" fill="${vacht}" ${rand_}/><ellipse cx="18.2" cy="4.9" rx="1.3" ry=".8" fill="${vacht}"/>
            <circle cx="19.6" cy="4.6" r=".6" fill="#16233a"/><circle cx="16.4" cy="3.4" r=".45" fill="#16233a"/>
            <path d="M14.2 1.8 q-1.4 0.6 -1 3.2 q1 -0.6 1.8 -2.4 z" fill="${vlek}"/>
            <path d="M13.2 5.6 l2.4 1.2" stroke="#D64541" stroke-width=".9"/></svg>`;
        const lijn = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        lijn.setAttribute('width', 34); lijn.setAttribute('height', h); lijn.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
        const hx = 10.4, hy = h * .37, cx = 33 - dw + dw * .7, cy = h - dh + dh * .45;
        lijn.innerHTML = `<path d="M${hx} ${hy} Q${(hx + cx) / 2} ${Math.max(hy, cy) + 3} ${cx} ${cy}" fill="none" stroke="#3d4a5c" stroke-width=".8"/>`;
        w.append(pers, lijn, dog);
        bob(pers, rand(380, 460));
        const trot = animate(dog.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-1.2px)' }], { duration: rand(150, 190), direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        const tail = dog.querySelector('.tail'); tail.style.transformBox = 'fill-box'; tail.style.transformOrigin = '100% 100%';
        const wag = animate(tail, [{ transform: 'rotate(-14deg)' }, { transform: 'rotate(14deg)' }], { duration: 260, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        return { w, h, pers, dog, trot, wag, b: pers.getAnimations()[0] };
    }
    function honden() {
        if (document.hidden) return;
        const width = W(), speed = rand(17, 21), samen = chance(.7);
        const meet = rand(width * .25, width * .75);
        const kanten = samen ? [1, -1] : [pick([1, -1])];
        const lopers = kanten.map(f => {
            const b = baasMetHond(); strip.appendChild(b.w);
            const y = GROUND - b.h, x0 = f > 0 ? -50 : width + 16;
            const xm = f > 0 ? meet - 31 : meet - 3;                  // hondenneuzen raken elkaar bij 'meet'
            const xEnd = f > 0 ? width + 30 : -70;
            return Object.assign(b, { f, y, x0, xm, xEnd });
        });
        const lopen = (l, a, z) => animate(l.w, [{ transform: `translate(${a}px, ${l.y}px) scaleX(${l.f})` }, { transform: `translate(${z}px, ${l.y}px) scaleX(${l.f})` }],
            { duration: Math.abs(z - a) * speed, easing: 'linear' });
        if (!samen) { const l = lopers[0]; lopen(l, l.x0, l.xEnd).finished.then(() => l.w.remove()).catch(() => l.w.remove()); return; }
        const aan = lopers.map(l => lopen(l, l.x0, l.xm));
        Promise.all(aan.map(a => a.finished)).then(() => {
            lopers.forEach(l => { l.b && l.b.pause(); l.trot.pause(); });
            // snuffelen: hondjes duiken met hun kop omlaag en wiebelen, staarten kwispelen harder
            lopers.forEach((l, i) => {
                l.wag.updatePlaybackRate(2.2);
                const g = l.dog.firstElementChild; g.style.transformOrigin = '30% 100%';
                l.sniff = animate(g, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(7deg) translateX(0.6px)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(8deg) translateX(0.8px)' }, { transform: 'rotate(0deg)' }],
                    { duration: 900, iterations: Infinity, delay: i * 250, easing: 'ease-in-out' });
            });
            const top = GROUND - Math.max(...lopers.map(l => l.h)) - 16;
            const bb = bubble(meet - 18, top, lopers[0].pers.querySelector('path:nth-of-type(2)') ? '#3d4a5c' : '#3d4a5c');
            const chat = { x: meet - 10, top, bb }; chatting.push(chat);
            setTimeout(() => {
                chatting.splice(chatting.indexOf(chat), 1);
                animate(bb, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).finished.then(() => bb.remove()).catch(() => bb.remove());
                lopers.forEach(l => {
                    l.sniff.cancel(); l.wag.updatePlaybackRate(1); l.b && l.b.play(); l.trot.play();
                    lopen(l, l.xm, l.xEnd).finished.then(() => l.w.remove()).catch(() => l.w.remove());
                });
            }, rand(4000, 6500));
        }).catch(() => lopers.forEach(l => l.w.remove()));
    }
    // Rons donkerblauwe Snoek (DS, 1973) met rode bekleding en een bestuurder; silhouet getekend door Ron.
    // Glijdt rustig en elegant voorbij en deint zachtjes op de hydropneumatische vering.
    const SNOEK = 'data:image/png;base64,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';
    function oldtimer() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, wpx = 68, hpx = wpx * 96 / 307, y = GROUND - hpx + .6;
        const w = document.createElement('div'); w.className = 'om-p';
        w.style.width = wpx + 'px'; w.style.height = hpx + 'px';
        w.innerHTML = `<div style="position:absolute;left:6%;right:6%;bottom:-1.5px;height:3px;border-radius:50%;background:#16233a;opacity:.12"></div><img src="${SNOEK}" alt="" width="${wpx}" height="${hpx.toFixed(1)}" style="display:block;position:relative">`;
        strip.appendChild(w);
        const dur = (width + 180) * 14, x0 = fromLeft ? -80 : width + 14, x1 = fromLeft ? width + 100 : -100;
        animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
            .finished.then(() => w.remove()).catch(() => w.remove());
        animate(w.querySelector('img'), [{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(-0.7px) rotate(-0.35deg)', offset: .5 }, { transform: 'translateY(0) rotate(0deg)' }],
            { duration: 2800, iterations: Infinity, easing: 'ease-in-out' });
    }
    window.ontmoeten = { meeting, peloton, fanfare, naturists, carnaval, skaters, yogis, klasje, voetballer, footballers, hardloopsters, honden, oldtimer, oudje };   // handig om te testen

    // Rustig tempo: gewone ontmoetingen om de 10 tot 16 seconden (hooguit twee tegelijk),
    // en de bijzondere groepen één voor één, met een pauze ertussen en nooit twee dezelfde achter elkaar.
    meeting();
    const planMeeting = () => setTimeout(() => { if (active < 2) meeting(); planMeeting(); }, rand(10000, 16000));
    planMeeting();
    // af en toe een hondenuitlater (vaak twee die elkaar tegenkomen)
    const planHond = () => setTimeout(() => { honden(); planHond(); }, rand(22000, 38000));
    setTimeout(() => { honden(); planHond(); }, 9000);
    const specials = [
        { run: peloton, dur: () => (W() + 300 + EX) * 4.5 },
        { run: fanfare, dur: () => (W() + 200 + EX) * 24 },
        { run: skaters, dur: () => (W() + 200 + EX) * 7.5 },
        { run: naturists, dur: () => (W() + 160 + EX) * 26 },
        { run: carnaval, dur: () => (W() + 260 + EX) * 22 },
        { run: yogis, dur: () => (W() + 200 + EX) * 40 },
        { run: klasje, dur: () => (W() + 220 + EX) * 22 },
        { run: voetballer, dur: () => (W() + 100) * 30 },
        { run: footballers, dur: () => (W() + 220 + EX) * 11 },
        { run: hardloopsters, dur: () => (W() + 180 + EX) * 9 },
        { run: oldtimer, dur: () => (W() + 180) * 14 },
    ];
    // Alle bijzondere groepen komen om de beurt langs (geschud, geen herhaling voordat iedereen
    // geweest is), elkaar deels overlappend. De eerste komt al na een paar seconden.
    let bag = [], last = null;
    function nextSpecial() {
        if (document.hidden) { setTimeout(nextSpecial, 5000); return; }
        if (!bag.length) {
            bag = specials.slice().sort(() => Math.random() - 0.5);
            if (bag[0] === last && bag.length > 1) bag.push(bag.shift());
        }
        const s = bag.shift(); last = s; s.run();
        // de volgende groep komt al als deze ruim halverwege is (mensen passeren elkaar gewoon)
        setTimeout(nextSpecial, s.dur() * .55 + rand(3000, 7000));
    }
    setTimeout(nextSpecial, 4000);
})();
