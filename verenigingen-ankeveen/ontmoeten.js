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
    function animate(el, frames, opts) {
        const a = el.animate(frames, Object.assign({ fill: 'forwards' }, opts));
        running.add(a); a.finished.then(() => running.delete(a)).catch(() => running.delete(a));
        return a;
    }
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

    // Een ontmoeting: een groepje van links en een van rechts lopen naar hetzelfde punt,
    // staan even te kletsen, en gaan dan samen verder of ieder hun eigen kant op
    let active = 0; const chatting = [];
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
            animate(p, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` },
                { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' });
            members.push({ p, b, x1, y, h, dur, f });
        }
        return members;
    }
    function leave(members, dir, speed) {
        const width = W();
        members.forEach((m, i) => {
            m.b.play();
            const x2 = dir > 0 ? width + 40 + i * 9 : -60 - i * 9, d = Math.abs(x2 - m.x1) * speed;
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
        const hs = []; for (let i = 0; i < n; i++) hs.push(chance(.2) ? rand(14, 17) : rand(21, 25));
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
        const huid = pick(HUID), haar = pick(HAAR), shirt = pick(['#7B5CC4', '#D64541', '#3B8FE0']);
        const w = document.createElement('div'); w.className = 'om-p';
        w.style.height = h + 'px'; w.style.width = h * .45 + 'px';
        w.innerHTML = `<svg viewBox="0 0 18 40" width="${h * .45}" height="${h}" aria-hidden="true" style="overflow:visible">
            <circle cx="9" cy="5" r="4.6" fill="${huid}"/><path d="M4.4 5 q0 -5.5 4.6 -5.5 q4.6 0 4.6 5.5 q-1.5 -2.5 -4.6 -2.5 q-3.1 0 -4.6 2.5z" fill="${haar}"/>
            <path d="M3 13 q6 -4 12 0 l1.5 9 h-3 l-0.3 -2 h-8.4 l-0.3 2 h-3 z" fill="${shirt}"/>
            <path d="M5.4 15 h7.2" stroke="#ffffff" stroke-width="1"/>
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
        const dog = document.createElement('div');
        dog.style.cssText = `position:absolute;left:${33 - dw}px;top:${h - dh}px;width:${dw}px;height:${dh}px`;
        dog.innerHTML = `<svg viewBox="0 0 20 13" width="${dw}" height="${dh}" aria-hidden="true" style="overflow:visible">
            <path class="tail" d="M3.2 5.5 q-2.6 -1.4 -2.6 -4.4" fill="none" stroke="${vacht}" stroke-width="1.5" stroke-linecap="round"/>
            <ellipse cx="9" cy="6.6" rx="6.2" ry="3.2" fill="${vacht}"/>
            <ellipse cx="7" cy="6" rx="2.2" ry="1.6" fill="${vlek}" opacity=".7"/>
            <path d="M4.6 8.5 v4.3 M7 8.8 v4 M11.4 8.8 v4 M13.6 8.5 v4.3" stroke="${vacht}" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="15.6" cy="4" r="2.9" fill="${vacht}"/><ellipse cx="18.4" cy="4.9" rx="1.6" ry="1.1" fill="${vacht}"/>
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
    // Oldtimer: een eigen ontwerp van een klassieke sedan, donkerblauw met rode bekleding,
    // glijdt rustig voorbij en deint zachtjes op de vering.
    function oldtimer() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, wpx = 56, hpx = 24, y = GROUND - hpx + 1;
        const w = document.createElement('div'); w.className = 'om-p';
        w.style.width = wpx + 'px'; w.style.height = hpx + 'px';
        const wiel = cx => `<g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="${cx}" cy="28" r="5.8" fill="#1d1d1d"/><circle cx="${cx}" cy="28" r="3.2" fill="#d9dee5"/><path d="M${cx - 3} 28h6M${cx} 25v6" stroke="#8a96a6" stroke-width=".7"/><circle cx="${cx}" cy="28" r=".9" fill="#8a96a6"/></g>`;
        w.innerHTML = `<svg viewBox="0 0 80 34" width="${wpx}" height="${hpx}" aria-hidden="true" style="overflow:visible">
            <ellipse cx="40" cy="33.4" rx="34" ry="1.4" fill="#16233a" opacity=".12"/>
            <g class="body">
              <path d="M5 26 q-1.5 -7 4 -9 l12 -2 l6 -8 q1.4 -1.6 4 -1.6 h18 q2.6 0 4 1.6 l6.5 8 l11 1.6 q5 1 5 5.4 v4 z" fill="#1c2f5e"/>
              <path d="M28.6 14.4 l4.8 -6.6 h8 v6.6 z" fill="#c9d6e6"/><path d="M43.4 7.8 h6.4 q1.4 0 2.2 1 l4.6 5.6 h-13.2 z" fill="#c9d6e6"/>
              <path d="M34 14.4 v-3.4 q0 -1.6 1.6 -1.6 h3 q1.4 0 1.4 1.6 v3.4 z M45 14.4 v-3.2 q0 -1.5 1.5 -1.5 h3.2 q1.3 0 1.3 1.5 v3.2 z" fill="#B3262C"/>
              <circle cx="46.8" cy="9.8" r="2" fill="#E3B093"/><path d="M44.8 9.6 q0.2 -2.4 2 -2.4 q2 0 2.1 2.2 q-1 -1 -2.1 -1 q-1.1 0 -2 1.2z" fill="#5a3a2a"/>
              <path d="M42.4 7.8 v6.6" stroke="#1c2f5e" stroke-width="1.4"/>
              <path d="M9 18.6 h62" stroke="#d9dee5" stroke-width=".8" opacity=".9"/>
              <path d="M30 15.4 v9.6 M50 15.4 v9.6" stroke="#142347" stroke-width=".6"/>
              <path d="M37 18 h3 M56.6 18 h3" stroke="#d9dee5" stroke-width="1" stroke-linecap="round"/>
              <circle cx="74.2" cy="19.6" r="2" fill="#fff6c8" stroke="#d9dee5" stroke-width=".7"/>
              <rect x="4.2" y="18.6" width="2" height="2.6" rx=".6" fill="#D64541"/>
              <path d="M74 25.6 h4.2 M2 25.6 h4.8" stroke="#d9dee5" stroke-width="1.6" stroke-linecap="round"/>
            </g>
            ${wiel(18)}${wiel(62)}</svg>`;
        strip.appendChild(w);
        const dur = (width + 160) * 14, x0 = fromLeft ? -70 : width + 14, x1 = fromLeft ? width + 90 : -90;
        animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
            .finished.then(() => w.remove()).catch(() => w.remove());
        w.querySelectorAll('.wheel').forEach(g => animate(g, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 900, iterations: Infinity, easing: 'linear' }));
        animate(w.querySelector('.body'), [{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(-0.8px) rotate(-0.4deg)', offset: .5 }, { transform: 'translateY(0) rotate(0deg)' }],
            { duration: 2600, iterations: Infinity, easing: 'ease-in-out' });
    }
    window.ontmoeten = { meeting, peloton, fanfare, naturists, carnaval, skaters, yogis, klasje, voetballer, hardloopsters, honden, oldtimer };   // handig om te testen

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
        { run: hardloopsters, dur: () => (W() + 180 + EX) * 9 },
        { run: oldtimer, dur: () => (W() + 160) * 14 },
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
