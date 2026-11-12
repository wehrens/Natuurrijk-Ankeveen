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
    // Plekken reserveren: groepen die ergens blijven staan (koor, jazz, markt, naturisten, vogelaars) kiezen een plek
    // waar nog niemand staat, zodat ze niet voor elkaar gaan liggen of staan.
    const zones = [];
    function plek(breedte, lo, hi, duur) {
        const nu = performance.now(), w = W();
        for (let i = zones.length - 1; i >= 0; i--) if (zones[i].t < nu) zones.splice(i, 1);
        const a = Math.max(breedte / 2 + 8, w * lo), b = Math.min(w - breedte / 2 - 8, w * hi);
        const overlap = c => zones.reduce((s, z) => s + Math.max(0, Math.min(z.b, c + breedte / 2 + 15) - Math.max(z.a, c - breedte / 2 - 15)), 0);
        let best = null, bestO = Infinity;
        for (let i = 0; i < 40; i++) {
            const c = b > a ? a + Math.random() * (b - a) : w / 2, o = overlap(c);
            if (o < bestO) { best = c; bestO = o; } if (o === 0) break;
        }
        if (bestO > 0) for (let c = breedte / 2 + 8; c < w - breedte / 2 - 8; c += 10) { const o = overlap(c); if (o < bestO) { best = c; bestO = o; } }   // desnoods buiten het voorkeursgebied
        zones.push({ a: best - breedte / 2, b: best + breedte / 2, t: nu + duur });
        return best;
    }
    const rand = (a, b) => a + Math.random() * (b - a);
    // een plek om even stil te staan (praten, snuffelen) waar geen koor, markt of andere groep staat
    function vrij(lo, hi) {
        const w = W(), nu = performance.now();
        for (let i = 0; i < 30; i++) { const c = rand(w * lo, w * hi); if (!zones.some(z => z.t > nu && c > z.a - 45 && c < z.b + 45)) return c; }
        return rand(w * lo, w * hi);
    }
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const chance = p => Math.random() < p;
    const later = (fn, ms) => setTimeout(fn, ms);
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
        w.innerHTML = `<svg viewBox="0 0 18 40" width="${h * .45}" height="${h}" aria-hidden="true" style="overflow:visible">
            <path class="legB" d="M9.5 24 l1.2 7 l-0.4 7" fill="none" stroke="${broek}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" style="transform-box:view-box;transform-origin:9px 24px"/>
            <path class="armB" d="M13.5 14 l0.8 6 l-1 4" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" style="transform-box:view-box;transform-origin:13px 14px"/>
            <path class="legA" d="M8.5 24 l-1.2 7 l0.4 7" fill="none" stroke="${broek}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" style="transform-box:view-box;transform-origin:9px 24px"/>
            <path d="M3 13 q6 -4 12 0 l1.5 12 h-15 z" fill="${color}"/>
            <path d="M4.5 22 h9 l0.3 3.5 h-9.6 z" fill="${broek}"/>
            <path class="armA" d="M4.5 14 l-0.8 6 l1 4" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" style="transform-box:view-box;transform-origin:5px 14px"/>
            <circle cx="9" cy="5" r="4.6" fill="${huid}"/>${hairStyle}</svg>`;
        w.dataset.groet = '1';
        return w;
    }
    // Loopbeweging: benen en armen zwaaien om en om, het lijf veert mee. Geeft één handvat voor pause/play/cancel.
    // Bij pause gaan benen en armen netjes terug naar de ruststand (anders blijft iemand midden in een stap hangen).
    function bob(el, dur) {
        const svg = el.firstElementChild, T = dur * 2;
        let body = null, limbs = [];
        const start = () => {
            body = animate(svg, [{ transform: 'translateY(0)' }, { transform: 'translateY(-1px)' }], { duration: dur, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
            limbs = [];
            const swing = (sel, deg, phase) => { const n = svg.querySelector(sel); if (n) limbs.push(animate(n, [{ transform: `rotate(${-deg}deg)` }, { transform: `rotate(${deg}deg)` }], { duration: T / 2, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: phase ? -T / 2 : 0 })); };
            swing('.legA', 24, false); swing('.legB', 24, true); swing('.armA', 18, true); swing('.armB', 18, false);
        };
        const settle = () => {
            limbs.forEach(a => { const n = a.effect.target, cur = getComputedStyle(n).transform; a.cancel(); animate(n, [{ transform: cur === 'none' ? 'rotate(0deg)' : cur }, { transform: 'rotate(0deg)' }], { duration: 220, easing: 'ease-out' }); });
            limbs = [];
            if (body) { body.cancel(); animate(svg, [{ transform: getComputedStyle(svg).transform === 'none' ? 'translateY(0)' : getComputedStyle(svg).transform }, { transform: 'translateY(0)' }], { duration: 220 }); body = null; }
        };
        start();
        // zelf opletten: wie niet van zijn plek komt, staat stil (ook als een scène vergeet te pauzeren)
        let lastX = null, still = 0;
        const watch = setInterval(() => {
            if (!el.isConnected) { clearInterval(watch); return; }
            const x = el.getBoundingClientRect().left;
            if (lastX !== null && Math.abs(x - lastX) < .3) { if (++still >= 1 && body) settle(); }
            else { still = 0; if (!body && lastX !== null) start(); }
            lastX = x;
        }, 90);
        return { pause: settle, play: () => { if (!body) start(); }, cancel: () => { clearInterval(watch); limbs.forEach(a => a.cancel()); if (body) body.cancel(); limbs = []; body = null; } };
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
            <path class="legB" d="M9.5 24 l1 7 l-0.3 7" fill="none" stroke="${broek}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" style="transform-box:view-box;transform-origin:9px 24px"/>
            <path class="legA" d="M8.5 24 l-1 7 l0.3 7" fill="none" stroke="${broek}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" style="transform-box:view-box;transform-origin:9px 24px"/>
            <path d="M4.5 22 h9 l0.3 3.5 h-9.6 z" fill="${broek}"/>
            ${hulp === 'rollator' ? rollator : stok}</svg>`;
        return w;
    }
    // Een ontmoeting: een groepje van links en een van rechts lopen naar hetzelfde punt,
    // staan even te kletsen, en gaan dan samen verder of ieder hun eigen kant op
    let active = 0; const chatting = [];
    function party(fromLeft, meet, color, speed, oud) {      // oud: twee bejaarden, langzamer, met stok of rollator
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
    // Een woord dat boven iemand verschijnt en rustig opstijgt (in de kopbalk, zodat het boven de strook uit mag)
    function zegOp(xs, ys, tekst, kleur = '#7a4a22', grootte = 15) {
        if (document.hidden) return;
        const sb = strip.getBoundingClientRect(), bb = balk.getBoundingClientRect();
        const d = document.createElement('div'); d.textContent = tekst;
        d.style.cssText = `position:absolute;left:0;top:0;font:800 ${grootte}px 'Bricolage Grotesque',Inter,sans-serif;color:${kleur};white-space:nowrap;pointer-events:none;text-shadow:0 0 3px rgba(255,255,255,.9)`;
        lucht.appendChild(d);
        const bw = d.getBoundingClientRect().width, y = ys + sb.top - bb.top;
        const x = Math.max(4, Math.min(bb.width - bw - 4, xs + sb.left - bb.left - bw / 2));
        animate(d, [{ transform: `translate(${x}px, ${y}px) scale(.5)`, opacity: 0 }, { transform: `translate(${x}px, ${y - 10}px) scale(1.1)`, opacity: 1, offset: .15 },
            { transform: `translate(${x}px, ${y - 16}px) scale(1)`, opacity: 1, offset: .75 }, { transform: `translate(${x}px, ${y - 24}px)`, opacity: 0 }], { duration: 2600, easing: 'ease-out' })
            .finished.then(() => d.remove()).catch(() => d.remove());
    }
    function meeting(koffie) {
        if (document.hidden || active >= 3) return;
        active++;
        const width = W(), meet = vrij(.2, .8), speed = rand(15, 21);
        const cl = pick(KLEUR), cr = chance(.5) ? cl : pick(KLEUR);
        const oud = koffie === true || chance(.25);                // af en toe twee oudere stellen
        const L = party(true, meet, cl, speed, oud), R = party(false, meet, cr, speed, oud);
        const all = L.concat(R), arrive = Math.max(...all.map(m => m.dur));
        setTimeout(() => {
            all.forEach(m => m.b.pause());
            if (oud) {
                // twee oudere stellen: "Koffie?" ... "Koffie!", en dan gaan ze samen dezelfde kant op (naar het Koffie Uurtje)
                const top = GROUND - Math.max(...all.map(m => m.h)) - 4;
                later(() => zegOp(meet - 26, top, 'Koffie?'), 500);
                later(() => zegOp(meet + 26, top, 'Koffie!'), 2100);
                later(() => {
                    const dir = chance(.5) ? 1 : -1;
                    leave(all.sort((a, b) => dir * (b.x1 - a.x1)), dir, speed);
                    setTimeout(() => { active--; }, 1500);
                }, 4200);
                return;
            }
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
    function been(hx, hy, px, py, L1 = 10.6, L2 = 10.2) {   // heup -> knie -> voet, knie naar voren
        const dx = px - hx, dy = py - hy, d = Math.min(Math.hypot(dx, dy), L1 + L2 - .01);
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
            if (r.stil) return;
            const g = r.g || { cx: 28, cy: 30, R: 4.6, hx: 23.5, hy: 13.6, rate: 1.9 };
            if (r.t0 === undefined) r.t0 = t;
            const th = r.phase + (t - r.t0) / 1000 * 2 * Math.PI * g.rate, R = g.R;
            const ax = g.cx + R * Math.cos(th), ay = g.cy + R * Math.sin(th), bx = g.cx - R * Math.cos(th), by = g.cy - R * Math.sin(th);
            r.a.setAttribute('d', been(g.hx, g.hy, ax, ay, g.L1, g.L2)); r.b.setAttribute('d', been(g.hx, g.hy, bx, by, g.L1, g.L2));
            r.c.setAttribute('d', `M${ax.toFixed(2)} ${ay.toFixed(2)} L${bx.toFixed(2)} ${by.toFixed(2)}`);
            if (r.ka) { r.ka.setAttribute('transform', `translate(${ax.toFixed(2)} ${ay.toFixed(2)})`); r.kb.setAttribute('transform', `translate(${bx.toFixed(2)} ${by.toFixed(2)})`); }
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
            <circle cx="9" cy="5" r="4.6" fill="${pick(HUID)}"/><path d="M5 2 h8 l-1 -3 h-6 z" fill="#16233a"/>
            <path class="legB" d="M9.5 24 l1.2 7 l-0.4 7" fill="none" stroke="${color}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" style="transform-box:view-box;transform-origin:9px 24px"/>
            <path class="legA" d="M8.5 24 l-1.2 7 l0.4 7" fill="none" stroke="${color}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" style="transform-box:view-box;transform-origin:9px 24px"/>
            <path d="M3 13 q6 -4 12 0 l1.5 12 h-15 z" fill="${color}"/>
            <path d="M4.5 22 h9 l0.3 3.5 h-9.6 z" fill="${color}"/>
            <path d="M6.5 37.5 h2.4 M9.6 37.5 h2.4" stroke="#111" stroke-width="2" stroke-linecap="round"/>${inst}</svg>`;
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
            // marcheren, allemaal precies in de pas (zelfde starttijd, geen verschuiving per muzikant)
            const t0m = document.timeline.currentTime;
            animate(w.querySelector('.legA'), [{ transform: 'rotate(-28deg)' }, { transform: 'rotate(28deg)' }], { duration: 300, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }).startTime = t0m;
            animate(w.querySelector('.legB'), [{ transform: 'rotate(28deg)' }, { transform: 'rotate(-28deg)' }], { duration: 300, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }).startTime = t0m;
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
        w.innerHTML = `<svg viewBox="0 0 22 40" width="${h * .55}" height="${h}" aria-hidden="true" style="overflow:visible">
            ${female ? '<path d="M4.2 6 q0 -6.8 4.8 -6.8 q4.8 0 4.8 6.8 l0.6 8 l-2.4 0 l-0.4 -6 q-2.6 -1 -5.2 0 l-0.4 6 l-2.4 0 z" fill="#5a3a2a"/>' : ''}
            <path class="legB" d="M9.5 25 l1.2 7 l-0.4 6" fill="none" stroke="${skin}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" style="transform-box:view-box;transform-origin:9px 25px"/>
            <path class="armB" d="M13.5 14 l0.8 6 l-1 4" fill="none" stroke="${skin}" stroke-width="2.4" stroke-linecap="round" style="transform-box:view-box;transform-origin:13px 14px"/>
            <path class="legA" d="M8.5 25 l-1.2 7 l0.4 6" fill="none" stroke="${skin}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" style="transform-box:view-box;transform-origin:9px 25px"/>
            <path d="M3 13 q6 -4 12 0 l1.5 13 h-15 z" fill="${skin}"/>
            <path class="armA" d="M4.5 14 l-0.8 6 l1 4" fill="none" stroke="${skin}" stroke-width="2.4" stroke-linecap="round" style="transform-box:view-box;transform-origin:5px 14px"/>
            <circle cx="9" cy="5" r="4.6" fill="${skin}"/>
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
        const speed = 26, members = [];
        const hs = []; for (let i = 0; i < n; i++) hs.push(rand(21, 25));                   // alleen volwassenen
        const tallest = hs.indexOf(Math.max(...hs));
        const adults = hs.map((h, i) => i).filter(i => i !== tallest && hs[i] >= 20);
        const woman = adults.length ? pick(adults) : -1;
        // halverwege leggen ze een grote handdoek neer en gaan er even op liggen zonnen
        const GAP = 27, LIG = rand(7000, 9500);
        const midden = plek((n - 1) * GAP + 70, .25, .7, (width + 160 + EX) * 26 + LIG + 4000), stopX = midden - (n - 1) * GAP * (fromLeft ? 1 : -1) / 2;
        const inDur = (stopX + 60) * speed, outDur = (width + 100 + EX) * speed;
        for (let i = 0; i < n; i++) {
            const h = hs[i], w = naturist(h, i === tallest, i === woman); strip.appendChild(w);
            w.style.transformOrigin = '0 100%';
            const off = i * rand(11, 14), y = GROUND - h;
            const x0 = fromLeft ? -40 - off : width + 20 + off, xs = stopX + i * GAP * f, x1 = fromLeft ? width + 40 + EX - off : -60 - EX + off;
            const sta = x => `translate(${x}px, ${y}px) scaleX(${f}) rotate(0deg)`, lig = `translate(${xs}px, ${y}px) scaleX(${f}) rotate(-90deg)`;
            animate(w, [{ transform: sta(x0) }, { transform: sta(xs) }], { duration: inDur, easing: 'linear' });
            const b = bob(w, rand(520, 640));
            later(() => { b.pause(); animate(w, [{ transform: sta(xs) }, { transform: lig }], { duration: 800, easing: 'ease-in-out', delay: i * 120 }); }, inDur + 600);
            later(() => { animate(w, [{ transform: lig }, { transform: sta(xs) }], { duration: 700, easing: 'ease-in-out', delay: i * 100 }); }, inDur + 1400 + LIG);
            later(() => { b.play(); animate(w, [{ transform: sta(xs) }, { transform: sta(x1) }], { duration: outDur, easing: 'linear' }).finished.then(() => w.remove()).catch(() => w.remove()); }, inDur + 1400 + LIG + 1400);
            members.push({ w, x0, xs, x1, b });
            if (i === 0) {                                   // de voorste zwaait af en toe
                const arm = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                arm.setAttribute('d', 'M14 13 l5 -7'); arm.setAttribute('stroke', '#F2B5A0'); arm.setAttribute('stroke-width', '2.4'); arm.setAttribute('stroke-linecap', 'round');
                arm.style.transformBox = 'fill-box'; arm.style.transformOrigin = '0% 100%';
                w.firstElementChild.appendChild(arm);
                animate(arm, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(25deg)' }], { duration: 350, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
            }
        }
        // de handdoek: wit met blauwe strepen, wordt uitgerold vóór het liggen en weer opgerold erna
        const tw = (n - 1) * GAP + 34, tx = fromLeft ? stopX - 30 : stopX - tw + 30;
        const towel = document.createElement('div'); towel.className = 'om-p';
        towel.style.cssText = `z-index:0;transform-origin:${fromLeft ? '0' : '100%'} 100%`;
        towel.innerHTML = `<svg viewBox="0 0 ${tw} 5" width="${tw}" height="5" aria-hidden="true"><rect width="${tw}" height="5" rx="1" fill="#fff" stroke="#9DC3E6" stroke-width=".6"/>${Array.from({ length: Math.floor(tw / 6) }, (_, i) => `<rect x="${3 + i * 6}" y="0" width="2.4" height="5" fill="#9DC3E6"/>`).join('')}</svg>`;
        later(() => { strip.appendChild(towel); towel.style.transform = `translate(${tx}px, ${GROUND - 4}px)`;
            animate(towel, [{ transform: `translate(${tx}px, ${GROUND - 4}px) scaleX(0)` }, { transform: `translate(${tx}px, ${GROUND - 4}px) scaleX(1)` }], { duration: 500, easing: 'ease-out' }); }, inDur + 100);
        later(() => { animate(towel, [{ transform: `translate(${tx}px, ${GROUND - 4}px) scaleX(1)` }, { transform: `translate(${tx}px, ${GROUND - 4}px) scaleX(0)` }], { duration: 400, easing: 'ease-in' }).finished.then(() => towel.remove()).catch(() => towel.remove()); }, inDur + 1400 + LIG + 1000);
        // zonnetje boven de handdoek
        later(() => { const z = document.createElement('div'); z.className = 'om-p'; z.style.cssText = 'font-size:12px;line-height:1;pointer-events:none';
            z.textContent = '☀️'; z.style.transform = `translate(${stopX + (n - 1) * GAP * f / 2 - 6}px, ${GROUND - 34}px)`; strip.appendChild(z);
            animate(z, [{ opacity: 0, transform: z.style.transform + ' scale(.5)' }, { opacity: 1, transform: z.style.transform + ' scale(1)' }], { duration: 600, easing: 'ease-out' });
            later(() => animate(z, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 }).finished.then(() => z.remove()).catch(() => z.remove()), LIG - 1800); }, inDur + 1800);
        // omstanders schrikken: hun tekstballon wordt een uitroepteken
        const t0 = performance.now(), seen = new Set(), total = inDur + 1400 + LIG + 1400 + outDur;
        const tick = setInterval(() => {
            if (performance.now() - t0 > total) { clearInterval(tick); return; }
            const r = members[0].w.getBoundingClientRect(), x = r.left - strip.getBoundingClientRect().left;
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
        const stoet = [];
        for (let i = 0; i < 12; i++) {
            const w = i === 0 ? prince() : reveler(i - 1); strip.appendChild(w); stoet.push(w);
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
        // "Alááf!", drie keer kort na elkaar, telkens van een andere plek in de stoet
        const alaaf = () => {
            if (document.hidden) return;
            const bb = balk.getBoundingClientRect(), sb = strip.getBoundingClientRect();
            const zicht = stoet.filter(e => { if (!e.isConnected) return false; const r = e.getBoundingClientRect(); return r.right > sb.left + 30 && r.left < sb.right - 30; });
            if (!zicht.length) return;
            const kl = CARN.slice().sort(() => Math.random() - .5);
            for (let k = 0; k < 3; k++) later(() => {
                const e = pick(zicht.filter(z => z.isConnected)); if (!e) return;
                const r = e.getBoundingClientRect(), d = document.createElement('div'); d.textContent = 'Alááf!';
                d.style.cssText = `position:absolute;left:0;top:0;font:800 ${14 + k * 1.5}px 'Bricolage Grotesque',Inter,sans-serif;color:${kl[k % kl.length]};white-space:nowrap;pointer-events:none;text-shadow:0 1px 0 rgba(0,0,0,.2)`;
                lucht.appendChild(d);
                const bw = d.getBoundingClientRect().width, y = r.top - bb.top - 4;
                const x = Math.max(4, Math.min(bb.width - bw - 4, r.left + r.width / 2 - bb.left - bw / 2 + rand(-10, 10)));
                animate(d, [{ transform: `translate(${x}px, ${y}px) scale(.3) rotate(${rand(-15, 15)}deg)`, opacity: 0 }, { transform: `translate(${x}px, ${y - 14}px) scale(1.15) rotate(0deg)`, opacity: 1, offset: .2 },
                    { transform: `translate(${x}px, ${y - 26}px) scale(1) rotate(${rand(-6, 6)}deg)`, opacity: 1, offset: .7 }, { transform: `translate(${x}px, ${y - 34}px) scale(.95)`, opacity: 0 }], { duration: 2000, easing: 'ease-out' })
                    .finished.then(() => d.remove()).catch(() => d.remove());
            }, k * 520);
        };
        later(alaaf, 2000);
        const alaafs = setInterval(() => { if (!stoet.some(e => e.isConnected)) { clearInterval(alaafs); return; } alaaf(); }, 5200);
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
        const yogi3 = [];
        for (let i = 0; i < 3; i++) {
            const w = yogi(); strip.appendChild(w); yogi3.push(w);
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
        // en uit een van de yogi's stijgt rustig "Ooooooohmmm" op, letter voor letter
        const ohm = () => {
            const w = pick(yogi3.filter(e => e.isConnected));
            if (!w || document.hidden) return;
            const r = w.getBoundingClientRect(), bb = balk.getBoundingClientRect(), sb = strip.getBoundingClientRect();
            const x = r.left + r.width / 2 - bb.left, y = r.top - bb.top;
            if (r.right < sb.left + 20 || r.left > sb.right - 20) return;
            const d = document.createElement('div');
            d.style.cssText = "position:absolute;left:0;top:0;font:italic 500 13px Inter,sans-serif;letter-spacing:.5px;color:#7B5CC4;white-space:nowrap;pointer-events:none";
            d.innerHTML = [...'Ooooooohmmm'].map((ch, i) => `<span style="opacity:0;display:inline-block">${ch}</span>`).join('');
            lucht.appendChild(d);
            const bw = d.getBoundingClientRect().width, x0 = Math.max(4, Math.min(bb.width - bw - 4, x - bw / 2));
            d.querySelectorAll('span').forEach((sp, i) => animate(sp, [{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 400, delay: i * 140, easing: 'ease-out' }));
            animate(d, [{ transform: `translate(${x0}px, ${y - 6}px)`, opacity: 1 }, { transform: `translate(${x0}px, ${y - 26}px)`, opacity: 1, offset: .7 }, { transform: `translate(${x0}px, ${y - 34}px)`, opacity: 0 }], { duration: 5200, easing: 'ease-out' })
                .finished.then(() => d.remove()).catch(() => d.remove());
        };
        const ohms = setInterval(() => { if (!yogi3.some(e => e.isConnected)) { clearInterval(ohms); return; } ohm(); }, 6500);
        later(ohm, 2500);
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
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, speed = 11, dur = (width + 220 + EX) * speed;
        // de hele groep zit in één wrapper die beweegt; spelers en bal staan daarin op vaste plekken,
        // zodat de bal rustig van speler naar speler kan zonder achter de groep aan te hollen
        const g = document.createElement('div'); g.className = 'om-p'; strip.appendChild(g);
        const y = GROUND - 24, x0 = fromLeft ? -40 : width + 20, x1 = fromLeft ? width + 60 + EX : -80 - EX;
        animate(g, [{ transform: `translate(${x0}px, ${y}px)` }, { transform: `translate(${x1}px, ${y}px)` }], { duration: dur, easing: 'linear' })
            .finished.then(() => g.remove()).catch(() => g.remove());
        const players = [];
        for (let i = 0; i < 3; i++) {
            const w = footballer(); g.appendChild(w);
            const px = -f * i * 46;
            w.style.transform = `translate(${px}px, 0) scaleX(${f})`;
            const T = 420, d = -i * 140;
            animate(w.querySelector('.legA'), [{ transform: 'rotate(-32deg)' }, { transform: 'rotate(32deg)' }], { duration: T, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: d });
            animate(w.querySelector('.legB'), [{ transform: 'rotate(32deg)' }, { transform: 'rotate(-32deg)' }], { duration: T, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: d });
            animate(w.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }], { duration: T / 2, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: d });
            players.push({ w, px });
        }
        // de bal: een echte voetbal (wit met zwarte vlakken), voor de voeten van de speler die hem heeft
        const ball = document.createElement('div'); ball.className = 'om-ball';
        ball.innerHTML = '<svg viewBox="0 0 10 10" width="7" height="7" aria-hidden="true"><circle cx="5" cy="5" r="4.5" fill="#fff" stroke="#16233a" stroke-width=".8"/><path d="M5 2.6 l2.1 1.5 l-0.8 2.5 h-2.6 l-0.8 -2.5 z" fill="#16233a"/><path d="M5 2.6 l0 -2 M7.1 4.1 l2 -0.6 M6.3 6.6 l1.2 1.8 M3.7 6.6 l-1.2 1.8 M2.9 4.1 l-2 -0.6" stroke="#16233a" stroke-width=".7"/></svg>';
        g.appendChild(ball);
        const by = 24 - 7, bx = i => players[i].px + f * 7;
        let holder = 0;
        ball.style.transform = `translate(${bx(0)}px, ${by}px)`;
        function pass() {
            if (!g.isConnected) return;
            let next; do { next = Math.floor(Math.random() * 3); } while (next === holder);
            const xa = bx(holder), xb = bx(next), flight = 380 + Math.abs(xb - xa) * 3;
            // trap: het standbeen van de passer zwaait even naar voren
            animate(players[holder].w.querySelector('.legA'), [{ transform: 'rotate(10deg)' }, { transform: 'rotate(-55deg)' }, { transform: 'rotate(10deg)' }], { duration: 260, easing: 'ease-out' });
            animate(ball, [{ transform: `translate(${xa}px, ${by}px) rotate(0deg)` },
                { transform: `translate(${(xa + xb) / 2}px, ${by - 9}px) rotate(${f * 180}deg)`, offset: .5 },
                { transform: `translate(${xb}px, ${by}px) rotate(${f * 360}deg)` }], { duration: flight, easing: 'ease-out' });
            holder = next;
            setTimeout(pass, flight + rand(700, 1300));
        }
        setTimeout(pass, 900);
    }

    // Weekmarkt van Bruisend Ankeveen: twee vrijwilligers zetten vijf kraampjes op, mensen komen boodschappen
    // doen en gaan met een tas (met stokbrood) weer weg, en na een tijdje wordt de markt weer afgebroken.
    const KRAAM = [
        { luifel: '#D64541', waar: '<rect x="4" y="19" width="5" height="3" rx="1" fill="#c98b3a"/><rect x="10" y="18.5" width="6" height="3.5" rx="1" fill="#e0a650"/><rect x="17" y="19" width="5" height="3" rx="1" fill="#b87a2e"/>' },   // brood
        { luifel: '#1b4f9c', waar: '<circle cx="7" cy="20.5" r="2.4" fill="#f4d35e"/><circle cx="13" cy="20.5" r="2.4" fill="#f1c232"/><rect x="17" y="18.5" width="6" height="4" fill="#f8e58c"/>' },                             // kaas
        { luifel: '#1E9E3E', waar: '<circle cx="6" cy="20.5" r="2.2" fill="#e8552b"/><circle cx="11" cy="20.5" r="2.2" fill="#e8552b"/><rect x="15" y="18" width="2" height="5" fill="#f39a2b"/><rect x="18" y="18" width="2" height="5" fill="#f39a2b"/><circle cx="23" cy="20" r="2.4" fill="#3c9a3c"/>' }, // groente
        { luifel: '#D64541', waar: '<path d="M4 21 q5 -4 10 0 q-5 4 -10 0z" fill="#9fb8c8"/><path d="M14 21 q5 -4 10 0 q-5 4 -10 0z" fill="#8aa7ba"/><path d="M3 23 h22" stroke="#cfe3ee" stroke-width="2"/>' },     // vis
        { luifel: '#1b4f9c', waar: '<path d="M6 23 v-5 M11 23 v-6 M16 23 v-5 M21 23 v-6" stroke="#3c9a3c" stroke-width="1.2"/><circle cx="6" cy="17.5" r="2" fill="#ff4f9a"/><circle cx="11" cy="16.5" r="2" fill="#f2c318"/><circle cx="16" cy="17.5" r="2" fill="#7b5cc4"/><circle cx="21" cy="16.5" r="2" fill="#ffffff" stroke="#ccc" stroke-width=".5"/>' } // bloemen
    ];
    function kraam(k) {
        const w = document.createElement('div'); w.className = 'om-p om-kraam';
        const stripes = Array.from({ length: 7 }, (_, i) => `<rect x="${1 + i * 26 / 7}" y="3" width="${26 / 7 + .2}" height="6" fill="${i % 2 ? '#ffffff' : k.luifel}"/>`).join('');
        w.innerHTML = `<svg viewBox="0 0 28 34" width="30" height="36" aria-hidden="true" style="overflow:visible">
            <g class="tafel" style="transform-box:view-box;transform-origin:14px 32px">
              <path d="M3 8 v26 M25 8 v26" stroke="#8b5a2b" stroke-width="1.6"/>
              <rect x="2" y="23" width="24" height="2" fill="#a97142"/><rect x="3" y="25" width="22" height="7" fill="#ffffff" stroke="#ddd" stroke-width=".5"/>
              <path d="M3 25 h22" stroke="${k.luifel}" stroke-width="1.5"/>
              <g class="waar" style="opacity:0">${k.waar}</g>
            </g>
            <g class="luifel" style="transform-box:view-box;transform-origin:14px 9px">
              <path d="M1 9 l2 -6 h22 l2 6 z" fill="#ffffff"/>
              <clipPath id="c${Math.random().toString(36).slice(2, 7)}"><path d="M1 9 l2 -6 h22 l2 6 z"/></clipPath>
              ${stripes.replace(/<rect /g, '<rect clip-path="url(#__CLIP__)" ')}
              <rect x="2.4" y="1.6" width="23.2" height="1.8" rx=".5" fill="${k.luifel}"/>
              <path d="M1 9 q3.5 4 7 0 q3.5 4 7 0 q3.5 4 7 0 q3 4 5 0 v-1 h-26 z" fill="${k.luifel}" opacity=".9"/>
            </g></svg>`;
        // clip-id invullen
        const id = w.querySelector('clipPath').id; w.innerHTML = w.innerHTML.replace(/__CLIP__/g, id);
        return w;
    }
    function tas(color) {
        const b = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        b.innerHTML = `<rect x="13" y="24" width="7" height="8" rx="1" fill="${color}"/><path d="M14.5 24 q2 -4 4 0" fill="none" stroke="#5a3a2a" stroke-width="1"/><path d="M15 24 l1.2 -8 l2 0.4 l-0.8 7.6" fill="#d9a35b" stroke="#b47a2e" stroke-width=".5"/>`;
        return b;
    }
    function markt() {
        if (document.hidden) return;
        const width = W(), N = 5, gap = 40, cx = plek(N * gap + 70, .35, .65, marktDur()), xs = Array.from({ length: N }, (_, i) => cx + (i - (N - 1) / 2) * gap - 15);
        const speed = 12;
        const walkTo = (p, x0, x1, h, cb) => {
            const y = GROUND - h, f = x1 > x0 ? 1 : -1;
            p.style.transform = `translate(${x0}px, ${y}px) scaleX(${f})`;
            const b = bob(p, rand(380, 460)), d = Math.abs(x1 - x0) * speed;
            animate(p, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: d, easing: 'linear' })
                .finished.then(() => { b.pause(); cb && cb(); }).catch(() => {});
            return d;
        };
        // 1. twee vrijwilligers van Bruisend (groen) komen aanlopen. Bij elke kraam gaan ze tegenover elkaar staan,
        //    door de knieën, armen omhoog, en klapt de kraam tegelijk overeind. Dan naar de volgende.
        const hb = 24, b1 = person('#1F6F5C', hb), b2 = person('#1F6F5C', hb); strip.appendChild(b1); strip.appendChild(b2);
        const yb = GROUND - hb;
        const posL = x => x - 7, posR = x => x + 26;                   // links en rechts van een kraam op x, handen aan de palen
        const face = (p, x, f) => animate(p, [{ transform: `translate(${x}px, ${yb}px) scaleX(${-f})` }, { transform: `translate(${x}px, ${yb}px) scaleX(${f})` }], { duration: 180 });
        // Opbouw: eerst door de knieën (350ms), dan omhoog komen (600ms) terwijl de kraam meekomt; de armen zijn op
        // het hoogste punt precies als de kraam staat. Afbreken omgekeerd: armen zakken en kraam klapt in terwijl ze
        // door de knieën gaan, dan komen ze weer overeind.
        const BUK = 350, RIJS = 600;
        const opbouw = p => {
            const svg = p.firstElementChild, a = p.querySelector('.armA'), b = p.querySelector('.armB');
            animate(svg, [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)', offset: BUK / (BUK + RIJS) }, { transform: 'translateY(0)' }], { duration: BUK + RIJS, easing: 'ease-in-out' });
            animate(a, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(165deg)' }], { duration: RIJS, easing: 'ease-out', delay: BUK });
            animate(b, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-165deg)' }], { duration: RIJS, easing: 'ease-out', delay: BUK });
        };
        const afbouw = p => {
            const svg = p.firstElementChild, a = p.querySelector('.armA'), b = p.querySelector('.armB');
            animate(svg, [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)', offset: RIJS / (BUK + RIJS) }, { transform: 'translateY(0)' }], { duration: RIJS + BUK, easing: 'ease-in-out' });
            animate(a, [{ transform: 'rotate(165deg)' }, { transform: 'rotate(0deg)' }], { duration: RIJS, easing: 'ease-in' });
            animate(b, [{ transform: 'rotate(-165deg)' }, { transform: 'rotate(0deg)' }], { duration: RIJS, easing: 'ease-in' });
        };
        const armenNeer = p => { ['.armA', '.armB'].forEach((s, i) => animate(p.querySelector(s), [{ transform: `rotate(${i ? -165 : 165}deg)` }, { transform: 'rotate(0deg)' }], { duration: 350, easing: 'ease-in' })); };
        const DOWN = 400, VUL = 600;
        const walkIn = Math.max(walkTo(b1, -40, posL(xs[0]), hb), walkTo(b2, -70, posR(xs[0]), hb));   // pas beginnen als ze er allebei zijn
        const kramen = [], verkopers = [];
        let tt = walkIn + 200;
        xs.forEach((x, i) => {
            later(() => face(b2, posR(x), -1), tt); tt += 450;          // de rechter draait zich om, ze staan tegenover elkaar
            later(() => {
                opbouw(b1); opbouw(b2);
                const k = kraam(KRAAM[i]); k.style.transform = `translate(${x}px, ${GROUND - 36}px)`; strip.appendChild(k); kramen.push(k);
                const tafel = k.querySelector('.tafel'), luifel = k.querySelector('.luifel');
                tafel.style.transform = 'scaleY(0.05)'; luifel.style.transform = 'scaleY(0)';
                animate(tafel, [{ transform: 'scaleY(0.05)' }, { transform: 'scaleY(1)' }], { duration: RIJS * .55, easing: 'ease-out', delay: BUK });
                animate(luifel, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: RIJS * .5, easing: 'ease-out', delay: BUK + RIJS * .5 });
            }, tt);
            tt += BUK + RIJS;
            later(() => { armenNeer(b1); armenNeer(b2); }, tt); tt += DOWN;
            // de kraam is nog leeg: de waar verschijnt, en dan komt er iemand achter staan (loopt achter de kramen langs)
            later(() => {
                const k = kramen[i]; if (!k) return;
                animate(k.querySelector('.waar'), [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: VUL, easing: 'ease-out' });
                const hv = rand(22, 25), v = person(pick(KLEUR), hv); v.classList.add('om-achter'); v.style.transform = `translate(-30px, ${GROUND - hv}px)`; strip.insertBefore(v, kramen[0]); verkopers[i] = v;
                later(() => walkTo(v, -30, x + 5, hv), VUL);
            }, tt);
            if (i < N - 1) {
                later(() => { face(b2, posR(x), 1); }, tt); tt += 200;
                later(() => { walkTo(b1, posL(x), posL(xs[i + 1]), hb); walkTo(b2, posR(x), posR(xs[i + 1]), hb); }, tt); tt += gap * speed + 150;
            }
        });
        const open = tt + 400;
        // 2. klanten: komen aanlopen, staan even bij een kraam, gaan met tas weer weg
        const shopEnd = open + 34000;
        function klant() {
            if (performance.now() - t0 > shopEnd - 6000) return;
            const h = chance(.2) ? rand(14, 17) : rand(20, 25), color = pick(KLEUR), p = person(color, h); strip.appendChild(p);
            const fromLeft = chance(.5), k = Math.floor(Math.random() * N), stop = xs[k] + (fromLeft ? -12 : 36);
            walkTo(p, fromLeft ? -40 : width + 20, stop, h, () => {
                later(() => {
                    p.firstElementChild.appendChild(tas(pick(['#D64541', '#1b4f9c', '#F39A2B', '#2BB39A'])));
                    const leaveLeft = chance(.5);
                    walkTo(p, stop, leaveLeft ? -60 : width + 40, h, () => p.remove());
                }, rand(1800, 4000));
            });
        }
        const t0 = performance.now();
        later(() => { klant(); }, open);
        const tick = setInterval(() => { if (performance.now() - t0 > shopEnd - 6000) { clearInterval(tick); return; } if (chance(.8)) klant(); }, 2600);
        // 3. afbreken: omgekeerd. Verkoper gaat weg en de waar verdwijnt; ze staan tegenover elkaar, armen omhoog,
        //    en de kraam klapt in terwijl ze door de knieën gaan. En zo terug naar voren.
        let td = shopEnd;
        for (let i = N - 1; i >= 0; i--) {
            const x = xs[i];
            later(() => {
                const v = verkopers[i], k = kramen[i];
                if (v) walkTo(v, x + 5, -60, 24, () => v.remove());
                if (k) animate(k.querySelector('.waar'), [{ opacity: 1 }, { opacity: 0 }], { duration: VUL });
            }, td); td += VUL + 100;
            later(() => face(b2, posR(x), -1), td); td += 450;
            later(() => { ['.armA', '.armB'].forEach((s, j) => [b1, b2].forEach(p => animate(p.querySelector(s), [{ transform: 'rotate(0deg)' }, { transform: `rotate(${j ? -165 : 165}deg)` }], { duration: 400, easing: 'ease-out' }))); }, td); td += 450;
            later(() => {
                afbouw(b1); afbouw(b2);
                const k = kramen[i]; if (!k) return;
                animate(k.querySelector('.luifel'), [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: RIJS * .5, easing: 'ease-in' });
                animate(k.querySelector('.tafel'), [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.05)' }], { duration: RIJS * .55, easing: 'ease-in', delay: RIJS * .45 }).finished.then(() => k.remove()).catch(() => k.remove());
            }, td);
            td += RIJS + BUK;
            if (i > 0) {
                later(() => face(b2, posR(x), 1), td); td += 200;
                later(() => { walkTo(b1, posL(x), posL(xs[i - 1]), hb); walkTo(b2, posR(x), posR(xs[i - 1]), hb); }, td); td += gap * speed + 150;
            }
        }
        later(() => { walkTo(b1, posL(xs[0]), -60, hb, () => b1.remove()); walkTo(b2, posR(xs[0]), -80, hb, () => b2.remove()); }, td + 300);
    }
    const marktDur = () => (W() / 2) * 12 + 200 + 5 * (450 + 950 + 400) + 4 * (200 + 40 * 12 + 150) + 400 + 34000 + 5 * (700 + 450 + 450 + 950) + 4 * (200 + 40 * 12 + 150) + 300 + (W() / 2) * 12 + 2500;

    // Bakfiets: een wat dikkere man in blauwe overall op een ouderwetse bruine bakfiets, komt heel af en toe voorbij
    function bakfiets() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, huid = '#F2C2A8';
        const w = document.createElement('div'); w.className = 'om-p';
        const SW = 44, SH = SW * 48 / 80;                      // zelfde maat als de andere fietsers
        const wiel = (cx, cy, r, op) => `<g class="wheel" style="transform-box:fill-box;transform-origin:center" opacity="${op}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2b2b2b" stroke-width="1.8"/><circle cx="${cx}" cy="${cy}" r="${r - 1.2}" fill="none" stroke="#7a4a3a" stroke-width=".6"/><path d="M${cx} ${cy - r}v${2 * r}M${cx - r} ${cy}h${2 * r}M${cx - r * .7} ${cy - r * .7}l${r * 1.4} ${r * 1.4}M${cx + r * .7} ${cy - r * .7}l${-r * 1.4} ${r * 1.4}" stroke="#555" stroke-width=".6"/><circle cx="${cx}" cy="${cy}" r="1" fill="#555"/></g>`;
        w.innerHTML = `<svg viewBox="0 0 80 48" width="${SW}" height="${SH}" aria-hidden="true" style="overflow:visible">
            ${wiel(64.5, 39.6, 7, .5)}
            ${wiel(12, 38.5, 9, 1)}
            <path d="M3.4 38.5 a8.6 8.6 0 0 1 12.6 -7.6" fill="none" stroke="#ddd8cf" stroke-width="1.6"/>
            <path class="legB" d="" fill="none" stroke="#163f7a" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 38.5 L25 38.5 L43 37 M25 38.5 L20.5 24 M12 38.5 L21 27 M39.5 37 L37.5 17 M37.5 17 L33 17" fill="none" stroke="#3a2e26" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="M33 17 l-2.4 0.8" stroke="#5a2a1a" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M15.6 23.4 h9 l0.8 -1.4 q-5.4 -1.4 -10.2 0 z" fill="#111"/>
            <path class="crank" d="" stroke="#3d4a5c" stroke-width="1.3" stroke-linecap="round"/><circle cx="25" cy="38.5" r="2.2" fill="#555"/>
            <rect x="42" y="23" width="37" height="14" rx=".8" fill="#4e4139" stroke="#2f2722" stroke-width=".8"/>
            <path d="M42 27.6 h37 M42 32.2 h37" stroke="#3a3029" stroke-width=".7"/>
            <path d="M48 24 v12 M57 24 v12 M66 24 v12 M74 24 v12" stroke="#5c4e44" stroke-width=".5"/>
            <rect x="42" y="35" width="37" height="2.2" fill="#ddd8cf"/>
            <path d="M45 23 h8 v-1.6 h5 v1.6 h4 v-2.6 h6 v2.6 z" fill="#c9a97a" opacity=".9"/>
            <path d="M62 23 q6 -3 12 -1 l-1 1 z" fill="#e8e4dc"/>
            ${wiel(59, 40, 7, 1)}
            <path d="M50.6 40 a8.4 8.4 0 0 1 16.8 0" fill="none" stroke="#2a2a2a" stroke-width="2"/>
            <path d="M15.5 25 q-2 -14 6 -17 q9 -2 10 9 q0.6 6 -2 9.4 q-7 1.6 -14 -1.4 z" fill="#1b4f9c"/>
            <path d="M17 22 q6 2.6 12.6 0" stroke="#163f7a" stroke-width="1" fill="none"/>
            <path class="legA" d="" fill="none" stroke="#1b4f9c" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M25 12 q4 3.4 7.6 5" fill="none" stroke="#1b4f9c" stroke-width="3" stroke-linecap="round"/>
            <circle cx="32.6" cy="17" r="1.4" fill="${huid}"/>
            <circle cx="24.6" cy="4" r="4.6" fill="${huid}"/>
            <path d="M19.8 4.2 q0 -5.8 4.8 -5.8 q4.8 0 4.8 5.8 q-1.5 -2.6 -4.8 -2.6 q-3.3 0 -4.8 2.6 z" fill="#1a1a1a"/>
            <path d="M21.4 1 q1.3 -1.5 2.6 -1.3 M26.8 0.4 q1.1 0.7 1.7 2" stroke="#b8b8b8" stroke-width=".7" fill="none" stroke-linecap="round"/>
            <circle cx="27.4" cy="4" r=".6" fill="#16233a"/></svg>`;
        strip.appendChild(w);
        const rider = { w, a: w.querySelector('.legA'), b: w.querySelector('.legB'), c: w.querySelector('.crank'), phase: rand(0, 6.28),
            g: { cx: 25, cy: 38.5, R: 3.6, hx: 21, hy: 23.5, rate: .75, L1: 9.4, L2: 9.2 } };
        trappers.add(rider); startTrappen();
        const y = GROUND - SH + .6, x0 = fromLeft ? -60 : width + 20, x1 = fromLeft ? width + 40 + EX : -80 - EX, speed = 16;
        const moving = [];
        const tr = x => `translate(${x}px, ${y}px) scaleX(${f})`;
        // mode 'stop': de laatste 40px uitrollen (wielen draaien steeds langzamer); 'start': de eerste 40px optrekken
        const ride = (xa, xb, cb, mode) => {
            const dist = Math.abs(xb - xa), dir = xb > xa ? 1 : -1;
            let frames, duration;
            if (mode === 'stop' && dist > 80) {
                const lin = (dist - 40) * speed, roll = 1300; duration = lin + roll;
                frames = [{ transform: tr(xa), easing: 'linear' }, { transform: tr(xb - 40 * dir), offset: lin / duration, easing: 'cubic-bezier(.2,.6,.4,1)' }, { transform: tr(xb) }];
                [.75, .5, .3, .15].forEach((r, i) => later(() => moving.forEach(a => a.updatePlaybackRate(r)), lin + i * roll / 4));
            } else if (mode === 'start' && dist > 80) {
                const acc = 1000, lin = (dist - 40) * speed; duration = acc + lin;
                frames = [{ transform: tr(xa), easing: 'cubic-bezier(.5,0,.8,.5)' }, { transform: tr(xa + 40 * dir), offset: acc / duration, easing: 'linear' }, { transform: tr(xb) }];
                [.2, .45, .7, 1].forEach((r, i) => later(() => moving.forEach(a => a.updatePlaybackRate(r)), i * acc / 4));
            } else { duration = dist * speed; frames = [{ transform: tr(xa) }, { transform: tr(xb) }]; }
            return animate(w, frames, { duration, easing: 'linear' }).finished.then(() => { if (mode === 'stop') moving.forEach(a => a.updatePlaybackRate(1)); cb(); }).catch(() => {});
        };
        w.querySelectorAll('.wheel').forEach(g => moving.push(animate(g, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 1400, iterations: Infinity, easing: 'linear' })));
        moving.push(animate(w.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-0.8px)' }], { duration: 700, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }));
        // meestal stopt hij ergens voor een praatje met een voorbijganger
        if (chance(.75)) {
            const stop = rand(width * .3, width * .7);
            ride(x0, stop, function () {
                moving.forEach(a => a.pause()); rider.stil = true;
                // de voorbijganger komt van de kant waar de bak naartoe wijst en blijft bij de bak staan
                const h = rand(21, 25), p = person(pick(KLEUR), h); strip.appendChild(p);
                const px0 = fromLeft ? width + 20 : -40, px1 = stop + (fromLeft ? 50 : -16);
                p.style.transform = `translate(${px0}px, ${GROUND - h}px) scaleX(${-f})`;
                const b = bob(p, 420), dwalk = Math.abs(px1 - px0) * 18;
                animate(p, [{ transform: `translate(${px0}px, ${GROUND - h}px) scaleX(${-f})` }, { transform: `translate(${px1}px, ${GROUND - h}px) scaleX(${-f})` }], { duration: dwalk, easing: 'linear' })
                    .finished.then(() => {
                        b.pause();
                        const bb = bubble(stop + (fromLeft ? 34 : 2), GROUND - 44, '#1b4f9c');
                        const chat = { x: stop + 22, top: GROUND - 44, bb }; chatting.push(chat);
                        later(() => {
                            chatting.splice(chatting.indexOf(chat), 1);
                            animate(bb, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).finished.then(() => bb.remove()).catch(() => bb.remove());
                            b.play();
                            const px2 = fromLeft ? -60 : width + 40;
                            animate(p, [{ transform: `translate(${px1}px, ${GROUND - h}px) scaleX(${-f})` }, { transform: `translate(${px2}px, ${GROUND - h}px) scaleX(${-f})` }], { duration: Math.abs(px2 - px1) * 18, easing: 'linear' })
                                .finished.then(() => { b.cancel(); p.remove(); }).catch(() => p.remove());
                            later(() => { moving.forEach(a => a.play()); rider.stil = false; ride(stop, x1, () => w.remove(), 'start'); }, 600);
                        }, rand(3500, 6000));
                    }).catch(() => {});
            }, 'stop');
        } else ride(x0, x1, () => w.remove());
    }

    // Stadsfiets met rechtop zittende fietser; optioneel een kindje achterop. scale = grootte (1 = volwassene)
    function cityBike(opts) {
        const { color, huid, haar, kind, scale = 1, ponytail = false, mandje = false, tassen = false } = opts;
        const w = document.createElement('div'); w.className = 'om-p'; w.dataset.groet = 'fiets';
        const W0 = 52 * scale, H0 = 40 * scale;
        w.innerHTML = `<svg viewBox="0 0 52 40" width="${W0}" height="${H0}" aria-hidden="true" style="overflow:visible">
            <g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="10" cy="31" r="7.5" fill="none" stroke="#3d4a5c" stroke-width="1.8"/><path d="M10 23.5v15M2.5 31h15M4.7 25.7l10.6 10.6M15.3 25.7L4.7 36.3" stroke="#3d4a5c" stroke-width=".8"/></g>
            <g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="42" cy="31" r="7.5" fill="none" stroke="#3d4a5c" stroke-width="1.8"/><path d="M42 23.5v15M34.5 31h15M36.7 25.7l10.6 10.6M47.3 25.7L36.7 36.3" stroke="#3d4a5c" stroke-width=".8"/></g>
            <path d="M10 31 l14 0 l-2 -12 M24 31 l12 -12 l6 12 M36 19 l0 -4 l3 0 M22 19 l-4 -1" fill="none" stroke="#3d4a5c" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="24" cy="31" r="2.2" fill="#3d4a5c"/>
            ${tassen ? `<path d="M3.2 21.4 h14.4 M5 21.4 l4.6 9.6 M15.4 21.4 l-5.4 9.6" stroke="#3d4a5c" stroke-width="1" fill="none"/><path d="M3.6 21.8 h12.6 v8 q0 .9 -.9 .9 h-10.8 q-.9 0 -.9 -.9 z" fill="#FBFAF6" stroke="#9aa0a6" stroke-width=".5"/><path d="M3.6 21.8 h12.6 v2.2 q-6.3 1 -12.6 0 z" fill="#F2EFE8" stroke="#9aa0a6" stroke-width=".4"/><path d="M6.4 29.4 q.2 -1.8 0 -3.2" stroke="#3f8a3a" stroke-width=".5" fill="none"/><path d="M6.4 28.599999999999998 q-1 -.6 -1.2 .3 M6.4 28.8 q1 -.8 1.3 .1" stroke="#3f8a3a" stroke-width=".45" fill="none"/><path d="M6.4 26.2 q-1.3 -.2 -1.3 -1.8 l.65 .55 l.65 -1 l.65 1 l.65 -.55 q0 1.6 -1.3 1.8 z" fill="#D7263D"/><path d="M9.9 28.599999999999998 q.2 -1.8 0 -3.2" stroke="#3f8a3a" stroke-width=".5" fill="none"/><path d="M9.9 27.799999999999997 q-1 -.6 -1.2 .3 M9.9 28.0 q1 -.8 1.3 .1" stroke="#3f8a3a" stroke-width=".45" fill="none"/><path d="M9.9 25.4 q-1.3 -.2 -1.3 -1.8 l.65 .55 l.65 -1 l.65 1 l.65 -.55 q0 1.6 -1.3 1.8 z" fill="#D7263D"/><path d="M13.4 29.4 q.2 -1.8 0 -3.2" stroke="#3f8a3a" stroke-width=".5" fill="none"/><path d="M13.4 28.599999999999998 q-1 -.6 -1.2 .3 M13.4 28.8 q1 -.8 1.3 .1" stroke="#3f8a3a" stroke-width=".45" fill="none"/><path d="M13.4 26.2 q-1.3 -.2 -1.3 -1.8 l.65 .55 l.65 -1 l.65 1 l.65 -.55 q0 1.6 -1.3 1.8 z" fill="#D7263D"/>` : ''}
            ${mandje ? `<path d="M37.4 14.6 h8.4 l-1 6.4 h-6.4 z" fill="#C8955A" stroke="#8a5a2b" stroke-width=".6" stroke-linejoin="round"/>
              <path d="M37.8 16.7 h7.6 M38.1 18.8 h7" stroke="#8a5a2b" stroke-width=".45"/><path d="M39.6 14.6 l.3 6.4 M41.6 14.6 v6.4 M43.6 14.6 l-.3 6.4" stroke="#a87444" stroke-width=".45"/>
              <path d="M37.4 14.6 h8.4" stroke="#7a4e24" stroke-width="1"/>` : ''}
            ${kind ? `<path d="M12 22 h6 l0 -6 h-5 z" fill="#5a6a7e"/><circle cx="15" cy="12" r="3" fill="${kind.huid}"/><path d="M12.2 11.8 q2.8 -3.4 5.6 0 q-1 -1.4 -2.8 -1.4 q-1.8 0 -2.8 1.4z" fill="${kind.haar}"/><path d="M12.5 16 q2.5 -2 5 0 l0.5 6 h-6 z" fill="${kind.color}"/><path d="M13.5 22 l-1 5 M16.5 22 l1 5" stroke="#2f3e55" stroke-width="2" stroke-linecap="round"/>` : ''}
            <path class="legB" d="" fill="none" stroke="#1f2d40" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path class="crank" d="" stroke="#3d4a5c" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M19 21 q0 -10 5 -11 q6 0 6 10 l-1 1 l-9 1 z" fill="${color}"/>
            <path class="legA" d="" fill="none" stroke="#2f3e55" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path class="zwaaiarm" d="M24 12 l11 3" stroke="${huid}" stroke-width="2.2" stroke-linecap="round" style="transform-box:view-box;transform-origin:24px 12px"/>
            <circle cx="25" cy="6" r="4.2" fill="${huid}"/>
            ${ponytail ? `<path d="M20.8 6 q0 -5 4.2 -5 q4.2 0 4.2 5 q-1.4 -2.2 -4.2 -2.2 q-2.8 0 -4.2 2.2z" fill="${haar}"/><path d="M21.5 5 q-4 1 -4.5 5.5 q2 -2 5 -3.2z" fill="${haar}"/>` : `<path d="M20.8 6 q0 -5 4.2 -5 q4.2 0 4.2 5 q-1.4 -2.2 -4.2 -2.2 q-2.8 0 -4.2 2.2z" fill="${haar}"/>`}</svg>`;
        return w;
    }
    function rideBike(w, fromLeft, h, extraDelay) {
        const width = W(), f = fromLeft ? 1 : -1, y = GROUND - h + 1;
        const x0 = fromLeft ? -80 - (extraDelay || 0) : width + 20 + (extraDelay || 0), x1 = fromLeft ? width + 40 + EX : -100 - EX, dur = Math.abs(x1 - x0) * 13;
        animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
            .finished.then(() => w.remove()).catch(() => w.remove());
        w.querySelectorAll('.wheel').forEach(g => animate(g, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 1100, iterations: Infinity, easing: 'linear' }));
        trappers.add({ w, a: w.querySelector('.legA'), b: w.querySelector('.legB'), c: w.querySelector('.crank'), phase: rand(0, 6.28),
            ka: w.querySelector('.klompA'), kb: w.querySelector('.klompB'),
            g: w._g || { cx: 24, cy: 31, R: 3.4, hx: 22, hy: 19.5, rate: 1.1, L1: 8.6, L2: 8.2 } }); startTrappen();
        animate(w.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-0.7px)' }], { duration: 550, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
    }
    // Vader op de fiets met een kindje achterop (naar school of de opvang)
    function vaderFiets() {
        if (document.hidden) return;
        const fromLeft = chance(.5);
        const w = cityBike({ color: pick(KLEUR), huid: pick(HUID), haar: pick(HAAR), kind: { huid: pick(HUID), haar: pick(HAAR), color: pick(['#D64541', '#F39A2B', '#3B8FE0', '#FF4F9A']) } });
        w.firstElementChild.setAttribute('width', 52 * .68); w.firstElementChild.setAttribute('height', 40 * .68);
        strip.appendChild(w); rideBike(w, fromLeft, 40 * .68);
    }
    // Blonde vrouw op de fiets met een rieten mandje voor het stuur en witte fietstassen met rode tulpen
    function moederFiets() {
        if (document.hidden) return;
        const fromLeft = chance(.5), haar = pick(['#E9C46A', '#F1D27B', '#E2BC5C']);      // blond
        const m = cityBike({ color: pick(KLEUR), huid: pick(HUID), haar, ponytail: true, scale: .68, mandje: true, tassen: true });
        strip.appendChild(m);
        rideBike(m, fromLeft, 40 * .68);
    }



    // Boswachter in groen uniform met een bruine hoed op een zwarte fatbike (dikke banden)
    function boswachter() {
        if (document.hidden) return;
        const fromLeft = chance(.5), huid = pick(HUID), sc = .7;
        const w = document.createElement('div'); w.className = 'om-p'; w.dataset.groet = 'fiets';
        const band = (cx) => `<g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="${cx}" cy="31" r="7.2" fill="none" stroke="#151515" stroke-width="4"/>
            <circle cx="${cx}" cy="31" r="7.2" fill="none" stroke="#333" stroke-width="4" stroke-dasharray="1.2 1.6" opacity=".9"/>
            <circle cx="${cx}" cy="31" r="4.6" fill="none" stroke="#4a4a4a" stroke-width=".9"/><path d="M${cx} 26.4v9.2M${cx - 4.6} 31h9.2" stroke="#555" stroke-width=".7"/><circle cx="${cx}" cy="31" r="1.1" fill="#222"/></g>`;
        w.innerHTML = `<svg viewBox="0 0 52 40" width="${52 * sc}" height="${40 * sc}" aria-hidden="true" style="overflow:visible">
            ${band(10)}${band(42)}
            <path d="M10 31 l14 0 l-2 -12 M24 31 l12 -12 l6 12 M36 19 l0 -4 l3.4 -.4 M22 19 l-4 -1" fill="none" stroke="#111" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="M24 31 L22 19 L36 19 Z" fill="none" stroke="#111" stroke-width="2.6" stroke-linejoin="round"/>
            <circle cx="24" cy="31" r="2.3" fill="#222"/>
            <path class="legB" d="" fill="none" stroke="#4a3a26" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path class="crank" d="" stroke="#222" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M19 21 q0 -10 5 -11 q6 0 6 10 l-1 1 l-9 1 z" fill="#3f5a35"/>
            <path d="M20.6 14.6 l7.6 0" stroke="#2f4428" stroke-width=".8"/><rect x="24.6" y="11.6" width="2.6" height="1.8" rx=".4" fill="#c9b27a"/>
            <path class="legA" d="" fill="none" stroke="#5a4632" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path class="zwaaiarm" d="M24 12 l11 3" stroke="#3f5a35" stroke-width="2.4" stroke-linecap="round" style="transform-box:view-box;transform-origin:24px 12px"/>
            <circle cx="35.4" cy="15.1" r="1.1" fill="${huid}"/>
            <circle cx="25" cy="6.4" r="4.2" fill="${huid}"/>
            <path d="M18.6 4.2 q6.4 -1.8 12.8 0 q-.6 1 -2 1.1 l-8.8 0 q-1.4 -.1 -2 -1.1 z" fill="#6b4423"/>
            <path d="M21.4 4.4 q-.2 -4.6 3.6 -4.8 q3.8 .2 3.6 4.8 z" fill="#7a4e2a"/><path d="M21.5 3.2 h7.1 v1.1 h-7.1 z" fill="#4a2e16"/>
            <path d="M25 -0.4 l0 1.6" stroke="#5a381c" stroke-width=".8"/></svg>`;
        strip.appendChild(w);
        rideBike(w, fromLeft, 40 * sc);
    }


    // Lange man met een bruinleren hoed en een sigaar (rookwolkjes), op klompen, op een zwarte fiets met een laag
    // karretje erachter vol gereedschap: zeis, hark en bezem
    function klompenman() {
        if (document.hidden) return;
        const fromLeft = chance(.5), huid = pick(HUID), sc = .7;
        const w = document.createElement('div'); w.className = 'om-p'; w.dataset.groet = 'fiets';
        const wiel = (cx, cy, r) => `<g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1b1b1b" stroke-width="1.5"/>
            <path d="M${cx} ${cy - r + .8}v${2 * r - 1.6}M${cx - r + .8} ${cy}h${2 * r - 1.6}M${cx - r * .6} ${cy - r * .6}l${r * 1.2} ${r * 1.2}M${cx + r * .6} ${cy - r * .6}l${-r * 1.2} ${r * 1.2}" stroke="#9aa5b1" stroke-width=".4"/><circle cx="${cx}" cy="${cy}" r=".9" fill="#222"/></g>`;
        const klomp = c => `<path class="${c}" d="M-1.4 -.9 h3.4 q2.4 0 2.8 1.6 l-.2 .8 h-6.2 z" fill="#D9B26A" stroke="#8a6a2a" stroke-width=".35"/>`;
        w.innerHTML = `<svg viewBox="-36 -12 88 52" width="${88 * sc}" height="${52 * sc}" aria-hidden="true" style="overflow:visible">
            <!-- karretje met gereedschap -->
            <path d="M3 31 L-6 29" stroke="#2b2b2b" stroke-width=".9"/>
            <path d="M-21 27 l-9 -27" stroke="#8b5a2b" stroke-width="1"/><path d="M-30 0 q-6 1 -8 5" fill="none" stroke="#b8c0cc" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M-14 27 l-4 -24" stroke="#a87444" stroke-width=".9"/><path d="M-21 3 l6 -1 M-20.6 3 v1.6 M-19.2 2.8 v1.6 M-17.8 2.6 v1.6 M-16.4 2.4 v1.6 M-15 2.2 v1.6" stroke="#555" stroke-width=".5"/>
            <path d="M-8 27 l2 -22" stroke="#9c7a4e" stroke-width=".9"/><path d="M-7.6 5 q-2.6 -1 -2.4 -3.6 h5 q.2 2.6 -2.6 3.6 z" fill="#c9a86a"/><path d="M-9.6 1.4 l-.4 -1.2 M-8.2 1.4 l-.2 -1.4 M-6.8 1.4 v-1.4 M-5.4 1.4 l.2 -1.2" stroke="#a88a50" stroke-width=".4"/>
            <path d="M-30 25 h25 l-1 7 h-23 z" fill="#8b5a2b" stroke="#5a3a1a" stroke-width=".5"/><path d="M-29.5 28.4 h24" stroke="#6b4423" stroke-width=".4"/>
            ${wiel(-17.5, 35, 4)}
            <!-- fiets -->
            ${wiel(10, 31, 8)}${wiel(42, 31, 8)}
            <path class="legB" d="" fill="none" stroke="#5a4632" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>${klomp('klompB')}
            <path d="M10 31 L24 31 L21 17.5 L36.5 17.5 L24 31 M36.5 17.5 L42 31 M36.5 17.5 l-.6 -4.4 l-3 -.6" fill="none" stroke="#151515" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="M18.6 16.4 h5.4" stroke="#2b2b2b" stroke-width="1.6" stroke-linecap="round"/>
            <path class="crank" d="" stroke="#222" stroke-width="1.2" stroke-linecap="round"/><circle cx="24" cy="31" r="1.8" fill="#222"/>
            <!-- lange man -->
            <path d="M19 18 q-.4 -14 5 -15 q6.4 0 6.2 14 l-1 1.4 l-9.4 .6 z" fill="#2f4a6b"/>
            <path class="legA" d="" fill="none" stroke="#6b5137" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>${klomp('klompA')}
            <path class="zwaaiarm" d="M24.6 5 l8 8.4" stroke="#2f4a6b" stroke-width="2.3" stroke-linecap="round" style="transform-box:view-box;transform-origin:24.6px 5px"/>
            <circle cx="33" cy="13.6" r="1" fill="${huid}"/>
            <path d="M23.4 3.2 v-1.6" stroke="${huid}" stroke-width="2"/>
            <circle cx="25" cy="-1.6" r="3.6" fill="${huid}"/><circle cx="26.9" cy="-2.2" r=".45" fill="#2b2b2b"/>
            <path class="sigaar" d="M27.8 .2 l3.4 -.6" stroke="#5a3a1e" stroke-width="1.1" stroke-linecap="round"/><circle cx="31.4" cy="-.4" r=".55" fill="#ff7a2e"/>
            <path d="M19 -4.4 q6 -2 12.4 0 q-.8 1.2 -2.4 1.2 l-7.8 0 q-1.4 0 -2.2 -1.2 z" fill="#5a3418"/>
            <path d="M21.4 -4.6 q-.2 -4.6 3.8 -4.8 q3.6 .2 3.6 4.8 z" fill="#6b4423"/><path d="M21.5 -5.8 h7.2" stroke="#3a2010" stroke-width=".9"/><path d="M25 -9.2 v1.6" stroke="#4a2a14" stroke-width=".7"/></svg>`;
        w._g = { cx: 24, cy: 31, R: 3.4, hx: 22, hy: 17.5, rate: 1, L1: 9.4, L2: 9 };
        strip.appendChild(w);
        rideBike(w, fromLeft, 52 * sc);
        // rookwolkjes: blijven in de lucht hangen waar hij langskwam en stijgen langzaam op
        const tip = w.querySelector('.sigaar');
        const rook = setInterval(() => {
            if (!w.isConnected) { clearInterval(rook); return; }
            if (document.hidden) return;
            const r = tip.getBoundingClientRect(), sr = strip.getBoundingClientRect();
            const x = (fromLeft ? r.right : r.left) - sr.left, y = r.top - sr.top;
            if (x < -10 || x > sr.width + 10) return;
            const d = document.createElement('div'), sz = rand(3, 5);
            d.style.cssText = `position:absolute;left:0;top:0;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(170,170,175,.75);pointer-events:none;z-index:2`;
            strip.appendChild(d);
            animate(d, [{ transform: `translate(${x - sz / 2}px, ${y - sz / 2}px) scale(.6)`, opacity: .85 }, { transform: `translate(${x - sz / 2 + rand(-4, 4)}px, ${y - 12}px) scale(1.8)`, opacity: 0 }], { duration: rand(1400, 2000), easing: 'ease-out' })
                .finished.then(() => d.remove()).catch(() => d.remove());
        }, 420);
    }


    // Familie: een lange vader (zo'n twee koppen langer dan moeder) met een donkerbruine labrador aan de lijn,
    // moeder, en een tweeling die net kan lopen en waggelend meedribbelt. Ze lopen op peutertempo.
    function familie() {
        if (document.hidden) return;
        const width = W(), fromLeft = chance(.5), f = fromLeft ? 1 : -1, speed = 27;
        const vader = baasMetHond({ h: 29, vacht: '#4A2A18', vlek: '#3A2012', dw: 17 });
        const moeder = person(pick(KLEUR), 22.5);
        const kleurT = pick(['#F39A2B', '#3B8FE0', '#2BB39A', '#E8452C']);
        const peuter = () => { const p = person(kleurT, 12); delete p.dataset.groet; return p; };
        const t1 = peuter(), t2 = peuter();
        // wie (front → achter), afstand achter de voorste, hoogte, diepte (achterste iets hoger en erachter)
        const leden = [
            { w: vader.w, off: 0, h: vader.h, lift: 0, z: 1 },
            { w: t1, off: 26, h: 12, lift: 0, z: 2 },
            { w: moeder, off: 38, h: 22.5, lift: 0, z: 1 },
            { w: t2, off: 50, h: 12, lift: 0, z: 2 },
        ];
        const x0 = fromLeft ? -60 : width + 30, x1 = fromLeft ? width + 90 + EX : -150 - EX;
        leden.forEach(m => {
            const y = GROUND - m.h - m.lift, xa = x0 - m.off * f, xb = x1 - m.off * f;
            m.w.style.zIndex = m.z; m.w.style.transform = `translate(${xa}px, ${y}px) scaleX(${f})`;
            strip.appendChild(m.w);
            const b = m.w === vader.w ? vader.bob : bob(m.w, m.h < 15 ? rand(210, 250) : rand(400, 450));
            let wag = null;
            if (m.h < 15) {                                                    // peuters: waggelen van links naar rechts
                const svg = m.w.firstElementChild; svg.style.transformOrigin = '50% 100%';
                wag = animate(svg, [{ transform: 'rotate(-7deg)' }, { transform: 'rotate(7deg)' }], { duration: rand(420, 520), direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
            }
            animate(m.w, [{ transform: `translate(${xa}px, ${y}px) scaleX(${f})` }, { transform: `translate(${xb}px, ${y}px) scaleX(${f})` }], { duration: Math.abs(xb - xa) * speed, easing: 'linear' })
                .finished.then(() => { b && b.cancel(); wag && wag.cancel(); m.w.remove(); }).catch(() => m.w.remove());
        });
    }

    // Vogelaars: een of twee wandelaars met rugzakje en verrekijker. Ze blijven staan en volgen met de kijker
    // een groepje overvliegende ganzen, daarna lopen ze verder.
    function vogelaar(h) {
        const color = pick(['#5B8C5A', '#8A6D3B', '#6b7b8c', '#7a5c3e', '#4a5568']);
        const p = person(color, h), svg = p.firstElementChild, NS = 'http://www.w3.org/2000/svg';
        const huid = svg.querySelector('circle').getAttribute('fill');
        // hoofd en haar in een eigen groep, zodat het hoofd achterover kan
        const head = svg.querySelector('circle'), g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'kop'); g.style.cssText = 'transform-box:view-box;transform-origin:9px 10px';
        head.parentNode.insertBefore(g, head); g.appendChild(head); while (g.nextSibling) g.appendChild(g.nextSibling);
        const rugzak = pick(['#D64541', '#1f4e79', '#C9A227', '#2BB39A']);
        svg.insertAdjacentHTML('afterbegin', `<rect x="0.8" y="12.5" width="4.6" height="10" rx="1.6" fill="${rugzak}"/>`);
        g.insertAdjacentHTML('beforeend', `<g class="kijker" opacity="0"><rect x="9.4" y="3.4" width="7.4" height="1.5" rx=".5" fill="#222"/><rect x="9.4" y="5.3" width="7.4" height="1.5" rx=".5" fill="#222"/><rect x="9.4" y="3.2" width="2.2" height="3.8" rx=".6" fill="#333"/></g>`);
        svg.insertAdjacentHTML('beforeend', `<g class="kijkarmen" opacity="0"><path d="M5 14 l2.5 -3.5 l4 -3" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11.6" cy="7.3" r="1.3" fill="${huid}"/><path d="M13.5 14 l1.5 -3.5 l-0.3 -3.6" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="14.6" cy="6.8" r="1.3" fill="${huid}"/></g>`);
        return p;
    }
    function ganzen(fromLeft, dur) {
        const w = document.createElement('div'); w.className = 'om-p'; w.style.zIndex = 0;
        const gans = (x, y, d) => `<g transform="translate(${x} ${y})"><path class="vl" d="M-4 0 q2 -1.5 4 0 q2 -1.5 4 0" fill="none" stroke="#3b3b3b" stroke-width="1.1" stroke-linecap="round" style="transform-box:fill-box;transform-origin:50% 50%;animation:none"><animate attributeName="d" dur="${d}s" repeatCount="indefinite" values="M-4 0 q2 -1.5 4 0 q2 -1.5 4 0;M-4 1.2 q2 -2.4 4 -1 q2 -2.4 4 0;M-4 0 q2 -1.5 4 0 q2 -1.5 4 0"/></path></g>`;
        w.innerHTML = `<svg viewBox="0 0 60 16" width="60" height="16" aria-hidden="true" style="overflow:visible">${gans(30, 3, .55)}${gans(22, 6, .5)}${gans(38, 6, .6)}${gans(14, 9.5, .55)}${gans(46, 9.5, .5)}${gans(6, 13, .6)}</svg>`;
        strip.appendChild(w);
        const width = W(), x0 = fromLeft ? -70 : width + 10, x1 = fromLeft ? width + 10 : -70;
        animate(w, [{ transform: `translate(${x0}px, 2px) scaleX(${fromLeft ? 1 : -1})` }, { transform: `translate(${(x0 + x1) / 2}px, 0px) scaleX(${fromLeft ? 1 : -1})`, offset: .5 }, { transform: `translate(${x1}px, 2px) scaleX(${fromLeft ? 1 : -1})` }], { duration: dur, easing: 'linear' })
            .finished.then(() => w.remove()).catch(() => w.remove());
        return { x0, x1 };
    }
    function vogelaars() {
        if (document.hidden) return;
        const n = chance(.5) ? 1 : 2, fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, speed = rand(15, 19);
        const stopX = plek(n * 16 + 40, .25, .75, vogelaarsDur()) + (n - 1) * 8 * f;
        const x0 = fromLeft ? -40 : width + 20, x1 = fromLeft ? width + 40 + EX : -60 - EX;
        const group = []; let inDur = 0;
        for (let i = 0; i < n; i++) {
            const h = rand(21, 25), p = vogelaar(h); strip.appendChild(p);
            const off = i * 16 * -f, xs = stopX + off, y = GROUND - h;
            p.style.transform = `translate(${x0 + off}px, ${y}px) scaleX(${f})`;
            const b = bob(p, rand(380, 460)), d = Math.abs(xs - x0 - off) * speed;
            animate(p, [{ transform: `translate(${x0 + off}px, ${y}px) scaleX(${f})` }, { transform: `translate(${xs}px, ${y}px) scaleX(${f})` }], { duration: d, easing: 'linear' }).finished.then(() => b.pause()).catch(() => {});
            inDur = Math.max(inDur, d);
            group.push({ p, h, xs, y, b, f });
        }
        const kijk = (g, aan) => {
            const svg = g.p.firstElementChild;
            ['.armA', '.armB'].forEach(sel => animate(svg.querySelector(sel), [{ opacity: aan ? 1 : 0 }, { opacity: aan ? 0 : 1 }], { duration: 300, delay: aan ? 0 : 200 }));
            animate(svg.querySelector('.kijkarmen'), [{ opacity: aan ? 0 : 1 }, { opacity: aan ? 1 : 0 }], { duration: 300, delay: aan ? 200 : 0 });
            animate(svg.querySelector('.kijker'), [{ opacity: aan ? 0 : 1 }, { opacity: aan ? 1 : 0 }], { duration: 300, delay: aan ? 300 : 0 });
        };
        const face = (g, dir) => { if (g.f === dir) return; g.f = dir; animate(g.p, [{ transform: `translate(${g.xs}px, ${g.y}px) scaleX(${-dir})` }, { transform: `translate(${g.xs}px, ${g.y}px) scaleX(${dir})` }], { duration: 350, easing: 'ease-in-out' }); };
        const DUR = 13000;
        later(() => {
            const { x0: gx0, x1: gx1 } = ganzen(fromLeft, DUR), t0 = performance.now();
            later(() => group.forEach(g => kijk(g, true)), 500);
            const watch = setInterval(() => {
                const t = (performance.now() - t0) / DUR;
                if (t >= 1) { clearInterval(watch); return; }
                const gx = gx0 + (gx1 - gx0) * t + 30, gy = 8;
                group.forEach(g => {
                    const px0 = g.xs + g.h * .22, py0 = g.y + 4, dx = gx - px0, dir = dx >= 0 ? 1 : -1;
                    face(g, dir);
                    const ang = Math.atan2(py0 - gy, Math.abs(dx)) * 180 / Math.PI;
                    g.p.firstElementChild.querySelector('.kop').style.transform = `rotate(${(-(6 + Math.min(ang, 80) * .38)).toFixed(1)}deg)`;
                });
            }, 160);
            later(() => {
                group.forEach(g => { kijk(g, false); const k = g.p.firstElementChild.querySelector('.kop'); k.style.transition = 'transform .5s'; k.style.transform = 'rotate(0deg)'; });
                later(() => group.forEach(g => { face(g, f); later(() => { g.b.play();
                    animate(g.p, [{ transform: `translate(${g.xs}px, ${g.y}px) scaleX(${f})` }, { transform: `translate(${x1 + (g.xs - stopX)}px, ${g.y}px) scaleX(${f})` }], { duration: Math.abs(x1 - g.xs) * speed, easing: 'linear' }).finished.then(() => { g.b.cancel(); g.p.remove(); }).catch(() => g.p.remove()); }, 400); }), 1100);
            }, DUR + 200);
        }, inDur + 600);
    }
    const vogelaarsDur = () => (W() + 120 + EX) * 19 + 600 + 13000 + 1800;


    // Bubbling Blue Notes Jazz Club: een trio in donker pak met hoed (sax, contrabas, trompet) komt aanlopen,
    // blijft staan en speelt; uit de instrumenten borrelen blauwe bellen met nootjes omhoog. Dan lopen ze verder.
    function jazzer(kind, h) {
        const w = document.createElement('div'); w.className = 'om-p';
        const pak = pick(['#1c2238', '#2a2a2a', '#1f3350']), huid = pick(HUID), hoed = pick(['#16233a', '#3a2a1a', '#2b2b2b']);
        const inst = kind === 'sax'
            ? `<g class="inst"><path d="M12.5 7.5 l-1.8 -1.2" stroke="#222" stroke-width="1.4" stroke-linecap="round"/><path d="M12.5 7.5 q2.2 1.5 2.4 4.5 l0.6 10 q0.3 4 -2.6 4.6 q-2.6 .2 -3 -2.4" fill="none" stroke="#D4A72C" stroke-width="2.4" stroke-linecap="round"/><path d="M9.9 24.2 q-0.6 -3.4 2.4 -4.4" fill="none" stroke="#D4A72C" stroke-width="2.4" stroke-linecap="round"/><path d="M12.3 19.8 q4 -.6 4.4 -4.6" fill="none" stroke="#D4A72C" stroke-width="2.8" stroke-linecap="round"/><ellipse cx="17.2" cy="13.6" rx="2.4" ry="3.2" fill="#E8BE45" stroke="#9a7420" stroke-width=".5"/><circle cx="14.4" cy="12.8" r=".9" fill="#F3DD8A" stroke="#9a7420" stroke-width=".3"/><circle cx="14.7" cy="15.4" r=".9" fill="#F3DD8A" stroke="#9a7420" stroke-width=".3"/><circle cx="15" cy="18" r=".9" fill="#F3DD8A" stroke="#9a7420" stroke-width=".3"/><circle cx="13" cy="21.3" r=".8" fill="#F3DD8A" stroke="#9a7420" stroke-width=".3"/><path d="M13.6 10 l1.6 -1.6" stroke="#9a7420" stroke-width=".6"/></g>`
            : kind === 'bas'
            ? `<g class="inst"><path d="M15 38 q-11 -8 -6 -21 q3 -5 8 -4 q5 -1 8 4 q5 13 -6 21 z" fill="#7a4a22" stroke="#4a2a10" stroke-width=".8"/><path d="M17 13 l1.5 -17" stroke="#3a2a1a" stroke-width="1.8"/><path d="M15 -3 h4" stroke="#3a2a1a" stroke-width="1.6" stroke-linecap="round"/><path d="M13.5 20 q1.5 2.5 0 5 M20.5 20 q-1.5 2.5 0 5" fill="none" stroke="#2a1a0a" stroke-width=".9"/><path d="M14.5 29 h5" stroke="#111" stroke-width="1.2"/><path d="M15 12 v24 M16.6 12 v24 M18.2 12 v24 M19.8 12 v24" stroke="#eee" stroke-width=".4"/><path class="pluk" d="M5 14 l6 10" stroke="${pak}" stroke-width="2.6" stroke-linecap="round" style="transform-box:view-box;transform-origin:5px 14px"/></g>`
            : `<g class="inst"><path d="M11 10 h7 l4 -3 v8 l-4 -3 h-7 z" fill="#C9A227"/><path d="M13 9 v-2 M15 9 v-2 M17 9 v-2" stroke="#8a6a10" stroke-width=".9"/></g>`;
        w.innerHTML = `<svg viewBox="0 0 24 40" width="${h * .6}" height="${h}" aria-hidden="true" style="overflow:visible">
            <path class="legB" d="M9.5 24 l1.2 7 l-0.4 7" fill="none" stroke="${pak}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" style="transform-box:view-box;transform-origin:9px 24px"/>
            <path class="legA" d="M8.5 24 l-1.2 7 l0.4 7" fill="none" stroke="${pak}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" style="transform-box:view-box;transform-origin:9px 24px"/>
            <path d="M6.5 37.5 h2.4 M9.6 37.5 h2.4" stroke="#111" stroke-width="2" stroke-linecap="round"/>
            <g class="lijf" style="transform-box:view-box;transform-origin:9px 24px">
            <path d="M3 13 q6 -4 12 0 l1.5 12 h-15 z" fill="${pak}"/><path d="M8.2 12.5 l0.8 3 l0.8 -3" fill="#fff"/><path d="M9 13 l0 9" stroke="#D64541" stroke-width="1"/>
            <path d="M4.5 22 h9 l0.3 3.5 h-9.6 z" fill="${pak}"/>
            <circle cx="9" cy="5" r="4.6" fill="${huid}"/><circle cx="10.3" cy="4.6" r=".5" fill="#2b2b2b"/><circle cx="12.3" cy="4.6" r=".5" fill="#2b2b2b"/>
            <path d="M3.5 2.2 h11 l-0.4 -1.2 h-2.2 l-0.8 -3.4 h-4.6 l-0.8 3.4 h-2.1 z" fill="${hoed}"/><path d="M6 1 h6" stroke="#9DC3E6" stroke-width=".8"/>
            ${kind === 'sax' ? `<path d="M5 14 l4 3 l5 -3" fill="none" stroke="${pak}" stroke-width="2.6" stroke-linecap="round"/><path d="M13.5 14 l1.5 2.5" fill="none" stroke="${pak}" stroke-width="2.6" stroke-linecap="round"/>` : kind === 'trompet' ? `<path d="M5 14 l6 -1 M13.5 14 l1 -4" fill="none" stroke="${pak}" stroke-width="2.6" stroke-linecap="round"/>` : `<path d="M13.5 14 l3 -8" fill="none" stroke="${pak}" stroke-width="2.6" stroke-linecap="round"/>`}
            ${inst}</g></svg>`;
        return w;
    }
    function bubbel(x, y) {                                // borrelende blauwe bel met een nootje erin
        const b = document.createElement('div'); b.className = 'om-note';
        const r = rand(4, 6.5);
        b.style.cssText = `width:${2 * r}px;height:${2 * r}px;border-radius:50%;background:rgba(157,195,230,.3);border:1px solid rgba(59,143,224,.7);color:#1b4f9c;font-size:${r + 1.5}px;display:flex;align-items:center;justify-content:center;font-weight:700`;
        b.textContent = pick(['\u266a', '\u266b', '\u2669']);
        strip.appendChild(b);
        const dx = rand(-14, 14), h = rand(16, 24);
        animate(b, [{ transform: `translate(${x}px, ${y}px) scale(.3)`, opacity: 0 }, { transform: `translate(${x + dx * .3}px, ${y - h * .3}px) scale(1)`, opacity: 1, offset: .25 },
            { transform: `translate(${x + dx * .7}px, ${y - h * .75}px) scale(1.05)`, opacity: 1, offset: .8 }, { transform: `translate(${x + dx}px, ${y - h}px) scale(1.5)`, opacity: 0 }],
            { duration: rand(1800, 2800), easing: 'ease-out' }).finished.then(() => b.remove()).catch(() => b.remove());
    }
    function jazz() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, h = 24, y = GROUND - h, speed = 20;
        const kinds = ['sax', 'bas', 'trompet'], SPEEL = rand(9000, 12000), stopX = plek(100, .3, .7, jazzDur()) + 20 * f;
        const x0 = fromLeft ? -40 : width + 20, x1 = fromLeft ? width + 40 + EX : -60 - EX;
        let inDur = 0;
        kinds.forEach((kind, i) => {
            const w = jazzer(kind, h); strip.appendChild(w);
            const off = i * 20 * -f, xs = stopX + off, b = bob(w, rand(420, 500));
            const d = Math.abs(xs - x0 - off) * speed; inDur = Math.max(inDur, d);
            animate(w, [{ transform: `translate(${x0 + off}px, ${y}px) scaleX(${f})` }, { transform: `translate(${xs}px, ${y}px) scaleX(${f})` }], { duration: d, easing: 'linear' })
                .finished.then(() => b.pause()).catch(() => {});
            later(() => {
                // spelen: zachtjes wiegen, de bassist plukt, en bellen borrelen uit het instrument
                const sway = animate(w.querySelector('.lijf'), [{ transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }], { duration: rand(700, 900), direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
                const pluk = w.querySelector('.pluk'), pl = pluk ? animate(pluk, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(12deg)' }], { duration: 260, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }) : null;
                const bx = xs + (f > 0 ? 13 : 1), by = y + (kind === 'bas' ? 14 : 10);
                const tick = setInterval(() => { if (chance(.6)) bubbel(bx + rand(-3, 3), by); }, rand(750, 1000));
                later(() => {
                    clearInterval(tick); sway.cancel(); if (pl) pl.cancel();
                    animate(w.querySelector('.lijf'), [{ transform: getComputedStyle(w.querySelector('.lijf')).transform === 'none' ? 'rotate(0deg)' : getComputedStyle(w.querySelector('.lijf')).transform }, { transform: 'rotate(0deg)' }], { duration: 300 });
                    later(() => { b.play(); animate(w, [{ transform: `translate(${xs}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1 + off}px, ${y}px) scaleX(${f})` }], { duration: Math.abs(x1 + off - xs) * speed, easing: 'linear' }).finished.then(() => { b.cancel(); w.remove(); }).catch(() => w.remove()); }, 500);
                }, SPEEL);
            }, inDur + 500 + i * 300);
        });
    }
    const jazzDur = () => (W() + 120 + EX) * 20 + 500 + 12000 + 1500;


    // Havenloos: het mannenkoor in Bretonse streepjestruien, rode halsdoek, pet of kapiteinspet en gele klompen.
    // Ze komen als groep aanlopen, stellen zich op in drie rijen met de accordeonist in het midden voorop,
    // draaien zich naar het publiek en zingen (monden open en dicht, wiegen mee). Daarna lopen ze verder.
    let hvId = 0;
    const KLOMP = '#F2C318', KLOMPRAND = '#b8860b', MARINE = '#1c2a4a', JEANS = ['#3b4f73', '#2f3e55', '#4a5f86'];
    function zanger(h, acc) {
        const w = document.createElement('div'); w.className = 'om-p';
        w.style.height = h + 'px'; w.style.width = h * .45 + 'px';
        const id = 'hv' + (hvId++), huid = pick(HUID), jeans = pick(JEANS);
        const haar = pick(['#d9d9d9', '#bdbdbd', '#9a9a9a', '#ececec', '#5a4a3a']);
        const kapitein = chance(.45), baard = chance(.3);
        const strepen = y0 => [0, 1, 2, 3, 4].map(i => `<rect x="0" y="${y0 + i * 2.4}" width="18" height="1.1" fill="${MARINE}"/>`).join('');
        // pet: witte kapiteinspet met klep en goudband, of zwarte vissers-/schipperspet
        const petZij = kapitein
            ? `<path d="M4.2 3.2 q4.6 -3 9.6 -.6 l.2 1.6 h-9.8 z" fill="#fff" stroke="#bbb" stroke-width=".3"/><path d="M4.3 3.6 h9.6" stroke="#C9A227" stroke-width=".7"/><path d="M12.6 4.2 l3.2 .6" stroke="#111" stroke-width="1" stroke-linecap="round"/>`
            : `<path d="M4 3.8 q4.8 -3.6 10 -.4 v1 h-10 z" fill="#1a1a1a"/><path d="M12.6 4.3 l3 .5" stroke="#111" stroke-width="1" stroke-linecap="round"/>`;
        const petVoor = kapitein
            ? `<path d="M3.6 3.4 q5.4 -3.8 10.8 0 v1.2 h-10.8 z" fill="#fff" stroke="#bbb" stroke-width=".3"/><path d="M3.8 4 h10.4" stroke="#C9A227" stroke-width=".7"/><circle cx="9" cy="2.6" r=".7" fill="#C9A227"/><path d="M4.6 4.7 q4.4 1.2 8.8 0" fill="none" stroke="#111" stroke-width="1"/>`
            : `<path d="M3.6 3.8 q5.4 -4.2 10.8 0 v1 h-10.8 z" fill="#1a1a1a"/><path d="M4.6 4.9 q4.4 1 8.8 0" fill="none" stroke="#111" stroke-width=".9"/>`;
        const been = (cls, d) => `<g class="${cls}" style="transform-box:view-box;transform-origin:9px 24px"><path d="${d}" fill="none" stroke="${jeans}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
        // klomp als laatste stuk van het been: in zijaanzicht een bootje met opgekrulde neus
        const klompZij = x => `<path d="M${x - 2} 37.2 h4.6 q1.6 0 1.8 -1.4 l.4 1.4 q-.2 1.6 -2 1.6 h-4.6 q-.8 0 -.6 -1.6 z" fill="${KLOMP}" stroke="${KLOMPRAND}" stroke-width=".4"/>`;
        w.innerHTML = `<svg viewBox="0 0 18 40" width="${h * .45}" height="${h}" aria-hidden="true" style="overflow:visible">
            <defs><clipPath id="${id}z"><path d="M3 13 q6 -4 12 0 l1.5 12 h-15 z"/></clipPath><clipPath id="${id}v"><path d="M2.6 13 q6.4 -3.6 12.8 0 l.8 11.6 h-14.4 z"/></clipPath></defs>
            <g class="zij">
              <g class="legB" style="transform-box:view-box;transform-origin:9px 24px"><path d="M9.5 24 l1.2 7 l-0.4 6" fill="none" stroke="${jeans}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>${klompZij(10.4)}</g>
              <path class="armB" d="M13.5 14 l0.8 6 l-1 4" fill="none" stroke="#f4f4f4" stroke-width="2.6" stroke-linecap="round" style="transform-box:view-box;transform-origin:13px 14px"/>
              <g class="legA" style="transform-box:view-box;transform-origin:9px 24px"><path d="M8.5 24 l-1.2 7 l0.4 6" fill="none" stroke="${jeans}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>${klompZij(7.8)}</g>
              <path d="M3 13 q6 -4 12 0 l1.5 12 h-15 z" fill="#fff"/><g clip-path="url(#${id}z)">${strepen(14)}</g>
              <path d="M11.5 10.6 l3.2 1.6 l-2 2.4 z" fill="#D64541"/>
              <path d="M4.5 22.5 h9 l0.3 3 h-9.6 z" fill="${jeans}"/>
              <path class="armA" d="M4.5 14 l-0.8 6 l1 4" fill="none" stroke="#f4f4f4" stroke-width="2.6" stroke-linecap="round" style="transform-box:view-box;transform-origin:5px 14px"/>
              <circle cx="9" cy="6" r="4.6" fill="${huid}"/><path d="M4.5 6.5 q.4 -2.6 2.4 -3 l-.4 3.6 z" fill="${haar}"/>
              ${baard ? `<path d="M10.5 8.4 q2.6 .4 3.4 -1.2 q.2 3 -2 3.8 q-1.4 .2 -1.4 -2.6 z" fill="${haar}"/>` : ''}
              <g transform="translate(0 1)">${petZij}</g>
            </g>
            <g class="voor" opacity="0">
              <path d="M7 24 v12.4 M11 24 v12.4" stroke="${jeans}" stroke-width="3.4" stroke-linecap="round"/>
              <ellipse cx="6.6" cy="37.6" rx="2.3" ry="1.4" fill="${KLOMP}" stroke="${KLOMPRAND}" stroke-width=".4"/><ellipse cx="11.4" cy="37.6" rx="2.3" ry="1.4" fill="${KLOMP}" stroke="${KLOMPRAND}" stroke-width=".4"/>
              <path d="M2.6 13 q6.4 -3.6 12.8 0 l.8 11.6 h-14.4 z" fill="#fff"/><g clip-path="url(#${id}v)">${strepen(14)}</g>
              <path d="M3.4 22.6 h11.2 l.2 2.4 h-11.6 z" fill="${jeans}"/>
              <path d="M3 13.8 l-.9 10 M15 13.8 l.9 10" stroke="#f4f4f4" stroke-width="2.4" stroke-linecap="round"/><path d="M2.1 23.8 v.1 M15.9 23.8 v.1" stroke="${huid}" stroke-width="2.2" stroke-linecap="round"/>
              <path d="M6.4 10.6 l2.6 4.2 l2.6 -4.2 z" fill="#D64541"/><circle cx="9" cy="13.4" r=".7" fill="#E8BE45"/>
              ${acc ? `<g class="acc"><rect x="3.2" y="15.2" width="2.8" height="7" rx=".5" fill="#f4f4f4" stroke="#999" stroke-width=".3"/><path d="M3.6 16.4 h2 M3.6 17.6 h2 M3.6 18.8 h2 M3.6 20 h2 M3.6 21.2 h2" stroke="#222" stroke-width=".4"/>
                <g class="balg" style="transform-box:fill-box;transform-origin:0% 50%"><rect x="6" y="15.4" width="6.4" height="6.6" fill="#B3262E"/><path d="M7.2 15.4 v6.6 M8.4 15.4 v6.6 M9.6 15.4 v6.6 M10.8 15.4 v6.6" stroke="#6e1218" stroke-width=".35"/></g>
                <rect x="12.2" y="15.2" width="2.8" height="7" rx=".5" fill="#B3262E" stroke="#6e1218" stroke-width=".3"/><circle cx="13.6" cy="17" r=".35" fill="#fff"/><circle cx="13.6" cy="18.4" r=".35" fill="#fff"/><circle cx="13.6" cy="19.8" r=".35" fill="#fff"/></g>` : ''}
              <circle cx="9" cy="6" r="4.6" fill="${huid}"/>
              <path d="M4.4 6.6 q-.2 -2 1 -3 M13.6 6.6 q.2 -2 -1 -3" fill="none" stroke="${haar}" stroke-width="1.1"/>
              ${baard ? `<path d="M5.6 7.6 q3.4 5 6.8 0 q-.4 3.4 -3.4 3.6 q-3 -.2 -3.4 -3.6 z" fill="${haar}"/>` : ''}
              <ellipse class="mond" cx="9" cy="8.4" rx="1.15" ry=".6" fill="#5a1a14" style="transform-box:fill-box;transform-origin:50% 0%"/>
              <g transform="translate(0 1)">${petVoor}</g>
            </g></svg>`;
        return w;
    }
    function havenloos() {
        if (document.hidden) return;
        const width = W(), fromLeft = chance(.5), f = fromLeft ? 1 : -1, speed = 16;
        const ROWS = [{ n: 9, sc: .84, lift: 11, sp: 10.5 }, { n: 8, sc: .92, lift: 5.5, sp: 11.5 }, { n: 8, sc: 1, lift: 0, sp: 12.5 }];   // achter → voor
        const maxW = 9 * 10.5 + 20, cx = plek(maxW + 20, .3, .7, havenloosDur());
        const leden = [];
        ROWS.forEach((r, ri) => {
            for (let i = 0; i < r.n; i++) {
                const acc = ri === 2 && i === Math.floor(r.n / 2);
                const h = 24 * r.sc * rand(.96, 1.04), w = zanger(h, acc);
                w.style.zIndex = 2;                         // voorbijgangers lopen achter het koor langs
                const x = cx + (i - (r.n - 1) / 2) * r.sp + (ri === 1 ? r.sp * .3 : 0) - h * .225, y = GROUND - h - r.lift;
                strip.appendChild(w);
                leden.push({ w, x, y, h, acc });
            }
        });
        // als blok binnen marcheren: iedereen dezelfde afstand, dus ze blijven in formatie
        const D = fromLeft ? cx + maxW / 2 + 40 : width - cx + maxW / 2 + 40;
        const inDur = D * speed, ZING = rand(13000, 16000);
        leden.forEach(m => {
            const xa = m.x - D * f;
            m.w.style.transform = `translate(${xa}px, ${m.y}px) scaleX(${f})`;
            m.b = bob(m.w, rand(430, 500));
            animate(m.w, [{ transform: `translate(${xa}px, ${m.y}px) scaleX(${f})` }, { transform: `translate(${m.x}px, ${m.y}px) scaleX(${f})` }], { duration: inDur, easing: 'linear' })
                .finished.then(() => m.b.pause()).catch(() => {});
        });
        later(() => {
            // omdraaien naar het publiek en zingen
            const anims = [];
            leden.forEach((m, i) => {
                const svg = m.w.firstElementChild, zij = svg.querySelector('.zij'), voor = svg.querySelector('.voor');
                animate(zij, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: i * 15 });
                animate(voor, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: i * 15 });
                anims.push(animate(voor.querySelector('.mond'), [{ transform: 'scaleY(.5)' }, { transform: 'scaleY(2.4)' }], { duration: 560, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: 600 + rand(0, 90) }));
                svg.style.transformOrigin = '50% 100%';               // wiegen vanuit de voeten, ruim heen en weer
                anims.push(animate(svg, [{ transform: 'translateX(-1.2px) rotate(-7deg)' }, { transform: 'translateX(1.2px) rotate(7deg)' }], { duration: 1680, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: 400 }));
                if (m.acc) anims.push(animate(voor.querySelector('.balg'), [{ transform: 'scaleX(.6)' }, { transform: 'scaleX(1.15)' }], { duration: 840, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: 400 }));
            });
            const top = Math.min(...leden.map(m => m.y));
            const noten = setInterval(() => { if (chance(.7)) note(cx + rand(-maxW / 2, maxW / 2), top - 2, '#1c2a4a'); }, 650);
            // de titels van de liederen die ze zingen stijgen om de beurt op uit het koor
            const LIEDEREN = ['♪ Het kleine café aan de haven ♪', '♪ Meisje, ik ben een zeeman ♪', '♪ What Shall We Do with the Drunken Sailor ♪'];
            let lied = Math.floor(rand(0, LIEDEREN.length));
            const titel = () => {
                if (document.hidden) return;
                const sb = strip.getBoundingClientRect(), bb = balk.getBoundingClientRect();
                const d = document.createElement('div'); d.textContent = LIEDEREN[lied++ % LIEDEREN.length];
                d.style.cssText = "position:absolute;left:0;top:0;font:italic 700 13px 'Bricolage Grotesque',Inter,sans-serif;color:#1c2a4a;white-space:nowrap;pointer-events:none;text-shadow:0 0 3px rgba(255,255,255,.9)";
                lucht.appendChild(d);
                const bw = d.getBoundingClientRect().width, y = top + sb.top - bb.top;
                const x = Math.max(4, Math.min(bb.width - bw - 4, cx + sb.left - bb.left - bw / 2));
                animate(d, [{ transform: `translate(${x}px, ${y}px) scale(.85)`, opacity: 0 }, { transform: `translate(${x}px, ${y - 10}px) scale(1)`, opacity: 1, offset: .2 },
                    { transform: `translate(${x}px, ${y - 28}px)`, opacity: 1, offset: .75 }, { transform: `translate(${x}px, ${y - 36}px)`, opacity: 0 }], { duration: 5000, easing: 'ease-out' })
                    .finished.then(() => d.remove()).catch(() => d.remove());
            };
            later(titel, 900); const titels = setInterval(titel, 6000);
            later(() => {
                clearInterval(noten); clearInterval(titels);
                anims.forEach(a => a.cancel());
                leden.forEach((m, i) => {
                    const svg = m.w.firstElementChild;
                    animate(svg.querySelector('.voor'), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
                    animate(svg.querySelector('.zij'), [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
                    const x1 = m.x + (fromLeft ? width - cx + maxW / 2 + 60 + EX : -(cx + maxW / 2 + 60 + EX));
                    later(() => { m.b.play();
                        animate(m.w, [{ transform: `translate(${m.x}px, ${m.y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${m.y}px) scaleX(${f})` }], { duration: Math.abs(x1 - m.x) * speed, easing: 'linear' })
                            .finished.then(() => { m.b.cancel(); m.w.remove(); }).catch(() => m.w.remove()); }, 500);
                });
            }, ZING);
        }, inDur + 500);
    }
    const havenloosDur = () => (W() + 220) * 16 + 500 + 16000 + (W() + 220 + EX) * 16 * .5;


    // Gitaarschool (VSK): twee mensen met een gitaar op de rug lopen naar hun les
    function gitarist(h, soort) {
        const p = person(pick(KLEUR), h), svg = p.firstElementChild;
        // gitaar schuin op de rug: kop met stemmechanieken steekt boven de schouder uit, de klankkast achter de rug
        const vorm = 'M0 12.6 q-3.6 0 -3.6 4.4 q0 2.2 1.4 3.4 q-2.6 1.4 -2.6 4.6 q0 4.6 4.8 4.6 q4.8 0 4.8 -4.6 q0 -3.2 -2.6 -4.6 q1.4 -1.2 1.4 -3.4 q0 -4.4 -3.6 -4.4 z';
        const gitaar = soort === 'hout'
            ? `<g transform="translate(1.6 0) rotate(-20 0 21)">
                 <path d="M-.8 13 v-14.6 h1.6 v14.6 z" fill="#5a3418"/><path d="M-.3 -1 v13.6 M.3 -1 v13.6" stroke="#d9c9a0" stroke-width=".18"/>
                 <path d="M-1.4 -1.6 l-.2 -5 q1.6 -1 3.2 0 l-.2 5 z" fill="#3a2414"/>
                 <circle cx="-1.9" cy="-5.6" r=".55" fill="#d8d0c0"/><circle cx="-1.9" cy="-3.6" r=".55" fill="#d8d0c0"/><circle cx="1.9" cy="-5.6" r=".55" fill="#d8d0c0"/><circle cx="1.9" cy="-3.6" r=".55" fill="#d8d0c0"/>
                 <path d="${vorm}" fill="#E0A458" stroke="#7a4518" stroke-width=".7"/>
                 <circle cx="0" cy="19.4" r="1.6" fill="#2a1a10"/><circle cx="0" cy="19.4" r="2.1" fill="none" stroke="#7a4518" stroke-width=".3"/>
                 <rect x="-1.8" y="25.2" width="3.6" height=".9" rx=".3" fill="#3a2414"/></g>`
            : `<g transform="translate(1.6 0) rotate(-20 0 21)">
                 <path d="M-1.3 13 v-14.6 h2.6 v14.6 z" fill="#1d1d1d"/><path d="M-2 -1.2 l-.2 -5.6 q2.2 -1.2 4.4 0 l-.2 5.6 z" fill="#1d1d1d"/>
                 <path d="${vorm}" fill="#262626" stroke="#000" stroke-width=".5" transform="scale(1.12) translate(0 -2.2)"/>
                 <path d="M-3.4 16 q3.4 -1.6 6.8 0" fill="none" stroke="#666" stroke-width=".35"/><path d="M0 0 v28" stroke="#555" stroke-width=".3" stroke-dasharray=".8 .5"/>
                 <path d="M-1.2 21 q1.2 -1.6 2.4 0" fill="none" stroke="#888" stroke-width=".5"/></g>`;
        svg.insertAdjacentHTML('afterbegin', gitaar);                                    // achter het lijf, dus op de rug
        svg.querySelector('path[d^="M3 13 q6"]').insertAdjacentHTML('afterend', '<path d="M14 13.4 l-9 9" stroke="#3a2a1a" stroke-width=".8" opacity=".8"/>');   // draagband
        delete p.dataset.groet;
        return p;
    }
    function gitaarschool() {
        if (document.hidden) return;
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, speed = rand(17, 20);
        const x0 = fromLeft ? -40 : width + 20, x1 = fromLeft ? width + 40 + EX : -60 - EX;
        [[rand(23, 25), 'hout', 0], [rand(20, 23), chance(.5) ? 'hoes' : 'hout', 16]].forEach(([h, soort, off]) => {
            const p = gitarist(h, soort), y = GROUND - h; strip.appendChild(p);
            const b = bob(p, rand(420, 480)), xa = x0 - off * f, xb = x1 - off * f;
            p.style.transform = `translate(${xa}px, ${y}px) scaleX(${f})`;
            animate(p, [{ transform: `translate(${xa}px, ${y}px) scaleX(${f})` }, { transform: `translate(${xb}px, ${y}px) scaleX(${f})` }], { duration: Math.abs(xb - xa) * speed, easing: 'linear' })
                .finished.then(() => { b.cancel(); p.remove(); }).catch(() => p.remove());
        });
    }


    // Zumba: twaalf dames in felle sportkleding komen binnen, dansen in twee rijen mee met de juf en gaan weer verder
    const NEON = ['#2BD66B', '#FF8A1F', '#19C3D6', '#8E5CF0', '#E8452C', '#3B8FE0'];
    function zumbaDame(h, kleur) {
        const p = person(kleur, h), svg = p.firstElementChild;
        svg.querySelectorAll('.legA, .legB').forEach(l => l.setAttribute('stroke', '#232323'));   // zwarte legging
        const haar = pick(['#2b2b2b', '#5a3a2a', '#8b5a2b', '#d9b36a', '#c0392b']);
        svg.insertAdjacentHTML('beforeend', `<path d="M5 3.4 q-3.6 .6 -3.2 6.4" fill="none" stroke="${haar}" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M4.5 3.8 q4.5 -2.2 9 0" fill="none" stroke="#fff" stroke-width="1.1"/>`);   // paardenstaart en zweetband
        delete p.dataset.groet;
        return p;
    }
    function zumba() {
        if (document.hidden) return;
        const width = W(), fromLeft = chance(.5), f = fromLeft ? 1 : -1, speed = 15;
        const ROWS = [{ n: 6, sc: .92, lift: 5, sp: 13, shift: 6.5 }, { n: 6, sc: 1, lift: 0, sp: 14, shift: 0 }];   // achter → voor
        const maxW = 6 * 14 + 40, cx = plek(maxW + 20, .3, .7, zumbaDur());
        const kleuren = NEON.concat(NEON).sort(() => Math.random() - .5);
        const leden = [];
        ROWS.forEach((r, ri) => {
            for (let i = 0; i < r.n; i++) {
                const h = 23 * r.sc * rand(.95, 1.05), w = zumbaDame(h, kleuren[ri * 6 + i]);
                w.style.zIndex = 2;
                leden.push({ w, x: cx - 14 + (i - (r.n - 1) / 2) * r.sp + r.shift - h * .225, y: GROUND - h - r.lift, h, kijk: f });
                strip.appendChild(w);
            }
        });
        // de juf staat voor de groep, met het gezicht naar de dames
        const jh = 25, juf = zumbaDame(jh, '#1b1b1b'); juf.style.zIndex = 2;
        juf.querySelector('.armB').setAttribute('stroke', '#E8452C');
        leden.push({ w: juf, x: cx + f * (maxW / 2 + 6) - jh * .225, y: GROUND - jh, h: jh, kijk: -f, juf: true });
        strip.appendChild(juf);
        // als groep binnen lopen
        const D = fromLeft ? cx + maxW / 2 + 40 : width - cx + maxW / 2 + 40, inDur = D * speed;
        leden.forEach(m => {
            const xa = m.x - D * f;
            m.w.style.transform = `translate(${xa}px, ${m.y}px) scaleX(${f})`;
            m.b = bob(m.w, rand(400, 460));
            animate(m.w, [{ transform: `translate(${xa}px, ${m.y}px) scaleX(${f})` }, { transform: `translate(${m.x}px, ${m.y}px) scaleX(${f})` }], { duration: inDur, easing: 'linear' })
                .finished.then(() => m.b.pause()).catch(() => {});
        });
        // dansjes, allemaal tegelijk op de maat (T = één tel). Armen gaan via achteren omhoog, nooit recht naar voren.
        const T = 460, PASSEN = ['pomp', 'stap', 'spring', 'heup', 'pomp', 'spring'];
        let lopend = [];
        const stop = () => { lopend.forEach(a => a.cancel()); lopend = []; };
        const pas = (naam, keer) => {
            // de plek ook als gewone stijl vastzetten: anders staan ze tussen twee passen heel even op hun startpunt buiten beeld
            leden.forEach(m => { m.w.style.transform = `translate(${m.x}px, ${m.y}px) scaleX(${m.kijk * (keer ? -1 : 1)})`; });
            stop();
            leden.forEach(m => {
                const svg = m.w.firstElementChild, aA = svg.querySelector('.armA'), aB = svg.querySelector('.armB');
                const lA = svg.querySelector('.legA'), lB = svg.querySelector('.legB'), k = keer ? -1 : 1, kijk = m.kijk * k;
                const A = (el, fr, o) => lopend.push(animate(el, fr, Object.assign({ direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }, o)));
                lopend.push(animate(m.w, [{ transform: `translate(${m.x}px, ${m.y}px) scaleX(${kijk})` }], { duration: 1, fill: 'forwards' }));   // kijkrichting
                if (naam === 'pomp') {          // armen om en om de lucht in, kleine sprongetjes
                    A(aA, [{ transform: 'rotate(20deg)' }, { transform: 'rotate(170deg)' }], { duration: T });
                    A(aB, [{ transform: 'rotate(170deg)' }, { transform: 'rotate(20deg)' }], { duration: T });
                    A(svg, [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }], { duration: T / 2 });
                } else if (naam === 'stap') {   // zijpasjes heen en weer, armen zwaaien mee
                    lopend[lopend.length - 1].cancel();
                    A(m.w, [{ transform: `translate(${m.x - 4}px, ${m.y}px) scaleX(${kijk})` }, { transform: `translate(${m.x + 4}px, ${m.y}px) scaleX(${kijk})` }], { duration: T * 2 });
                    A(lA, [{ transform: 'rotate(-18deg)' }, { transform: 'rotate(18deg)' }], { duration: T });
                    A(lB, [{ transform: 'rotate(18deg)' }, { transform: 'rotate(-18deg)' }], { duration: T });
                    A(aA, [{ transform: 'rotate(10deg)' }, { transform: 'rotate(60deg)' }], { duration: T });
                    A(aB, [{ transform: 'rotate(60deg)' }, { transform: 'rotate(10deg)' }], { duration: T });
                } else if (naam === 'spring') { // springen met beide handen boven het hoofd, heen en weer zwaaiend
                    A(svg, [{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }], { duration: T / 2, easing: 'ease-out' });
                    A(aA, [{ transform: 'rotate(150deg)' }, { transform: 'rotate(185deg)' }], { duration: T });
                    A(aB, [{ transform: 'rotate(185deg)' }, { transform: 'rotate(150deg)' }], { duration: T });
                    A(lA, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-14deg)' }], { duration: T / 2 });
                    A(lB, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(14deg)' }], { duration: T / 2 });
                } else {                        // heupen draaien, handen boven het hoofd
                    A(svg, [{ transform: 'rotate(-7deg)' }, { transform: 'rotate(7deg)' }], { duration: T });
                    A(aA, [{ transform: 'rotate(165deg)' }, { transform: 'rotate(175deg)' }], { duration: T });
                    A(aB, [{ transform: 'rotate(175deg)' }, { transform: 'rotate(165deg)' }], { duration: T });
                }
            });
        };
        const DANS = PASSEN.length * T * 6;
        later(() => {
            leden.forEach(m => m.b.cancel());          // de loopbeweging uit, anders zet die de armen steeds terug
            PASSEN.forEach((naam, i) => later(() => pas(naam, i % 2 === 1), i * T * 6));
            const top = Math.min(...leden.map(m => m.y));
            const noten = setInterval(() => { if (chance(.75)) note(cx + rand(-maxW / 2, maxW / 2), top - 4, pick(NEON)); }, 520);
            // "Zumba!" stijgt letter voor letter op uit de groep, tot hoog in de kopbalk
            const roep = () => {
                if (document.hidden) return;
                const sb = strip.getBoundingClientRect(), bb = balk.getBoundingClientRect();
                const x = cx + sb.left - bb.left + rand(-maxW / 4, maxW / 4), y = top + sb.top - bb.top;
                const kl = NEON.slice().sort(() => Math.random() - .5);
                [...'Zumba!'].forEach((ch, i) => {
                    const d = document.createElement('div'); d.textContent = ch;
                    d.style.cssText = `position:absolute;left:0;top:0;font:800 15px 'Bricolage Grotesque',Inter,sans-serif;color:${kl[i % kl.length]};text-shadow:0 1px 0 rgba(0,0,0,.18);pointer-events:none;white-space:pre`;
                    lucht.appendChild(d);
                    const lx = x - 26 + i * 9.5, hoog = Math.min(y - 6, rand(34, 46));
                    animate(d, [{ transform: `translate(${lx}px, ${y}px) scale(.4) rotate(${rand(-20, 20)}deg)`, opacity: 0 },
                        { transform: `translate(${lx}px, ${y - 12}px) scale(1.1) rotate(0deg)`, opacity: 1, offset: .25 },
                        { transform: `translate(${lx + rand(-3, 3)}px, ${y - hoog}px) scale(1) rotate(${rand(-8, 8)}deg)`, opacity: 1, offset: .75 },
                        { transform: `translate(${lx + rand(-5, 5)}px, ${y - hoog - 10}px) scale(.9)`, opacity: 0 }],
                        { duration: 2600, delay: i * 110, easing: 'ease-out', fill: 'backwards' })
                        .finished.then(() => d.remove()).catch(() => d.remove());
                });
            };
            roep(); const roepen = setInterval(roep, 3600);
            later(() => {
                clearInterval(noten); clearInterval(roepen);
                // eerst de plek vastzetten: de inloop-animatie is door de dansanimaties al vervangen, dus zonder dit
                // springen ze na stop() even terug naar hun startpunt buiten beeld
                leden.forEach(m => { m.w.style.transform = `translate(${m.x}px, ${m.y}px) scaleX(${f})`; });
                stop();
                leden.forEach(m => {
                    const x1 = m.x + (fromLeft ? width - cx + maxW / 2 + 60 + EX : -(cx + maxW / 2 + 60 + EX));
                    later(() => { m.w.firstElementChild.querySelectorAll('.armA, .armB, .legA, .legB').forEach(n => n.getAnimations().forEach(a => a.cancel())); m.b = bob(m.w, rand(400, 460));
                        animate(m.w, [{ transform: `translate(${m.x}px, ${m.y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${m.y}px) scaleX(${f})` }], { duration: Math.abs(x1 - m.x) * speed, easing: 'linear' })
                            .finished.then(() => { m.b.cancel(); m.w.remove(); }).catch(() => m.w.remove()); }, 400);
                });
            }, DANS);
        }, inDur + 400);
    }
    const zumbaDur = () => (W() + 220) * 15 + 400 + 6 * 460 * 6 + (W() + 220 + EX) * 15 * .5;


    // Ooievaarspaal: een vaste paal met nest; af en toe landt er een ooievaar die zich nestelt, klepperend, en later weer wegvliegt
    // Achtergrond uit het Dorpsgenoten-logo: vage huisjes (rood en blauw) en het kerkje, en een plaatsnaambord
    // "Ankeveen", zodat je meteen ziet dat dit ons dorp is. Ze staan zacht op de achtergrond, achter alle mensen.
    {
        const ROOD = '#B5401F', BLAUW = '#3B7BC8', vaag = .2;
        const huis = (kleur, h) => `<svg viewBox="0 0 30 34" width="${h * 30 / 34}" height="${h}" aria-hidden="true">
            <path d="M0 13 L15 0 L30 13 V34 H0 Z" fill="${kleur}"/><rect x="5" y="15" width="5.4" height="5.4" rx="1" fill="#fff"/><rect x="19.6" y="15" width="5.4" height="5.4" rx="1" fill="#fff"/>
            <path d="M12 34 V26 q3 -3.4 6 0 V34 Z" fill="#fff"/></svg>`;
        const huis2 = (kleur, h) => `<svg viewBox="0 0 30 40" width="${h * 30 / 40}" height="${h}" aria-hidden="true">
            <path d="M0 12 L15 0 L30 12 V40 H0 Z" fill="${kleur}"/><rect x="5" y="14" width="5.4" height="5.4" rx="1" fill="#fff"/><rect x="12.3" y="14" width="5.4" height="5.4" rx="1" fill="#fff"/><rect x="19.6" y="14" width="5.4" height="5.4" rx="1" fill="#fff"/>
            <rect x="5" y="24" width="5.4" height="5.4" rx="1" fill="#fff"/><rect x="19.6" y="24" width="5.4" height="5.4" rx="1" fill="#fff"/></svg>`;
        const kerk = h => `<svg viewBox="0 0 40 80" width="${h / 2}" height="${h}" aria-hidden="true">
            <path d="M20 0 L23 22 H17 Z" fill="${ROOD}"/><path d="M16 22 h8 v6 q2 0 2 3 v8 h-12 v-8 q0 -3 2 -3 z" fill="${ROOD}"/>
            <path d="M18.4 31 v5 M21.6 31 v5" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M8 46 h4 v-3 h4 v-4 h8 v4 h4 v3 h4 v4 q4 0 4 4 V80 H4 V54 q0 -4 4 -4 z" fill="${ROOD}"/>
            <path d="M15.4 56 v10 M20 54 v12 M24.6 56 v10" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M16 80 v-7 q4 -3 8 0 v7 z" fill="#fff"/></svg>`;
        // dorpscafé 't Wapen van Ankeveen, van voren: wit gepleisterd, groot donker dak met dakkapel, puntgevel, vlag
        const cafe = h => `<svg viewBox="-6 -3 78 51" width="${h * 78 / 51}" height="${h}" aria-hidden="true"><path d="M0 27 L9 9 H41 L46 27 Z" fill="#5A3A2A"/><path d="M15 21 V14 H29 V21 Z" fill="#F4F1EA"/><path d="M14 14 L22 10.4 L30 14 Z" fill="#4A2E20"/><rect x="17.2" y="15.4" width="4.4" height="4.6" fill="#2F3A40"/><rect x="22.6" y="15.4" width="4.4" height="4.6" fill="#2F3A40"/><rect x="34" y="4" width="3" height="7" fill="#7A4E3A"/><rect x="1.5" y="27" width="44.5" height="20" fill="#F4F1EA"/><rect x="1.5" y="42.6" width="44.5" height="4.4" fill="#C9C3B8"/><path d="M1.5 44.8 H46" stroke="#AFA89C" stroke-width=".4"/><g fill="#2F3A40" stroke="#C9C3B8" stroke-width="1.2"><rect x="4.5" y="30" width="8" height="10.5"/><rect x="15.5" y="30" width="8" height="10.5"/><rect x="35.5" y="30" width="8" height="10.5"/></g><path d="M8.5 30 V40.5 M19.5 30 V40.5 M39.5 30 V40.5" stroke="#C9C3B8" stroke-width=".5"/><rect x="26.5" y="29.5" width="6.4" height="17.5" fill="#3A2A22" stroke="#C9C3B8" stroke-width="1"/><rect x="27.8" y="31" width="3.8" height="6" fill="#2F3A40"/><path d="M1.5 29 H-3" stroke="#3a3a3a" stroke-width=".8"/><circle cx="-3" cy="32.4" r="2.8" fill="#1F6E43" stroke="#F4F1EA" stroke-width=".6"/><path d="M23 47 L24.6 40 H27.4 L29 47" fill="none" stroke="#5A3A2A" stroke-width=".8"/><rect x="24" y="40.2" width="4" height="4.6" fill="#222"/><path d="M46 47 V17 L58 4 L70 17 V47 Z" fill="#F4F1EA"/><path d="M44.6 18.4 L58 3.2 L71.4 18.4" fill="none" stroke="#5A3A2A" stroke-width="2.2" stroke-linejoin="round"/><path d="M58 3.2 V-2" stroke="#4A2E20" stroke-width=".7"/><rect x="55.6" y="9" width="4.8" height="5" fill="#2F3A40" stroke="#C9C3B8" stroke-width=".8"/><rect x="53.4" y="19" width="9.2" height="9" fill="#2F3A40" stroke="#C9C3B8" stroke-width="1"/><path d="M58 19 V28" stroke="#C9C3B8" stroke-width=".5"/><rect x="52.6" y="31" width="10.8" height="16" fill="#2F3A40" stroke="#C9C3B8" stroke-width="1"/><path d="M58 31 V47" stroke="#C9C3B8" stroke-width=".6"/><path d="M46.4 25 L40 13.6" stroke="#6b6b6b" stroke-width=".7"/><path d="M40.3 14.1 L43.4 19.6 L41.2 25.2 L38.4 19.4 Z" fill="#fff" stroke="#ccc" stroke-width=".2"/><path d="M40.3 14.1 L41.35 15.95 L39.2 21.3 L38.4 19.4 Z" fill="#AE1C28"/><path d="M42.35 17.75 L43.4 19.6 L41.2 25.2 L40.2 23.2 Z" fill="#21468B"/></svg>`;
        const bg = document.createElement('div');
        bg.setAttribute('aria-hidden', 'true');
        bg.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0';
        // [positie %, svg, alleen op bredere schermen]
        const stukken = [[17, huis(ROOD, 26), false], [22, huis2(BLAUW, 30), true], [51, kerk(52), false], [58, huis(ROOD, 27), true],
            [73, huis2(ROOD, 29), false], [78.5, huis(BLAUW, 25), true]];
        stukken.push(['calc(51% - 44px)', cafe(36), false, .4]);                 // het café staat een stukje links van het kerkje
        stukken.forEach(([pct, svg, breed, op]) => {
            const d = document.createElement('div');
            d.style.cssText = `position:absolute;left:${typeof pct === 'number' ? pct + '%' : pct};bottom:${H - GROUND}px;transform:translateX(-50%);opacity:${op || vaag};line-height:0`;
            d.innerHTML = svg; if (breed) d.className = 'om-breed';
            bg.appendChild(d);
        });
        // plaatsnaambord Ankeveen (blauw met witte rand), rechts
        const bord = document.createElement('div');
        bord.style.cssText = `position:absolute;right:max(14px, 4%);bottom:${H - GROUND}px;line-height:0;opacity:.85`;
        bord.innerHTML = `<svg viewBox="0 0 54 30" width="54" height="30" aria-hidden="true">
            <path d="M14 14 V30 M40 14 V30" stroke="#8a8f96" stroke-width="1.6"/>
            <rect x="1" y="1" width="52" height="15" rx="3" fill="#0F4C92"/><rect x="2.6" y="2.6" width="48.8" height="11.8" rx="2" fill="none" stroke="#fff" stroke-width="1"/>
            <text x="27" y="11.4" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="8" fill="#fff" letter-spacing=".3">Ankeveen</text></svg>`;
        bg.appendChild(bord);
        const st = document.createElement('style');
        st.textContent = '@media (max-width: 640px){ #ontmoeten .om-breed{display:none} }';
        document.head.appendChild(st);
        strip.appendChild(bg);
    }
    const PH = Math.min(46, GROUND - 6);            // paalhoogte: ruim boven de mensen uit
    const paal = document.createElement('div'), rand0 = document.createElement('div');
    const TAK = '#7a5a36', TAK2 = '#9c7a4e';
    paal.style.cssText = rand0.style.cssText = `position:absolute;top:${GROUND + 2 - PH}px;left:max(16px, 7%);width:26px;height:${PH}px;margin-left:-13px;pointer-events:none`;
    paal.innerHTML = `<svg viewBox="0 0 26 ${PH}" width="26" height="${PH}" aria-hidden="true"><path d="M12 9 h2.2 v${PH - 9} h-2.2 z" fill="#6b5a48"/><path d="M5 10.5 h16 v1.6 h-16 z" fill="#5a4a3a"/>
        <path d="M2 8 q11 -6.5 22 0 v1.6 q-11 -2.6 -22 0 z" fill="${TAK}"/></svg>`;
    rand0.innerHTML = `<svg viewBox="0 0 26 ${PH}" width="26" height="${PH}" aria-hidden="true">
        <path d="M1 8 q12 3.6 24 0 l-1.2 3 q-10.8 2.6 -21.6 0 z" fill="${TAK}"/>
        <path d="M2 8.6 l5 2.2 M6 8.2 l6 3 M12 9.6 l6 -1.6 M17 10.6 l7 -2.6 M4 10.4 l7 -1 M15 9 l6 2" stroke="${TAK2}" stroke-width=".7" stroke-linecap="round"/>
        <path d="M0 7.6 l3.6 1.4 M22.4 9 l3.6 -1.6" stroke="${TAK}" stroke-width=".9" stroke-linecap="round"/></svg>`;
    const ooi = document.createElement('div');
    ooi.style.cssText = 'position:absolute;left:0;top:0;width:30px;height:20px;pointer-events:none;will-change:transform;opacity:0';
    const POOT = '#E0472B';
    // Witte ooievaar: lange rechte, spits toelopende rode snavel, lange nek, zwarte slagpennen, lange rode poten
    const GR = '#6f757c', SNAVEL = '#E2502A';
    ooi.innerHTML = `<svg class="staan" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" style="position:absolute;left:5px;top:0;overflow:visible;opacity:0">
          <path d="M8.4 12.6 l.3 3.6 l-.2 3.8 M10.6 12.6 l-.2 3.6 l.3 3.8" fill="none" stroke="${POOT}" stroke-width=".9"/>
          <ellipse cx="8.6" cy="10.6" rx="6" ry="3.1" fill="#fff" stroke="${GR}" stroke-width=".7" transform="rotate(-14 8.6 10.6)"/>
          <path d="M2.2 12.6 q4.4 2.2 9.4 .2 q-1.4 2 -4.8 2.2 q-3 .1 -4.6 -2.4 z" fill="#1d1d1d"/>
          <g class="kop" style="transform-box:view-box;transform-origin:13px 9px">
            <path d="M12.8 9.4 q1.4 -2.4 1.6 -6.4" fill="none" stroke="${GR}" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="14.7" cy="2.6" rx="1.95" ry="1.6" fill="${GR}"/>
            <path d="M12.8 9.4 q1.4 -2.4 1.6 -6.4" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="14.7" cy="2.6" rx="1.4" ry="1.05" fill="#fff"/>
            <path d="M15.7 1.9 L22.4 4.6 L15.8 3.3 Z" fill="${SNAVEL}" stroke="#b83a1c" stroke-width=".25" stroke-linejoin="round"/>
            <circle cx="15" cy="2.3" r=".42" fill="#1d1d1d"/></g></svg>
        <svg class="vlieg" viewBox="0 0 30 16" width="30" height="16" aria-hidden="true" style="position:absolute;left:0;top:2px;overflow:visible">
          <path d="M8.8 8.5 l-9.6 1.2" stroke="${POOT}" stroke-width=".75"/>
          <path d="M18.4 7.7 l5.6 -.5" stroke="${GR}" stroke-width="2.3" stroke-linecap="round"/><ellipse cx="24.5" cy="7.1" rx="1.75" ry="1.4" fill="${GR}"/>
          <ellipse cx="13.5" cy="8" rx="5.6" ry="1.9" fill="#fff" stroke="${GR}" stroke-width=".7"/>
          <path d="M18.4 7.7 l5.6 -.5" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/><ellipse cx="24.5" cy="7.1" rx="1.2" ry=".9" fill="#fff"/>
          <path d="M25.4 6.6 L31.6 8.2 L25.5 7.6 Z" fill="${SNAVEL}" stroke="#b83a1c" stroke-width=".25" stroke-linejoin="round"/>
          <path d="M8.2 8.6 l-2 .4 l2 .6 z" fill="#fff" stroke="${GR}" stroke-width=".4"/>
          <g class="vleugel" style="transform-box:view-box;transform-origin:14px 7.6px">
            <path d="M10.6 7.7 L4.6 .2 L4.4 -1.4 L5.8 -1 L6 -2.6 L7.4 -1.9 L8 -3.2 L9.3 -2 L17.2 7.5 Z" fill="#1d1d1d"/>
            <path d="M13 7.6 L9.2 -1.2 L10.6 -.4 L17.2 7.5 Z" fill="#fff" stroke="${GR}" stroke-width=".5" stroke-linejoin="round"/></g></svg>`;
    paal.style.zIndex = rand0.style.zIndex = ooi.style.zIndex = 1;      // ganzen (z-index 0) vliegen achter de paal langs
    strip.appendChild(paal); strip.appendChild(ooi); strip.appendChild(rand0);
    let ooiThuis = false, ooiBezig = false, ooiSinds = 0;
    const nestX = () => paal.offsetLeft + 13, NESTY = GROUND + 2 - PH + 8;       // midden bovenop het nest
    const zet = (x, y, r) => `translate(${x - 15}px, ${y - 20}px) scaleX(${r})`;   // x,y = voeten van de ooievaar
    // Vliegen doet hij in de hele kopbalk (ook over de letters heen); op het nest zit hij in de strook, achter de nestrand.
    const balk = document.getElementById('topbar') || strip.parentElement;
    const lucht = document.createElement('div');
    lucht.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:3;overflow:hidden';
    lucht.setAttribute('aria-hidden', 'true');
    balk.appendChild(lucht);
    const dy = () => strip.getBoundingClientRect().top - balk.getBoundingClientRect().top;   // strook t.o.v. de kopbalk
    const dx = () => strip.getBoundingClientRect().left - balk.getBoundingClientRect().left;
    const naarLucht = () => { lucht.appendChild(ooi); };
    const naarNest = () => { strip.insertBefore(ooi, rand0); };
    function ooievaar() {
        if (ooiBezig || document.hidden) return;
        if (ooiThuis && performance.now() - ooiSinds < 25000) return;           // net geland: eerst even blijven zitten
        ooiBezig = true;
        const staan = ooi.querySelector('.staan'), vlieg = ooi.querySelector('.vlieg'), vl = ooi.querySelector('.vleugel');
        const klap = () => animate(vl, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(-.7)' }], { duration: 260, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        const oy = dy(), ox = dx(), xn = nestX() + ox, yn = NESTY + oy, width = balk.clientWidth;
        const hoog = () => rand(16, Math.max(18, oy - 4));                      // vlieghoogte: ter hoogte van de letters
        if (!ooiThuis) {
            // hoog over de kopbalk aanvliegen en dan zwevend naar het nest dalen
            const vanRechts = chance(.6), r = vanRechts ? -1 : 1, xa = vanRechts ? width + 40 : -40, dur = Math.abs(xn - xa) * 9, y0 = hoog();
            naarLucht();
            ooi.style.transform = zet(xa, y0, r); ooi.style.opacity = 1;
            staan.style.opacity = 0; vlieg.style.opacity = 1;
            const k = klap();
            animate(ooi, [{ transform: zet(xa, y0, r) }, { transform: zet(xa + (xn - xa) * .5, hoog(), r), offset: .5 }, { transform: zet(xn - r * 26, yn - 14, r), offset: .85 }, { transform: zet(xn, yn, r) }], { duration: dur, easing: 'ease-out' });
            later(() => k.cancel(), dur * .65);                                    // het laatste stuk zweeft hij
            later(() => {
                // in de strook zetten (achter de nestrand), op dezelfde plek
                naarNest(); ooi.getAnimations().forEach(a => a.cancel());   // ook al afgelopen animaties (die met fill vasthouden)
                ooi.style.transform = zet(nestX(), NESTY, r);
                animate(vlieg, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }); animate(staan, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
                // even rondkijken, dan nestelt hij zich (zakt in het nest) en klepperen: kop in de nek, snavel omhoog
                later(() => animate(staan, [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }], { duration: 900, easing: 'ease-in-out' }), 1400);
                later(() => animate(staan.querySelector('.kop'), [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-55deg)', offset: .15 }, { transform: 'rotate(-48deg)', offset: .3 }, { transform: 'rotate(-55deg)', offset: .45 }, { transform: 'rotate(-48deg)', offset: .6 }, { transform: 'rotate(-55deg)', offset: .75 }, { transform: 'rotate(0deg)' }], { duration: 1600, easing: 'ease-in-out' }), 3000);
                ooiThuis = true; ooiBezig = false; ooiSinds = performance.now();
            }, dur);
        } else {
            // opstaan, opvliegen en hoog over de kopbalk weg
            animate(staan, [{ transform: 'translateY(4px)' }, { transform: 'translateY(0)' }], { duration: 600, easing: 'ease-out' });
            later(() => {
                const naarRechts = chance(.5), r = naarRechts ? 1 : -1, xb = naarRechts ? width + 50 : -50, dur = Math.abs(xb - xn) * 8;
                ooi.getAnimations().forEach(a => a.cancel());   // ook al afgelopen animaties (die met fill vasthouden)
                naarLucht(); ooi.style.transform = zet(xn, yn, r);
                animate(staan, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }); animate(vlieg, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
                const k = klap();
                animate(ooi, [{ transform: zet(xn, yn, r) }, { transform: zet(xn + r * 40, yn - 16, r), offset: .15 }, { transform: zet(xn + (xb - xn) * .5, hoog(), r), offset: .55 }, { transform: zet(xb, hoog(), r) }], { duration: dur, easing: 'ease-in' })
                    .finished.then(() => { k.cancel(); ooi.style.opacity = 0; ooiThuis = false; ooiBezig = false; }).catch(() => { ooiBezig = false; });
            }, 700);
        }
    }
    // bij draaien of breder maken van het scherm schuift de paal mee (7%), dus de zittende ooievaar ook
    addEventListener('resize', () => { if (ooiThuis && !ooiBezig) ooi.style.transform = zet(nestX(), NESTY, /scaleX\(-1\)/.test(ooi.style.transform) ? -1 : 1); });
    const ooiRonde = () => { const was = ooiThuis; ooievaar(); setTimeout(ooiRonde, was ? rand(35000, 70000) : rand(30000, 50000)); };
    if (!REDUCE) setTimeout(ooiRonde, rand(8000, 18000));


    // Ruiter: amazone met donkere cap, blonde paardenstaart en zwart leren jasje op een bruinbonte paint (wit met
    // vosbruin, zwarte manen en staart, witte bles), in rustige stap. Viertakt: achter-links, voor-links, achter-rechts, voor-rechts.
    let ruiterNr = 0;
    function ruiter() {
        if (document.hidden) return;
        const BR = '#7a3d1c', WIT = '#f3efe6', ZW = '#1e1a18', RAND = '#6e5a48', LIJN = '#4a2410', T = 620, HOEK = 19, id = 'rb' + (++ruiterNr);
        const been = (cls, x, y, kleur, sok) => `<g class="${cls}" style="transform-box:view-box;transform-origin:${x}px ${y}px">
              <path d="M${x} ${y} l.2 9.4" stroke="${kleur}" stroke-width="2.6" stroke-linecap="round"/>
              <g class="ond" style="transform-box:view-box;transform-origin:${x + .2}px ${y + 9.4}px">
                ${sok ? `<path d="M${x + .2} ${y + 9.4} l0 8.6" stroke="${RAND}" stroke-width="2.7" stroke-linecap="round"/>` : ''}<path d="M${x + .2} ${y + 9.4} l0 8.6" stroke="${sok ? WIT : kleur}" stroke-width="1.9" stroke-linecap="round"/>
                <path d="M${x - .9} ${y + 18.3} h2.4" stroke="#2a2420" stroke-width="1.3" stroke-linecap="round"/></g></g>`;
        const w = document.createElement('div'); w.className = 'om-p';
        const sc = .92, vw = 60, vh = 52;
        w.style.width = vw * sc + 'px'; w.style.height = vh * sc + 'px';
        w.innerHTML = `<svg viewBox="0 -6 ${vw} ${vh}" width="${vw * sc}" height="${vh * sc}" aria-hidden="true" style="overflow:visible">
          ${been('vR', 37.6, 25, BR, false)}${been('aR', 19.6, 24, BR, true)}
          <g class="romp">
            <path class="staart" d="M14.6 18.6 q-4.2 2 -3.4 9 q.4 4.6 -1 8 q2.6 -1.2 3.4 -5.6 q.8 -4.2 2.6 -9.4 z" fill="${ZW}" style="transform-box:view-box;transform-origin:14.6px 18.6px"/>
            <clipPath id="${id}"><ellipse cx="27" cy="21.6" rx="13.6" ry="6.4"/></clipPath>
            <ellipse cx="27" cy="21.6" rx="13.6" ry="6.4" fill="${BR}"/>
            <g clip-path="url(#${id})"><path d="M21 16.2 q7 -1.6 12.4 .6 q1.8 5.4 -1.6 11.2 q-7.4 1.6 -11.6 -.8 q-2.6 -5.6 .8 -11 z" fill="${WIT}"/>
            <path d="M13 20 q3.8 -3.6 6.4 -3.2 q-.8 4 -.2 9.4 q-3.4 -.6 -6.2 -6.2 z" fill="${WIT}"/></g>
            <ellipse cx="27" cy="21.6" rx="13.6" ry="6.4" fill="none" stroke="${LIJN}" stroke-width=".7"/>
            <g class="hals" style="transform-box:view-box;transform-origin:36px 19px">
              <path d="M33.4 17.4 L40.6 5.4 L45.2 6.2 L41.4 23.6 Z" fill="${BR}" stroke="${LIJN}" stroke-width=".6" stroke-linejoin="round"/>
              <path d="M38.6 21.4 L42.6 12.4 L43.8 12.8 L41.4 23.6 Z" fill="${WIT}"/>
              <path d="M33.6 16.6 q2.2 -6 6.6 -11.6 l1.4 .6 q-3.6 6 -5.6 12.2 z" fill="${ZW}"/>
              <path d="M41.6 3.6 l1 -3 l1.2 3.4 z" fill="${BR}"/>
              <path d="M40.6 4.2 Q43.8 2.8 45.8 4.6 L52 10.4 Q53.2 12.6 51 13.6 L49 13.6 Q45.8 12 41.8 9.8 Z" fill="${BR}" stroke="${LIJN}" stroke-width=".5" stroke-linejoin="round"/>
              <path d="M45.2 4.4 L52.1 10.7 Q52.6 11.8 52 12.4 L51.3 11.5 L44.9 5.5 Z" fill="${WIT}"/>
              <circle cx="45.2" cy="6.8" r=".55" fill="${ZW}"/>
              <path d="M44.2 4.4 L43.4 9.4 M43.8 7.2 L50.2 12.4" stroke="#2a1a12" stroke-width=".5" fill="none"/></g>
            <path d="M22 14.6 q5.6 -1.8 10.4 0 l-.4 3 q-4.8 -1.4 -9.6 0 z" fill="${ZW}" stroke="#e8dcc4" stroke-width=".7"/>
            <g class="amazone" style="transform-box:view-box;transform-origin:27px 15px">
                            <path d="M26.6 14.2 l2.8 4.6 l-1.2 5.6" fill="none" stroke="${ZW}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M27.6 24.2 l1.8 .2" stroke="#6b4a2e" stroke-width="2" stroke-linecap="round"/>
              <path d="M25.2 14.8 l1.2 -9.2 l3.6 .2 l.4 9 z" fill="#2b2b2b"/>
              <path d="M28.4 6.6 l2.6 4.4 l3.2 .8" fill="none" stroke="#2b2b2b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="28.2" cy="2.6" r="2.4" fill="#F2C9B0"/>
              <path d="M25.6 2.4 q.2 -3.4 2.8 -3.4 q2.6 0 2.8 3 q-2.8 -1 -5.6 .4 z M30.4 1.8 l1.6 .3" fill="#4a4a4a" stroke="#4a4a4a" stroke-width=".5"/>
              <path d="M26.2 2.4 q-1.8 1.4 -1.4 5.6" fill="none" stroke="#d9b36a" stroke-width="1.5" stroke-linecap="round"/>
              <g class="zwaaiR" style="opacity:0;transform-box:view-box;transform-origin:28.8px 6.6px"><path d="M28.8 6.6 L32.4 -1.6" stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round"/><circle cx="32.7" cy="-2.5" r="1.4" fill="#F2C9B0"/></g>
              <path d="M34 11.8 Q42 10 50.4 12.8" fill="none" stroke="#3a2418" stroke-width=".45"/></g>
          </g>
          ${been('vL', 36, 25, BR, true)}${been('aL', 18, 24, BR, false)}</svg>`;
        strip.appendChild(w);
        const fromLeft = chance(.5), width = W(), f = fromLeft ? 1 : -1, speed = 30, y = GROUND - 49.8 * sc;
        const x0 = fromLeft ? -70 : width + 20, x1 = fromLeft ? width + 70 + EX : -110 - EX;
        w.style.transform = `translate(${x0}px, ${y}px) scaleX(${f})`;
        const svg = w.firstElementChild, anims = [];
        // benen: steunfase (hoef van voor naar achter) en zwaaifase met gebogen knie
        [['aL', 0], ['vL', .25], ['aR', .5], ['vR', .75]].forEach(([c, fase]) => {
            const g = svg.querySelector('.' + c), o = { duration: T, iterations: Infinity, delay: -fase * T };
            const voor = c[0] === 'v';
            anims.push(animate(g, [{ transform: `rotate(${-HOEK}deg)`, offset: 0 }, { transform: `rotate(${HOEK}deg)`, offset: .64, easing: 'ease-in-out' }, { transform: `rotate(${HOEK * .4}deg)`, offset: .76, easing: 'ease-out' }, { transform: `rotate(${-HOEK - 2}deg)`, offset: .94 }, { transform: `rotate(${-HOEK}deg)`, offset: 1 }], Object.assign({ easing: 'linear' }, o)));
            anims.push(animate(g.querySelector('.ond'), [{ transform: 'rotate(0deg)', offset: 0 }, { transform: 'rotate(0deg)', offset: .6 }, { transform: `rotate(${voor ? 55 : 40}deg)`, offset: .76 }, { transform: `rotate(${voor ? 10 : 6}deg)`, offset: .9 }, { transform: 'rotate(0deg)', offset: 1 }], Object.assign({ easing: 'ease-in-out' }, o)));
        });
        anims.push(animate(svg.querySelector('.romp'), [{ transform: 'translateY(0)' }, { transform: 'translateY(.7px)' }], { duration: T / 2, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }));
        anims.push(animate(svg.querySelector('.hals'), [{ transform: 'rotate(-2.5deg)' }, { transform: 'rotate(2.5deg)' }], { duration: T / 2, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }));
        anims.push(animate(svg.querySelector('.amazone'), [{ transform: 'rotate(-1.5deg)' }, { transform: 'rotate(1.5deg)' }], { duration: T / 2, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: T / 8 }));
        anims.push(animate(svg.querySelector('.staart'), [{ transform: 'rotate(-4deg)' }, { transform: 'rotate(5deg)' }], { duration: T, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }));
        animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: Math.abs(x1 - x0) * speed, easing: 'linear' })
            .finished.then(() => { anims.forEach(a => a.cancel()); w.remove(); }).catch(() => w.remove());
        // de amazone zwaait naar iedereen die ze tegenkomt, en de meesten zwaaien terug
        const arm = svg.querySelector('.zwaaiR'), gegroet = new WeakSet(); let bezig = 0;
        const kijk = setInterval(() => {
            if (!w.isConnected) { clearInterval(kijk); return; }
            if (document.hidden || performance.now() < bezig) return;
            const r = w.getBoundingClientRect(), mid = r.left + r.width / 2, sw = strip.getBoundingClientRect();
            if (mid < sw.left + 10 || mid > sw.right - 10) return;
            const wie = [...strip.querySelectorAll('[data-groet]')].find(el => { if (gegroet.has(el)) return false; const q = el.getBoundingClientRect(); return Math.abs(q.left + q.width / 2 - mid) < 75; });
            if (!wie) return;
            gegroet.add(wie); bezig = performance.now() + 2600;
            arm.animate([{ opacity: 0, transform: 'rotate(0deg)' }, { opacity: 1, transform: 'rotate(-16deg)', offset: .12 }, { opacity: 1, transform: 'rotate(16deg)', offset: .3 }, { opacity: 1, transform: 'rotate(-16deg)', offset: .48 },
                { opacity: 1, transform: 'rotate(16deg)', offset: .66 }, { opacity: 1, transform: 'rotate(-10deg)', offset: .84 }, { opacity: 0, transform: 'rotate(0deg)' }], { duration: 1800, easing: 'ease-in-out' });
            if (chance(.75)) setTimeout(() => { if (wie.isConnected) { delete wie.dataset.gezwaaid; zwaai(wie); } }, 450);
        }, 300);
    }

    // Kermis: rechts van het logo verrijst een reuzenrad, draait een tijdje met bakjes, en zakt dan weer in
    function kermis() {
        if (document.hidden) return;
        const bar = document.getElementById('topbar'), logo = bar && bar.querySelector('a');
        if (!bar || !logo) return;
        const br = bar.getBoundingClientRect(), lr = logo.getBoundingClientRect();
        const left = lr.right - br.left + 24, bottom = br.bottom - (strip.getBoundingClientRect().bottom - 8);   // voet op de stoeprand
        // vrije ruimte tussen logo en menu (op een smal scherm is dat de hamburgerknop); te weinig: geen kermis, iets te weinig: kleiner
        const menu = Array.from(bar.querySelectorAll('.top-links, #topMenuBtn')).map(el => el.getBoundingClientRect()).filter(r => r.width > 0 && r.left > lr.right);
        const menuLeft = menu.length ? Math.min(...menu.map(r => r.left)) - br.left : br.width;
        const SC = 84 / 96, VB = 132;                          // reuzenrad (0-96) met rechts ernaast de kop van Jut (96-132)
        const free = menuLeft - 10 - left, sc = Math.min(1, free / (VB * SC));
        if (sc < .55) return;                                  // te smal scherm: geen kermis
        const w = document.createElement('div'); w.className = 'om-kermis';
        w.style.cssText = `position:absolute;left:${left}px;bottom:${bottom}px;width:${VB * SC}px;height:84px;transform-origin:0 100%;transform:scale(${sc});pointer-events:none;z-index:0`;
        const KL = ['#B23A2E', '#2F5D8A', '#C9A227', '#3F7D4E', '#B23A2E', '#2F5D8A', '#C9A227', '#3F7D4E'];
        const RAND = '#7a2e22', HOUT = '#f1e6cf', DONKER = '#4a3b2f';
        // ouderwetse vakwerkpoten: twee lijnen met een zigzag ertussen
        const vakwerk = (ax, ay, bx, by, cx, cy, dx, dy, n) => { let d = `M${ax} ${ay} L${bx} ${by} M${cx} ${cy} L${dx} ${dy} M${ax} ${ay}`;
            for (let i = 1; i <= n; i++) { const t = i / n, o = i % 2; d += ` L${(o ? cx + (dx - cx) * t : ax + (bx - ax) * t).toFixed(1)} ${(o ? cy + (dy - cy) * t : ay + (by - ay) * t).toFixed(1)}`; } return d; };
        const poten = vakwerk(46, 46, 22, 95, 49, 47, 31, 95, 9) + ' ' + vakwerk(50, 46, 74, 95, 47, 47, 65, 95, 9);
        // velg: dubbele ring met zigzag-vakwerk ertussen
        let zig = ''; for (let i = 0; i <= 48; i++) { const a = i * Math.PI / 24, r = i % 2 ? 29 : 34; zig += `${i ? 'L' : 'M'}${(48 + r * Math.cos(a)).toFixed(1)} ${(44 + r * Math.sin(a)).toFixed(1)} `; }
        const spaken = Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return `M${48 + 5 * Math.cos(a)} ${44 + 5 * Math.sin(a)} L${(48 + 29 * Math.cos(a)).toFixed(1)} ${(44 + 29 * Math.sin(a)).toFixed(1)}`; }).join(' ');
        const lampjes = Array.from({ length: 16 }, (_, i) => { const a = (i + .5) * Math.PI / 8; return `<circle cx="${(48 + 34 * Math.cos(a)).toFixed(1)}" cy="${(44 + 34 * Math.sin(a)).toFixed(1)}" r="1.1" fill="#ffe08a"/>`; }).join('');
        const gond = KL.map((c, i) => { const a = i * Math.PI / 4, x = 48 + 34 * Math.cos(a), y = 44 + 34 * Math.sin(a);
            return `<g class="gond" style="transform-box:fill-box;transform-origin:50% 0%"><g transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><path d="M0 0 v3.4" stroke="${DONKER}" stroke-width=".9"/><path d="M-5 4.4 q5 -3.2 10 0 z" fill="${c}"/><path d="M-4.4 4.4 v4.6 M4.4 4.4 v4.6" stroke="${DONKER}" stroke-width=".6"/><path d="M-4.6 8 h9.2 l-.8 3.4 h-7.6 z" fill="${c}"/><path d="M-4.6 8 h9.2" stroke="${HOUT}" stroke-width=".7"/></g></g>`; }).join('');
        // kop van Jut: blok om op te slaan, een paal met schaalverdeling, het gewicht dat omhoog schiet en de bel
        const streep = Array.from({ length: 9 }, (_, i) => `<rect x="115.6" y="${18 + i * 8}" width="4.8" height="4" fill="${i % 2 ? '#B23A2E' : '#F2C318'}"/>`).join('');
        w.innerHTML = `<svg viewBox="0 0 ${VB} 96" width="${VB * SC}" height="84" aria-hidden="true" style="overflow:visible">
            <path d="${poten}" fill="none" stroke="${RAND}" stroke-width="1.3" stroke-linejoin="round"/>
            <path d="M18 95.5 h60" stroke="${DONKER}" stroke-width="2"/>
            <g class="rad" style="transform-box:view-box;transform-origin:48px 44px">
              <path d="${zig}" fill="none" stroke="${RAND}" stroke-width=".8"/>
              <circle cx="48" cy="44" r="34" fill="none" stroke="${RAND}" stroke-width="2"/>
              <circle cx="48" cy="44" r="29" fill="none" stroke="${RAND}" stroke-width="1.2"/>
              <path d="${spaken}" stroke="${HOUT}" stroke-width="1.1"/>
              <path d="${spaken}" stroke="${RAND}" stroke-width=".35"/>
              <circle cx="48" cy="44" r="9" fill="none" stroke="${RAND}" stroke-width=".8"/>
              ${lampjes}
              ${gond}
            </g>
            <circle cx="48" cy="44" r="5" fill="${HOUT}" stroke="${RAND}" stroke-width="1.2"/><circle cx="48" cy="44" r="1.8" fill="${RAND}"/>
            <rect x="99" y="92" width="27" height="4" rx=".6" fill="#8b5a2b"/>
            <rect x="100" y="89.2" width="8" height="3" rx="1" fill="#B23A2E" stroke="${DONKER}" stroke-width=".5"/>
            <rect x="115.6" y="14" width="4.8" height="78" fill="${HOUT}" stroke="${DONKER}" stroke-width=".6"/>
            ${streep}
            <rect class="puk" x="114.4" y="86" width="7.2" height="3.4" rx=".8" fill="#D64541" stroke="#8a1c1c" stroke-width=".5"/>
            <path d="M112 11 h12" stroke="${DONKER}" stroke-width="1.4"/>
            <g class="bel" style="transform-box:view-box;transform-origin:118px 4px"><path d="M114.2 10.6 q0 -5.4 3.8 -6 q3.8 .6 3.8 6 z" fill="#E0B23A" stroke="#9a7420" stroke-width=".5"/><circle cx="118" cy="3.6" r="1" fill="#9a7420"/></g>
            <circle class="pling" cx="118" cy="7" r="7" fill="none" stroke="#F2C318" stroke-width="1.6" opacity="0" style="transform-box:fill-box;transform-origin:center"/>
            <g class="stralen" opacity="0" style="transform-box:fill-box;transform-origin:center">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M118 7 l0 -9" stroke="${a % 90 ? '#D64541' : '#F2C318'}" stroke-width="1.6" stroke-linecap="round" transform="rotate(${a} 118 7)"/>`).join('')}</g>
            </svg>`;
        bar.style.position = bar.style.position || 'sticky'; bar.appendChild(w);
        // verrijzen
        animate(w, [{ transform: `scale(${sc}) scaleY(0)` }, { transform: `scale(${sc}) scaleY(1.04)`, offset: .85 }, { transform: `scale(${sc})` }], { duration: 2200, easing: 'ease-out' });
        const rad = w.querySelector('.rad');
        const spin = animate(rad, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 14000, iterations: Infinity, easing: 'linear', delay: 2200 });
        w.querySelectorAll('.gond').forEach(g => animate(g, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }], { duration: 14000, iterations: Infinity, easing: 'linear', delay: 2200 }));
        // een rij mensen komt kijken en staat er even onder
        const kijkers = [];
        later(() => { for (let i = 0; i < 3; i++) { const h = chance(.4) ? rand(14, 17) : rand(20, 25), p = person(pick(KLEUR), h); strip.appendChild(p);
            const x0 = chance(.5) ? -40 : W() + 20, x1 = left + 10 + i * 16, y = GROUND - h, f = x1 > x0 ? 1 : -1;
            p.style.transform = `translate(${x0}px, ${y}px) scaleX(${f})`; const b = bob(p, 420);
            animate(p, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: Math.abs(x1 - x0) * 14, easing: 'linear' }).finished.then(() => b.pause()).catch(() => {});
            kijkers.push({ p, b, x1, y }); } }, 2500);
        const stay = 38000;
        // twee mensen slaan om de beurt met een grote houten hamer op de kop van Jut
        const padX = left + 104 * SC * sc, puk = w.querySelector('.puk'), bel = w.querySelector('.bel'), pling = w.querySelector('.pling');
        const klapper = h => {
            const p = person(pick(KLEUR), h), sv = p.firstElementChild;
            sv.querySelector('.armB').remove();
            sv.insertAdjacentHTML('beforeend', `<g class="hamer" style="transform-box:view-box;transform-origin:13px 14px"><path d="M13 14 l0 7" stroke="${sv.querySelector('path:nth-of-type(4)') ? '#555' : '#555'}" stroke-width="2.6" stroke-linecap="round" opacity="0"/><path d="M13 14 v18" stroke="#a0703c" stroke-width="1.6" stroke-linecap="round"/><rect x="9.6" y="31" width="6.8" height="4.6" rx=".8" fill="#6b4a2b"/><circle cx="13" cy="19" r="1.4" fill="#e0b090"/></g>`);
            return p;
        };
        const klappers = [];
        later(() => { [23.5, 21.5].forEach((h, i) => { const p = klapper(h); strip.appendChild(p);
            const xs = padX - 14.4 * h / 24 - (i ? 22 : 0), x0 = W() + 30 + i * 30, y = GROUND - h;
            p.style.transform = `translate(${x0}px, ${y}px) scaleX(-1)`; const b = bob(p, 430);
            animate(p, [{ transform: `translate(${x0}px, ${y}px) scaleX(-1)` }, { transform: `translate(${xs}px, ${y}px) scaleX(-1)` }], { duration: Math.abs(xs - x0) * 9, easing: 'linear' })
                .finished.then(() => { b.pause(); p.style.transform = `translate(${xs}px, ${y}px) scaleX(1)`; animate(p, [{ transform: `translate(${xs}px, ${y}px) scaleX(1)` }], { duration: 1, fill: 'forwards' }); }).catch(() => {});
            klappers.push({ p, b, xs, y, h }); }); }, 2600);
        const sla = (k, kracht) => {
            const ham = k.p.querySelector('.hamer');
            animate(ham, [{ transform: 'rotate(-30deg)', easing: 'ease-in-out' }, { transform: 'rotate(200deg)', offset: .5, easing: 'cubic-bezier(.5,0,1,1)' },
                { transform: 'rotate(330deg)', offset: .66 }, { transform: 'rotate(330deg)', offset: .85 }, { transform: 'rotate(330deg)' }], { duration: 1400 });
            animate(k.p.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(0)', offset: .6 }, { transform: 'translateY(1.5px)', offset: .68 }, { transform: 'translateY(0)' }], { duration: 1400 });
            later(() => {                                   // klap: het gewicht schiet omhoog
                const top = 72 * kracht;
                animate(puk, [{ transform: 'translateY(0)', easing: 'cubic-bezier(.1,.7,.3,1)' }, { transform: `translateY(-${top}px)`, offset: .45, easing: 'cubic-bezier(.6,0,.9,.5)' }, { transform: 'translateY(0)' }], { duration: 1500 });
                if (kracht >= 1) later(() => {               // raak: de bel rinkelt, licht op en er spatten stralen uit
                    animate(bel, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(18deg)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(9deg)' }, { transform: 'rotate(0deg)' }], { duration: 700 });
                    const klok = bel.querySelector('path');
                    animate(klok, [{ fill: '#E0B23A' }, { fill: '#FFF1A8', offset: .15 }, { fill: '#D64541', offset: .4 }, { fill: '#FFF1A8', offset: .65 }, { fill: '#E0B23A' }], { duration: 900 });
                    animate(pling, [{ opacity: 1, transform: 'scale(.4)' }, { opacity: 0, transform: 'scale(2.2)' }], { duration: 700, easing: 'ease-out' });
                    animate(w.querySelector('.stralen'), [{ opacity: 0, transform: 'scale(.3) rotate(0deg)' }, { opacity: 1, transform: 'scale(1) rotate(10deg)', offset: .3 }, { opacity: 0, transform: 'scale(1.5) rotate(25deg)' }], { duration: 800, easing: 'ease-out' });
                }, 640);
            }, 924);
        };
        let beurt = 0;
        const rondje = () => { if (klappers.length === 2 && performance.now() < eind) { const k = klappers[beurt % 2];
            if (beurt % 2 === 0 || true) { // wie aan de beurt is stapt naar voren
                const v = klappers[(beurt + 1) % 2];
                animate(k.p, [{ transform: `translate(${padX - 14.4 * k.h / 24}px, ${k.y}px) scaleX(1)` }], { duration: 300, fill: 'forwards' });
                animate(v.p, [{ transform: `translate(${padX - 14.4 * v.h / 24 - 22}px, ${v.y}px) scaleX(1)` }], { duration: 300, fill: 'forwards' });
            }
            later(() => sla(k, chance(.45) ? 1 : rand(.45, .9)), 400); beurt++; } if (performance.now() < eind) later(rondje, 3400); };
        const eind = performance.now() + stay - 6000;
        later(rondje, 9000);
        later(() => { klappers.forEach(k => { k.b.play(); const x2 = W() + 40;
            animate(k.p, [{ transform: `translate(${padX - 14.4 * k.h / 24 - 10}px, ${k.y}px) scaleX(1)` }, { transform: `translate(${x2}px, ${k.y}px) scaleX(1)` }], { duration: Math.abs(x2 - padX) * 12, easing: 'linear' }).finished.then(() => { k.b.cancel(); k.p.remove(); }).catch(() => k.p.remove()); }); }, stay - 3500);
        later(() => { kijkers.forEach(k => { k.b.play(); const x2 = chance(.5) ? -60 : W() + 40;
            animate(k.p, [{ transform: `translate(${k.x1}px, ${k.y}px) scaleX(${x2 > k.x1 ? 1 : -1})` }, { transform: `translate(${x2}px, ${k.y}px) scaleX(${x2 > k.x1 ? 1 : -1})` }], { duration: Math.abs(x2 - k.x1) * 14, easing: 'linear' }).finished.then(() => { k.b.cancel(); k.p.remove(); }).catch(() => k.p.remove()); }); }, stay - 3000);
        later(() => { spin.pause(); animate(w, [{ transform: `scale(${sc})` }, { transform: `scale(${sc}) scaleY(0)` }], { duration: 1800, easing: 'ease-in' }).finished.then(() => w.remove()).catch(() => w.remove()); }, stay);
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
        const hoog = animate(bal, [{ transform: 'translateY(0) rotate(0deg)', easing: 'cubic-bezier(.2,.7,.4,1)' },
            { transform: 'translateY(-11px) rotate(180deg)', offset: .5, easing: 'cubic-bezier(.6,0,.8,.3)' },
            { transform: 'translateY(0) rotate(360deg)' }], { duration: T, iterations: Infinity });
        // hoofd en lijf geven een tikje mee op het moment dat de bal landt
        animate(w.firstElementChild, [{ transform: 'translateY(-1.6px)' }, { transform: 'translateY(0)', offset: .18 },
            { transform: 'translateY(0.6px)', offset: .8 }, { transform: 'translateY(-1.6px)' }], { duration: T, iterations: Infinity, easing: 'ease-in-out' });
        overDeLetters(w, bal, hoog, f, dur / Math.abs(x1 - x0), T);
    }
    // Kunststukje: als de voetballer onder de naam doorloopt, kopt hij de bal extra hoog. De bal landt op de letters
    // van "Ankeveen", rolt over de bovenkanten van de letters mee, valt er aan het eind af en de voetballer vangt
    // hem weer op zijn hoofd en loopt koppend door.
    function overDeLetters(w, bal, hoog, f, speed, T) {
        const logo = balk.querySelector('a'), tekst = logo && [...logo.childNodes].find(n => n.nodeType === 3 && n.textContent.includes('Ankeveen'));
        if (!tekst) return;
        const B = () => balk.getBoundingClientRect();
        const punten = () => {                                                 // bovenkant van elke letter (in kopbalk-coördinaten)
            const b = B(), i0 = tekst.textContent.indexOf('Ankeveen'), uit = [];
            for (let i = 0; i < 8; i++) {
                const r = document.createRange(); r.setStart(tekst, i0 + i); r.setEnd(tekst, i0 + i + 1);
                const q = r.getBoundingClientRect(), ch = tekst.textContent[i0 + i];
                if (!q.width) return null;
                uit.push({ x: q.left + q.width / 2 - b.left, y: q.top + q.height * (/[Akl]/.test(ch) ? .2 : .4) - b.top - 3.6 });
            }
            return f > 0 ? uit : uit.reverse();
        };
        const TD = 650;                                                        // van de laatste letter af terug naar het hoofd
        let klaar = false;
        const kijk = setInterval(() => {
            if (!w.isConnected) { clearInterval(kijk); return; }
            if (klaar || document.hidden) return;
            const pts = punten(); if (!pts) { clearInterval(kijk); return; }
            const b = B(), r = w.getBoundingClientRect(), hx = r.left + r.width / 2 - b.left;
            if (hx < 0 || hx > b.width) return;
            const wacht = T - (hoog.currentTime % T), straks = hx + f * wacht / speed;   // wachten tot de bal weer op zijn hoofd is
            const nog = f * (pts[0].x - straks);                                    // afstand tot de eerste letter bij het koppen
            if (nog > 2000 / speed) return;
            if (nog < 750 / speed) { clearInterval(kijk); return; }             // al te dichtbij of voorbij: deze keer niet
            klaar = true; clearInterval(kijk);
            later(() => {
                const b2 = B(), r2 = w.getBoundingClientRect(), x0 = r2.left + r2.width / 2 - b2.left, y0 = r2.top - b2.top - 3.3, p = punten();
                if (!p) return;
                hoog.pause(); bal.style.opacity = 0;
                const vb = document.createElement('div');
                vb.style.cssText = 'position:absolute;left:0;top:0;width:6.6px;height:6.6px;will-change:transform';
                vb.innerHTML = bal.innerHTML; lucht.appendChild(vb);
                const pos = (x, y, rot) => `translate(${x - 3.3}px, ${y - 3.3}px) rotate(${rot}deg)`;
                // 1. hoog de lucht in en op de eerste letter
                const TF = Math.abs(p[0].x - x0) * speed;                    // zo lang dat hij precies onder de eerste letter is als de bal landt
                const top = Math.max(14, Math.min(y0, p[0].y) - 34), fr = [];
                for (let i = 0; i <= 14; i++) {
                    const t = i / 14, x = x0 + (p[0].x - x0) * t;
                    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (2 * top - (y0 + p[0].y) / 2) + t * t * p[0].y;
                    fr.push({ transform: pos(x, y, f * 300 * t) });
                }
                // 2. van letter naar letter stuiteren, in het tempo van de voetballer (rustig draaiend)
                const span = Math.abs(p[p.length - 1].x - p[0].x), TR = span * speed, rol = [];
                let draai = f * 300;
                for (let i = 0; i < p.length - 1; i++) {
                    const a = p[i], z = p[i + 1], hop = 7 + Math.abs(z.y - a.y) * .5;
                    for (let k = i ? 1 : 0; k <= 8; k++) {
                        const t = k / 8, x = a.x + (z.x - a.x) * t, y = a.y + (z.y - a.y) * t - hop * 4 * t * (1 - t);
                        rol.push({ transform: pos(x, y, draai + f * 40 * t), offset: Math.abs(x - p[0].x) / span });
                    }
                    draai += f * 40;
                }
                // 3. eraf en terug op het hoofd
                const last = p[p.length - 1], xl = last.x + f * TD / speed, af = [];
                for (let i = 0; i <= 10; i++) { const t = i / 10, x = last.x + (xl - last.x) * t, y = last.y + (y0 - last.y) * t * t - 6 * Math.sin(Math.PI * t); af.push({ transform: pos(x, y, draai + f * 60 * t) }); }
                animate(vb, fr, { duration: TF, easing: 'linear' }).finished.then(() =>
                    animate(vb, rol, { duration: TR, easing: 'linear' }).finished).then(() =>
                    animate(vb, af, { duration: TD, easing: 'linear' }).finished).then(() => {
                        vb.remove(); bal.style.opacity = 1; hoog.currentTime = 0; hoog.play();
                    }).catch(() => { vb.remove(); bal.style.opacity = 1; hoog.play(); });
            }, wacht);
        }, 60);
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
    function baasMetHond(o = {}) {
        const h = o.h || rand(21, 24.5), w = document.createElement('div'); w.className = 'om-p';
        w.style.width = '34px'; w.style.height = h + 'px';
        const pers = person(pick(KLEUR), h); pers.style.position = 'absolute'; pers.style.left = '0'; pers.style.top = '0';
        const vacht = o.vacht || pick(VACHT), vlek = o.vlek || pick(VACHT), klein = chance(.5), dw = o.dw || (klein ? 12 : 15), dh = dw * .65;
        const licht = vacht === '#f4efe6' || vacht === '#d9b36a';                // lichte vacht krijgt een randje
        const rand_ = licht ? 'stroke="#8a7560" stroke-width=".6"' : '', poot = licht ? '#c9bca8' : vacht;
        const dog = document.createElement('div');
        dog.style.cssText = `position:absolute;left:${33 - dw}px;top:${h - dh}px;width:${dw}px;height:${dh}px`;
        dog.innerHTML = `<svg viewBox="0 0 20 13" width="${dw}" height="${dh}" aria-hidden="true" style="overflow:visible">
            <path class="tail" d="M3.2 5.5 q-2.6 -1.4 -2.6 -4.4" fill="none" stroke="${poot}" stroke-width="1.5" stroke-linecap="round"/>
            <ellipse cx="9" cy="6.6" rx="6.2" ry="3.2" fill="${vacht}" ${rand_}/>
            <ellipse cx="7" cy="6" rx="2.2" ry="1.6" fill="${vlek}" opacity=".7"/>
            <path class="achterpoot" d="M4.6 8.5 v4.3" stroke="${poot}" stroke-width="1.5" stroke-linecap="round" style="transform-box:view-box;transform-origin:4.6px 8.5px"/>
            <path d="M7 8.8 v4 M11.4 8.8 v4 M13.6 8.5 v4.3" stroke="${poot}" stroke-width="1.5" stroke-linecap="round"/>
            <path class="plas" d="M3.4 9.4 q-2.6 .2 -4.6 3.4" fill="none" stroke="#e8c840" stroke-width=".7" stroke-linecap="round" stroke-dasharray="7" stroke-dashoffset="7" opacity="0"/>
            <ellipse class="plasje" cx="-1.6" cy="12.9" rx="1.8" ry=".45" fill="#e8c840" opacity="0" style="transform-box:fill-box;transform-origin:50% 50%"/>
            <ellipse cx="18.4" cy="4.9" rx="1.6" ry="1.1" fill="${vacht}" ${rand_}/><circle cx="15.6" cy="4" r="2.9" fill="${vacht}" ${rand_}/><ellipse cx="18.2" cy="4.9" rx="1.3" ry=".8" fill="${vacht}"/>
            <circle cx="19.6" cy="4.6" r=".6" fill="#16233a"/><circle cx="16.4" cy="3.4" r=".45" fill="#16233a"/>
            <path d="M14.2 1.8 q-1.4 0.6 -1 3.2 q1 -0.6 1.8 -2.4 z" fill="${vlek}"/>
            <path d="M13.2 5.6 l2.4 1.2" stroke="#D64541" stroke-width=".9"/></svg>`;
        const lijn = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        lijn.setAttribute('width', 34); lijn.setAttribute('height', h); lijn.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
        const hx = 10.4, hy = h * .37, cx = 33 - dw + dw * .7, cy = h - dh + dh * .45;
        lijn.innerHTML = `<path d="M${hx} ${hy} Q${(hx + cx) / 2} ${Math.max(hy, cy) + 3} ${cx} ${cy}" fill="none" stroke="#3d4a5c" stroke-width=".8"/>`;
        w.append(pers, lijn, dog);
        pers._bob = bob(pers, rand(380, 460));
        const trot = animate(dog.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-1.2px)' }], { duration: rand(150, 190), direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        const tail = dog.querySelector('.tail'); tail.style.transformBox = 'fill-box'; tail.style.transformOrigin = '100% 100%';
        const wag = animate(tail, [{ transform: 'rotate(-14deg)' }, { transform: 'rotate(14deg)' }], { duration: 260, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        lijn.style.transformOrigin = `${hx}px 0`;
        return { w, h, pers, dog, dw, lijn, lijnLen: cx - hx, trot, wag, b: pers.getAnimations()[0], bob: pers._bob };
    }
    function honden(test) {                           // test: { kant: 1 of -1 } laat één hondje bij de paal plassen
        if (document.hidden) return;
        const width = W(), speed = rand(17, 21), samen = test ? false : chance(.5);
        const meet = vrij(.25, .75);
        const kanten = samen ? [1, -1] : [test && test.kant ? test.kant : pick([1, -1])];
        const lopers = kanten.map(f => {
            const b = baasMetHond(); strip.appendChild(b.w);
            const y = GROUND - b.h, x0 = f > 0 ? -50 : width + 16;
            const xm = f > 0 ? meet - 31 : meet - 3;                  // hondenneuzen raken elkaar bij 'meet'
            const xEnd = f > 0 ? width + 30 : -70;
            return Object.assign(b, { f, y, x0, xm, xEnd });
        });
        const lopen = (l, a, z) => animate(l.w, [{ transform: `translate(${a}px, ${l.y}px) scaleX(${l.f})` }, { transform: `translate(${z}px, ${l.y}px) scaleX(${l.f})` }],
            { duration: Math.abs(z - a) * speed, easing: 'linear' });
        if (!samen) {
            const l = lopers[0];
            // bij de ooievaarspaal stopt het hondje bijna altijd om te snuffelen; een deel zet daarna nog een stapje,
            // tilt een achterpootje op en plast tegen de paal
            const pk = nestX(), voor = l.dw * .98, achter = .23 * l.dw;               // neus en achterkant in de hondenbox
            const xNeus = l.f > 0 ? pk - 1.2 - (33 - l.dw) - voor : pk + 1.2 - 34 + (33 - l.dw) + voor;
            const xs = l.f > 0 ? pk + 2.2 - (33 - l.dw) - achter : pk - 2.2 - 34 + (33 - l.dw) + achter;
            if ((test || chance(.85)) && pk > 10 && pk < width - 10) {
                const svg = l.dog.firstElementChild, door = () => {
                    l.bob && l.bob.play(); l.trot.play(); l.wag.updatePlaybackRate(1);
                    lopen(l, l.w._x, l.xEnd).finished.then(() => l.w.remove()).catch(() => l.w.remove());
                };
                lopen(l, l.x0, xNeus).finished.then(() => {
                    l.w._x = xNeus;
                    l.bob && l.bob.pause(); l.trot.pause(); l.wag.updatePlaybackRate(1.8);
                    svg.style.transformOrigin = '30% 100%';
                    const snuf = animate(svg, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(9deg) translateX(0.6px)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(10deg) translateX(0.8px)' }, { transform: 'rotate(0deg)' }],
                        { duration: 800, iterations: 3, easing: 'ease-in-out' });
                    const plast = test ? test.plas !== false : chance(.6);
                    later(() => {
                        snuf.cancel();
                        if (!plast) { door(); return; }
                        // nog een stapje, zodat de achterkant bij de paal is
                        l.trot.play(); l.bob && l.bob.play();
                        animate(l.w, [{ transform: `translate(${xNeus}px, ${l.y}px) scaleX(${l.f})` }, { transform: `translate(${xs}px, ${l.y}px) scaleX(${l.f})` }], { duration: Math.abs(xs - xNeus) * speed * 1.4, easing: 'ease-in-out' })
                            .finished.then(() => {
                                l.w._x = xs;
                                l.bob && l.bob.pause(); l.trot.pause(); l.wag.updatePlaybackRate(.5);
                                const poot = svg.querySelector('.achterpoot'), straal = svg.querySelector('.plas'), plasje = svg.querySelector('.plasje');
                                animate(poot, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(72deg)' }], { duration: 350, delay: 300, easing: 'ease-out' });
                                animate(straal, [{ opacity: 0, strokeDashoffset: 7 }, { opacity: .95, strokeDashoffset: 0, offset: .15 }, { opacity: .95, strokeDashoffset: 0, offset: .85 }, { opacity: 0, strokeDashoffset: 0 }], { duration: 2200, delay: 700 });
                                animate(plasje, [{ opacity: 0, transform: 'scaleX(.2)' }, { opacity: .8, transform: 'scaleX(1)', offset: .8 }, { opacity: .7, transform: 'scaleX(1.1)' }], { duration: 2200, delay: 1000 });
                                later(() => animate(poot, [{ transform: 'rotate(72deg)' }, { transform: 'rotate(0deg)' }], { duration: 250 }), 3000);
                                later(door, 3400);
                            }).catch(() => {});
                    }, 2400);
                }).catch(() => l.w.remove());
                return;
            }
            lopen(l, l.x0, l.xEnd).finished.then(() => l.w.remove()).catch(() => l.w.remove()); return;
        }
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
            // soms lopen ze daarna langs elkaar heen om aan elkaars achterwerk te snuffelen (zoals honden doen)
            const kont = chance(.5);
            // precies zover langs elkaar dat ieders neus bij de staartaanzet van de ander komt (neus ≈ voorkant, staartaanzet ≈ 16% van achteren)
            const [rl, rr] = lopers.map(l => l.dog.getBoundingClientRect());
            const neusL = rl.right, kontL = rl.left + rl.width * .16, neusR = rr.left, kontR = rr.right - rr.width * .16;
            const d = Math.max(2, ((kontR - neusL) + (neusR - kontL)) / 4);
            if (kont) later(() => lopers.forEach((l, i) => {
                l.sniff.cancel(); l.trot.play();
                const sch = (l.lijnLen + d) / l.lijnLen;
                // de achterste hond (eerst getekend) staat een fractie hoger, zodat je beide hondjes ziet
                animate(l.dog, [{ transform: 'translate(0, 0)' }, { transform: `translate(${d}px, ${i ? .3 : -1.6}px)` }], { duration: 700, easing: 'ease-in-out' });
                animate(l.lijn, [{ transform: 'scaleX(1)' }, { transform: `scaleX(${sch})` }], { duration: 700, easing: 'ease-in-out' });
                later(() => {
                    l.trot.pause(); l.wag.updatePlaybackRate(3);
                    l.sniff = animate(l.dog.firstElementChild, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(9deg) translateX(0.6px)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(10deg) translateX(0.8px)' }, { transform: 'rotate(0deg)' }],
                        { duration: 800, iterations: Infinity, delay: i * 200, easing: 'ease-in-out' });
                }, 720);
            }), 1700);
            const top = GROUND - Math.max(...lopers.map(l => l.h)) - 16;
            const bb = bubble(meet - 18, top, lopers[0].pers.querySelector('path:nth-of-type(2)') ? '#3d4a5c' : '#3d4a5c');
            const chat = { x: meet - 10, top, bb }; chatting.push(chat);
            setTimeout(() => {
                chatting.splice(chatting.indexOf(chat), 1);
                animate(bb, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).finished.then(() => bb.remove()).catch(() => bb.remove());
                lopers.forEach(l => {
                    l.sniff.cancel(); l.wag.updatePlaybackRate(1); l.b && l.b.play(); l.trot.play();
                    if (kont) { animate(l.dog, [{ transform: getComputedStyle(l.dog).transform }, { transform: 'translate(0, 0)' }], { duration: 500, easing: 'ease-in-out' });
                        animate(l.lijn, [{ transform: getComputedStyle(l.lijn).transform }, { transform: 'scaleX(1)' }], { duration: 500, easing: 'ease-in-out' }); }
                    lopen(l, l.xm, l.xEnd).finished.then(() => l.w.remove()).catch(() => l.w.remove());
                });
            }, kont ? rand(5500, 7000) : rand(4000, 6500));
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

    // Lichtjesmarkt: de kopbalk wordt nacht (donkerblauw, maan en sterren), de Snoek rijdt voorbij met de koplampen aan
    // en zodra hij voorbij is knipt de lichtjesmarkt aan: kraampjes met knipperende lampjes en heel veel mensen met
    // wintermutsen en sjaals die rond de kraampjes staan te wiebelen. Dan: ploep, licht uit. Even donker, en weer dag.
    let nacht = null;
    function maakNacht() {
        if (nacht) return nacht;
        const st = document.createElement('style');
        st.textContent = `#topbar a,#topbar .top-menu-btn{transition:color 2.4s}
            #topbar.nacht > div > a:not(.top-cta),#topbar.nacht .top-links a:not(.top-cta),#topbar.nacht .top-menu-btn{color:#dfe6f3 !important}
            .om-lamp{position:absolute;width:3px;height:3px;border-radius:50%;margin:-1.5px 0 0 -1.5px}`;
        document.head.appendChild(st);
        const lucht0 = document.createElement('div');
        lucht0.style.cssText = 'position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:0;background:linear-gradient(#0a1430,#16285a 70%,#1d3266)';
        lucht0.setAttribute('aria-hidden', 'true');
        let sterren = '';
        for (let i = 0; i < 26; i++) sterren += `<div style="position:absolute;left:${rand(2, 98)}%;top:${rand(4, 55)}%;width:${chance(.3) ? 2 : 1.3}px;height:${chance(.3) ? 2 : 1.3}px;border-radius:50%;background:#fff;opacity:${rand(.4, .9)}" class="ster"></div>`;
        lucht0.innerHTML = sterren + `<div class="maan" style="position:absolute;left:42%;top:7px;width:22px;height:22px;border-radius:50%;background:#f4f1dc;box-shadow:0 0 14px 4px rgba(244,241,220,.35)">
            <div style="position:absolute;left:5px;top:5px;width:5px;height:5px;border-radius:50%;background:#e2dcc0"></div><div style="position:absolute;left:12px;top:12px;width:4px;height:4px;border-radius:50%;background:#e2dcc0"></div></div>`;
        balk.appendChild(lucht0);
        nacht = lucht0; return nacht;
    }
    const MUTS = ['#C0392B', '#1F6E43', '#2B4C8C', '#E67E22', '#6B3FA0', '#ECECEC', '#16A085', '#8E2B4F'];
    function wintermens(h) {
        const p = person(pick(['#2f3e55', '#5a3a2a', '#3b3b3b', '#7a1f2b', '#1f4e79', '#4a5d3a', '#6b6b6b']), h), svg = p.firstElementChild;
        const m = pick(MUTS), m2 = pick(MUTS), sj = pick(MUTS);
        svg.insertAdjacentHTML('beforeend', `<path d="M5 10.4 q4 2.2 8 0 l.4 2.2 q-4.4 2.4 -8.8 0 z" fill="${sj}"/><path d="M6 12 l-1.2 5.4 h2.2 l.8 -5 z" fill="${sj}"/>
            <path d="M4.1 5 q0 -5.6 4.9 -5.6 q4.9 0 4.9 5.6 z" fill="${m}"/><path d="M3.9 3.8 h10.2 v1.8 h-10.2 z" fill="${m2}"/><circle cx="9" cy="-1" r="1.6" fill="${m2}"/>`);
        delete p.dataset.groet;
        return p;
    }
    const LAMPKLEUR = ['#ff5a4f', '#49e06b', '#4fb3ff', '#ffb02e', '#ffffff', '#c77dff'];
    function kraampje(kleur) {
        const k = document.createElement('div');
        k.style.cssText = 'position:absolute;left:0;top:0;width:36px;height:32px;pointer-events:none';
        const waren = [...Array(5)].map((_, i) => `<circle cx="${8 + i * 5}" cy="${20.6 - (i % 2)}" r="1.6" fill="${pick(['#c0392b', '#e67e22', '#27ae60', '#8e5a2b', '#f4efe6', '#2b4c8c'])}"/>`).join('');
        k.innerHTML = `<div class="gloed" style="position:absolute;left:-14px;top:-6px;width:64px;height:44px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,196,110,.42),rgba(255,196,110,0));opacity:0"></div>
          <svg viewBox="0 0 36 32" width="36" height="32" aria-hidden="true" style="position:absolute;left:0;top:0;overflow:visible">
            <path d="M4 8 v24 M32 8 v24" stroke="#4a3322" stroke-width="1.6"/>
            <path d="M1 9 L18 2 L35 9 Z" fill="${kleur}"/><path d="M6.6 6.7 L18 2 L12 9 Z M24 9 L18 2 L29.4 6.7 Z" fill="#f4efe6" opacity=".9"/>
            <path d="M1 9 h34 v2.4 q-2.1 2 -4.25 0 q-2.1 2 -4.25 0 q-2.1 2 -4.25 0 q-2.1 2 -4.25 0 q-2.1 2 -4.25 0 q-2.1 2 -4.25 0 q-2.1 2 -4.25 0 q-2.1 2 -4.25 0 z" fill="${kleur}"/>
            ${waren}<path d="M3 22 h30 v4 h-30 z" fill="#8b5a2b"/><path d="M3 22 h30" stroke="#a87444" stroke-width=".8"/>
            <path d="M1.4 12.2 q8.4 3.6 16.6 0 q8.4 3.6 16.6 0" fill="none" stroke="#222" stroke-width=".4"/></svg>`;
        // lampjes langs het snoer onder het dakje
        const lampjes = [];
        for (let i = 0; i < 9; i++) {
            const t = i / 8, x = 1.4 + t * 33.2, tt = (t < .5 ? t * 2 : (t - .5) * 2), y = 12.2 + 3.6 * 4 * tt * (1 - tt) * .5;
            const l = document.createElement('div'); l.className = 'om-lamp';
            const c = LAMPKLEUR[(i + Math.floor(rand(0, 6))) % LAMPKLEUR.length];
            l.style.left = x + 'px'; l.style.top = y + 'px'; l.style.background = c; l.style.boxShadow = `0 0 4px 1.5px ${c}`; l.style.opacity = 0;
            k.appendChild(l); lampjes.push(l);
        }
        return { k, lampjes, gloed: k.querySelector('.gloed') };
    }
    function lichtjesmarkt() {
        if (document.hidden) return;
        const lucht0 = maakNacht(), width = W();
        marktTot = performance.now() + lichtjesDur();                         // zolang de markt duurt komt er verder niemand langs
        // de maan in de vrije ruimte tussen de naam en het menu (op een telefoon: net links van de menuknop)
        {
            const br = balk.getBoundingClientRect(), lr = balk.querySelector('a').getBoundingClientRect();
            const menu = [...balk.querySelectorAll('.top-links, #topMenuBtn')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.left > lr.right);
            const rechts = menu.length ? Math.min(...menu.map(r => r.left)) : br.right - 10, maan = lucht0.querySelector('.maan');
            const gat = rechts - lr.right;
            maan.style.left = (gat > 40 ? lr.right + gat / 2 - 11 : rechts - 30) - br.left + 'px';
            maan.style.top = (gat > 40 ? 7 : 4) + 'px';
        }
        const N = Math.max(2, Math.min(6, Math.floor(width * .5 / 50))), gap = 50, breedte = N * gap;
        const cx = plek(breedte + 40, .25, .75, lichtjesDur());
        const elementen = [], anims = [];
        // 1. nacht valt
        balk.classList.add('nacht');
        animate(lucht0, [{ opacity: 0 }, { opacity: 1 }], { duration: 2600, easing: 'ease-in-out' });
        lucht0.querySelectorAll('.ster').forEach(s => anims.push(animate(s, [{ opacity: .2 }, { opacity: 1 }], { duration: rand(700, 1800), direction: 'alternate', iterations: Infinity, delay: rand(0, 1500) })));
        // de kraampjes staan er al, maar je ziet ze nog nauwelijks in het donker
        const kramen = [];
        for (let i = 0; i < N; i++) {
            const kr = kraampje(['#B03A2E', '#1F6E43', '#2B4C8C', '#6B3FA0'][i % 4]);
            const x = cx - breedte / 2 + i * gap + (gap - 36) / 2;
            kr.k.style.transform = `translate(${x}px, ${GROUND - 32}px)`; kr.k.style.opacity = 0; kr.k.style.zIndex = 1;
            strip.appendChild(kr.k); elementen.push(kr.k); kramen.push(kr);
            animate(kr.k, [{ opacity: 0 }, { opacity: .28 }], { duration: 2000, delay: 1200 });
        }
        // heel veel mensen met mutsen en sjaals rond de kraampjes (staan klaar in het donker)
        const mensen = [];
        kramen.forEach((kr, i) => {
            const x0 = cx - breedte / 2 + i * gap + (gap - 36) / 2;
            const n = Math.round(rand(4, 7));
            for (let j = 0; j < n; j++) {
                const diep = chance(.45), sc = diep ? .9 : 1, h = rand(21, 25) * sc, p = wintermens(h);
                const x = x0 + rand(-8, 36) - h * .225, y = GROUND - h - (diep ? 3 : 0) + (diep ? 0 : rand(0, 1.5));
                p.style.transform = `translate(${x}px, ${y}px) scaleX(${chance(.5) ? 1 : -1})`; p.style.opacity = 0; p.style.zIndex = diep ? 1 : 2;
                strip.appendChild(p); elementen.push(p); mensen.push(p);
            }
        });
        // 2. de Snoek rijdt voorbij met de koplampen aan
        const fromLeft = chance(.5), f = fromLeft ? 1 : -1, wpx = 68, hpx = wpx * 96 / 307, cy = GROUND - hpx + .6, sp = 9;
        const auto = document.createElement('div'); auto.className = 'om-p'; auto.style.zIndex = 3;
        auto.style.width = wpx + 'px'; auto.style.height = hpx + 'px';
        auto.innerHTML = `<div style="position:absolute;left:${wpx - 3}px;top:${hpx * .3}px;width:90px;height:${hpx * .9}px;background:linear-gradient(to right,rgba(255,214,80,.75),rgba(255,214,80,0));clip-path:polygon(0 38%,100% 0,100% 100%,0 62%)"></div>
            <img src="${SNOEK}" alt="" width="${wpx}" height="${hpx.toFixed(1)}" style="display:block;position:relative">
            <div style="position:absolute;left:${wpx - 4.5}px;top:${hpx * .48}px;width:4px;height:3px;border-radius:50%;background:#ffe27a;box-shadow:0 0 6px 3px rgba(255,214,80,.8)"></div>
            <div style="position:absolute;left:-1px;top:${hpx * .45}px;width:3px;height:2.4px;border-radius:40%;background:#ff3b30;box-shadow:0 0 4px 1px rgba(255,59,48,.7)"></div>`;
        const ax0 = fromLeft ? -170 : width + 100, ax1 = fromLeft ? width + 100 : -170;
        const NACHT = 2800, rijd = Math.abs(ax1 - ax0) * sp;
        later(() => {
            strip.appendChild(auto);
            auto.style.transform = `translate(${ax0}px, ${cy}px) scaleX(${f})`;
            animate(auto, [{ transform: `translate(${ax0}px, ${cy}px) scaleX(${f})` }, { transform: `translate(${ax1}px, ${cy}px) scaleX(${f})` }], { duration: rijd, easing: 'linear' })
                .finished.then(() => auto.remove()).catch(() => auto.remove());
        }, NACHT);
        // 3. zodra hij voorbij is: lichtjesmarkt aan
        const voorbij = fromLeft ? (cx + breedte / 2 + 20 - ax0) * sp : (ax0 - (cx - breedte / 2 - 20) + wpx) * sp;
        const AAN = NACHT + voorbij, BRAND = rand(15000, 18000);
        later(() => {
            kramen.forEach(kr => {
                kr.k.getAnimations().forEach(a => a.cancel()); kr.k.style.opacity = 1; kr.gloed.style.opacity = 1;
                kr.lampjes.forEach(l => { l.style.opacity = 1; anims.push(animate(l, [{ opacity: 1 }, { opacity: .15 }], { duration: rand(300, 900), direction: 'alternate', iterations: Infinity, delay: rand(0, 900), easing: 'steps(2, jump-none)' })); });
            });
            mensen.forEach(p => {
                p.style.opacity = 1;
                p._wiebel = animate(p.firstElementChild, [{ transform: `rotate(${-rand(2, 4)}deg)` }, { transform: `rotate(${rand(2, 4)}deg)` }], { duration: rand(700, 1300), direction: 'alternate', iterations: Infinity, delay: rand(0, 800), easing: 'ease-in-out' });
                anims.push(p._wiebel);
            });
            // steeds komen er mensen bij die naar de markt lopen, en gaan er een paar weer naar huis
            const komt = () => {
                const h = rand(21, 25), p = wintermens(h), s = chance(.5) ? 1 : -1, xa = s > 0 ? -20 : width + 10;
                const xb = cx + rand(-breedte / 2, breedte / 2) - h * .225, y = GROUND - h;
                p.style.transform = `translate(${xa}px, ${y}px) scaleX(${s})`; p.style.zIndex = 2;
                strip.appendChild(p); elementen.push(p);
                const b = bob(p, rand(380, 460));
                animate(p, [{ transform: `translate(${xa}px, ${y}px) scaleX(${s})` }, { transform: `translate(${xb}px, ${y}px) scaleX(${s})` }], { duration: Math.abs(xb - xa) * 15, easing: 'linear' })
                    .finished.then(() => {
                        b.cancel(); mensen.push(p);
                        p._wiebel = animate(p.firstElementChild, [{ transform: `rotate(${-rand(2, 4)}deg)` }, { transform: `rotate(${rand(2, 4)}deg)` }], { duration: rand(700, 1300), direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
                        anims.push(p._wiebel);
                    }).catch(() => {});
            };
            const gaat = () => {
                const zicht = mensen.filter(p => p.style.opacity !== '0' && p.isConnected); if (zicht.length < 12) return;
                const p = pick(zicht); mensen.splice(mensen.indexOf(p), 1);
                const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(p.style.transform); if (!m) return;
                const x = +m[1], y = +m[2], s = x > width / 2 ? 1 : -1, xe = s > 0 ? width + 20 : -30;
                if (p._wiebel) p._wiebel.cancel();
                const b = bob(p, rand(380, 460));
                animate(p, [{ transform: `translate(${x}px, ${y + (p.style.zIndex === '1' ? 0 : 0)}px) scaleX(${s})` }, { transform: `translate(${xe}px, ${y}px) scaleX(${s})` }], { duration: Math.abs(xe - x) * 15, easing: 'linear' })
                    .finished.then(() => { b.cancel(); p.remove(); }).catch(() => {});
            };
            const stroom = () => { if (performance.now() > eindStroom) return; if (!document.hidden) (chance(.6) ? komt : gaat)(); later(stroom, rand(1100, 2400)); };
            const eindStroom = performance.now() + BRAND - 2500;
            later(stroom, 600);
        }, AAN);
        // 4. de markt loopt leeg: mensen gaan naar huis, de lampjes gaan een voor een uit, de kraampjes vervagen,
        //    en dan wordt het weer dag. Daarna komt de strook meteen weer op gang.
        later(() => {
            mensen.filter(p => p.isConnected && p.style.opacity !== '0').forEach(p => later(() => {
                const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(p.style.transform); if (!m || !p.isConnected) return;
                const x = +m[1], y = +m[2], s = x > cx ? 1 : -1, xe = x + s * rand(70, 130);
                if (p._wiebel) p._wiebel.cancel();
                const b = bob(p, rand(380, 460));
                animate(p, [{ transform: `translate(${x}px, ${y}px) scaleX(${s})`, opacity: 1 }, { transform: `translate(${xe}px, ${y}px) scaleX(${s})`, opacity: 0 }], { duration: Math.abs(xe - x) * 16, easing: 'linear' })
                    .finished.then(() => { b.cancel(); p.remove(); }).catch(() => {});
            }, rand(0, 3500)));
            kramen.forEach(kr => {
                kr.lampjes.forEach(l => later(() => { l.getAnimations().forEach(a => a.cancel()); animate(l, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 }); }, rand(2800, 5200)));
                later(() => animate(kr.gloed, [{ opacity: 1 }, { opacity: 0 }], { duration: 1200 }), 4200);
                later(() => animate(kr.k, [{ opacity: 1 }, { opacity: 0 }], { duration: 1500 }), 5600);
            });
            later(() => {
                balk.classList.remove('nacht');
                animate(lucht0, [{ opacity: 1 }, { opacity: 0 }], { duration: 2600, easing: 'ease-in-out' });
            }, 6200);
            later(() => {
                anims.forEach(a => a.cancel());
                elementen.forEach(e => e.remove());
                marktTot = grootTot = performance.now();                        // vrij baan: de volgende groep mag meteen
                meeting();
            }, 8000);
        }, AAN + BRAND);
    }
    const lichtjesDur = () => 2800 + (W() + 270) * 9 * .8 + 17000 + 8000;

    window.ontmoeten = { jazz, vogelaars, meeting, peloton, fanfare, naturists, carnaval, skaters, yogis, klasje, voetballer, footballers, hardloopsters, honden, oldtimer, oudje, markt, bakfiets, vaderFiets, moederFiets, kermis, havenloos };   // handig om te testen

    // Rustig tempo: gewone ontmoetingen om de 10 tot 16 seconden (hooguit twee tegelijk),
    // en de bijzondere groepen één voor één, met een pauze ertussen en nooit twee dezelfde achter elkaar.
    // Terwijl een grote groep (koor, zumba, markt, fanfare...) bezig is, komt er minder los verkeer langs.
    let grootTot = 0, marktTot = 0;
    const rustig = () => marktTot > performance.now() || (grootTot > performance.now() && chance(W() < 600 ? .85 : .6));
    meeting();
    const planMeeting = () => setTimeout(() => { if (!rustig()) { const r = Math.random(); if (r < .12) vaderFiets(); else if (r < .24) moederFiets(); else if (active < (grootTot > performance.now() ? 1 : 2)) meeting(); } planMeeting(); }, rand(10000, 16000));
    planMeeting();
    // af en toe een hondenuitlater (vaak twee die elkaar tegenkomen)
    const planHond = () => setTimeout(() => { if (!rustig()) honden(); planHond(); }, rand(22000, 38000));
    setTimeout(() => { if (!rustig()) honden(); planHond(); }, 9000);
    const specials = [
        { run: peloton, dur: () => (W() + 300 + EX) * 4.5 },
        { run: fanfare, dur: () => (W() + 200 + EX) * 24, groot: true },
        { run: skaters, dur: () => (W() + 200 + EX) * 7.5 },
        { run: naturists, dur: () => (W() + 160 + EX) * 26 + 13000, groot: true },
        { run: carnaval, dur: () => (W() + 260 + EX) * 22, groot: true },
        { run: yogis, dur: () => (W() + 200 + EX) * 40, groot: true },
        { run: klasje, dur: () => (W() + 220 + EX) * 22, groot: true },
        { run: voetballer, dur: () => (W() + 100) * 30 },
        { run: footballers, dur: () => (W() + 220 + EX) * 11 },
        { run: markt, dur: marktDur, groot: true },
        { run: bakfiets, dur: () => (W() + 100 + EX) * 16 + 12000, rare: true },
        { run: kermis, dur: () => 42000, rare: true },
        { run: hardloopsters, dur: () => (W() + 180 + EX) * 9 },
        { run: vogelaars, dur: vogelaarsDur },
        { run: jazz, dur: jazzDur, groot: true },
        { run: havenloos, dur: havenloosDur, groot: true },
        { run: gitaarschool, dur: () => (W() + 120 + EX) * 20 },
        { run: zumba, dur: zumbaDur, groot: true },
        { run: ruiter, dur: () => (W() + 140 + EX) * 30 },
        { run: boswachter, dur: () => (W() + 120 + EX) * 13 },
        { run: klompenman, dur: () => (W() + 160 + EX) * 13 },
        { run: familie, dur: () => (W() + 200 + EX) * 27 },
        { run: lichtjesmarkt, dur: lichtjesDur, groot: true, rare: true },
        { run: oldtimer, dur: () => (W() + 180) * 14 },
    ];
    // Alle bijzondere groepen komen om de beurt langs (geschud, geen herhaling voordat iedereen
    // geweest is), elkaar deels overlappend. De eerste komt al na een paar seconden.
    let bag = [], last = null;
    function nextSpecial() {
        if (document.hidden) { setTimeout(nextSpecial, 5000); return; }
        const nuM = performance.now();
        if (marktTot > nuM) { setTimeout(nextSpecial, 1500); return; }   // lichtjesmarkt: niemand anders, daarna meteen weer verder
        if (!bag.length) {
            bag = specials.slice().sort(() => Math.random() - 0.5);
            if (bag[0] === last && bag.length > 1) bag.push(bag.shift());
        }
        let s = bag.shift();
        if (s.rare && chance(.4) && bag.length) { bag.push(s); s = bag.shift(); }   // zeldzame gasten slaan meestal een rondje over
        // Niet te druk: nooit twee grote groepen tegelijk. Is er nog een grote bezig, dan komt eerst een kleine
        // groep (of, als die er niet meer zijn in deze ronde, wachten we tot de grote klaar is).
        const nu = performance.now();
        if (s.groot && grootTot > nu) {
            const i = bag.findIndex(x => !x.groot);
            if (i >= 0) { bag.unshift(s); s = bag.splice(i + 1, 1)[0]; }
            else { bag.unshift(s); setTimeout(nextSpecial, grootTot - nu + rand(1500, 4000)); return; }
        }
        last = s; s.run();
        const d = s.dur();
        if (s.groot) grootTot = nu + d;
        // de volgende groep komt als deze ruim halverwege is (mensen passeren elkaar gewoon);
        // op een smal scherm (telefoon) pas als deze bijna weg is
        const smal = W() < 600;
        setTimeout(nextSpecial, d * (smal ? .9 : s.groot ? .7 : .55) + rand(3000, 7000));
    }

    // Groeten in het voorbijgaan: als twee wandelaars of fietsers elkaar tegemoet komen, zwaait af en toe
    // een van beiden (en soms de ander terug). Een zwaai is de hand boven het hoofd die heen en weer gaat.
    function zwaai(el) {
        const svg = el.firstElementChild; if (!svg) return;
        const nu = performance.now(); if (nu - (+el.dataset.gezwaaid || 0) < 6000) return; el.dataset.gezwaaid = nu;   // niet steeds opnieuw
        if (el.dataset.groet === 'fiets') {
            const arm = svg.querySelector('.zwaaiarm'); if (!arm) return;
            arm.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-85deg)', offset: .2 }, { transform: 'rotate(-65deg)', offset: .4 },
                { transform: 'rotate(-85deg)', offset: .6 }, { transform: 'rotate(-65deg)', offset: .8 }, { transform: 'rotate(0deg)' }], { duration: 1400, easing: 'ease-in-out' });
            dik(arm, 1400);
        } else {
            const arm = svg.querySelector('.armA'); if (!arm) return;
            arm.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-170deg)', offset: .2 }, { transform: 'rotate(-195deg)', offset: .35 },
                { transform: 'rotate(-168deg)', offset: .5 }, { transform: 'rotate(-195deg)', offset: .65 }, { transform: 'rotate(-170deg)', offset: .8 }, { transform: 'rotate(0deg)' }], { duration: 1500, easing: 'ease-in-out' });
            dik(arm, 1500);
        }
    }
    function dik(arm, d) {   // zwaaiende arm tijdelijk dikker, zodat het groeten opvalt
        const w = parseFloat(arm.getAttribute('stroke-width')) || 2.4;
        arm.animate([{ strokeWidth: w + 'px' }, { strokeWidth: w * 1.6 + 'px', offset: .15 }, { strokeWidth: w * 1.6 + 'px', offset: .85 }, { strokeWidth: w + 'px' }], { duration: d });
    }
    function groeten(root) {
        let prev = new Map(); const gezien = new WeakMap();
        setInterval(() => {
            if (document.hidden) return;
            const now = [...root.querySelectorAll('[data-groet]')].map(el => { const r = el.getBoundingClientRect(); return { el, x: r.left + r.width / 2 }; });
            const mov = now.map(o => ({ ...o, v: prev.has(o.el) ? o.x - prev.get(o.el) : 0 })).filter(o => Math.abs(o.v) > 2);
            prev = new Map(now.map(o => [o.el, o.x]));
            for (let i = 0; i < mov.length; i++) for (let j = i + 1; j < mov.length; j++) {
                const a = mov[i], b = mov[j];
                if (a.v * b.v >= 0) continue;                                   // zelfde kant op: geen groet
                const gap = b.x - a.x;
                if (Math.abs(gap) > 90 || (a.v - b.v) * Math.sign(gap) <= 0) continue;   // te ver of al voorbij
                const sa = gezien.get(a.el) || new Set(); if (sa.has(b.el)) continue;
                sa.add(b.el); gezien.set(a.el, sa);
                if (chance(.45)) { const [x, y] = chance(.5) ? [a, b] : [b, a]; zwaai(x.el); if (chance(.7)) setTimeout(() => zwaai(y.el), 350); }
            }
        }, 450);
    }
    groeten(strip); if (window.ontmoeten) { window.ontmoeten.zwaai = zwaai; window.ontmoeten.havenloos = havenloos; window.ontmoeten.gitaarschool = gitaarschool; window.ontmoeten.zumba = zumba; window.ontmoeten.ruiter = ruiter; window.ontmoeten.boswachter = boswachter; window.ontmoeten.klompenman = klompenman; window.ontmoeten.familie = familie; window.ontmoeten.koffie = () => meeting(true); window.ontmoeten.lichtjesmarkt = lichtjesmarkt; window.ontmoeten.honden = honden; window.ontmoeten.plassen = () => honden({ kant: pick([1, -1]), plas: true }); window.ontmoeten.snuffelen = () => honden({ kant: pick([1, -1]), plas: false }); window.ontmoeten.voetballer = voetballer; window.ontmoeten.ooievaar = ooievaar; }
    // Een scène direct bekijken: zet de naam achter een # in het adres, bijvoorbeeld .../verenigingen-ankeveen/#havenloos
    const toon = () => {
        const n = decodeURIComponent(location.hash.slice(1)), fn = window.ontmoeten && window.ontmoeten[n];
        if (!n || typeof fn !== 'function' || n === 'zwaai') return;
        // een grote groep via de link telt ook mee, zodat er niet tegelijk nog een grote groep start
        const sp = specials.find(x => x.run === fn);
        setTimeout(() => { if (sp && sp.groot) grootTot = Math.max(grootTot, performance.now() + sp.dur()); fn(); }, 800);
    };
    toon(); window.addEventListener('hashchange', toon);
    setTimeout(nextSpecial, 4000);
})();
