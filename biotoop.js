/* ===========================================
   NATUURRIJK ANKEVEEN – biotoop.js
   De levende header: bloemen, vijver en dieren.

   Principes
   - Alle beweging via transform/opacity (Web Animations API): vloeiend, GPU-vriendelijk.
   - Paden zijn gebogen (bezier), dieren hebben een eigen 'bob' of 'flutter'.
   - Rustige choreografie: maximaal een paar dieren tegelijk, met pauzes.
   - Pauzeert als het tabblad onzichtbaar is; respecteert prefers-reduced-motion.
   - Scène kiezen per pagina: <script src="biotoop.js" data-scene="home"></script>
   =========================================== */
(function () {
    'use strict';

    // ---------- Instellingen ----------
    const script = document.currentScript;
    const SCENE = (script && script.dataset.scene) || 'home';
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const NARROW = () => innerWidth < 720;
    const IMG = 'images/';

    const NAV = 70;              // hoogte navigatie
    const GROUND = NAV + 15;     // graslijn (onderkant gras), y in px
    const RESET_AFTER = 8 * 60 * 1000;

    const SPRITES = {
        flowers: [
            { src: 'Klaproos.webp', h: [28, 40] }, { src: 'Klaprozen2.webp', h: [30, 42] },
            { src: 'Klaprozen.webp', h: [22, 32] }, { src: 'Digitalis.webp', h: [42, 56] },
            { src: 'Ridderspoor.webp', h: [42, 56] }, { src: 'Ridderspoor2.webp', h: [32, 44] },
            { src: 'Gelelis.webp', h: [30, 42], sink: 6 }, { src: 'Veldoeket.webp', h: [40, 54] },
            { src: 'Lisdodde2.webp', h: [30, 38] }
        ],
        swallows: [
            { src: 'Swallowflight.webp', faces: 1 },
            { src: 'Swallowflight2.webp', faces: -1 },
            { src: 'Swallowflight3.webp', faces: -1 }
        ]
    };

    // ---------- DOM ----------
    const L = {};
    ['bioPond', 'bioGround', 'bioGarden', 'bioSky'].forEach(id => { L[id] = document.getElementById(id); });
    if (!L.bioGarden || !L.bioSky) return;
    L.bioFront = document.createElement('div');
    L.bioFront.className = 'bio-front'; L.bioFront.setAttribute('aria-hidden', 'true');
    document.body.appendChild(L.bioFront);

    // ---------- Hulpjes ----------
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const chance = p => Math.random() < p;
    const W = () => innerWidth;
    const px = pct => W() * pct / 100;

    const running = new Set();
    let timers = [];
    let paused = false;
    let active = 0;               // aantal actieve 'gebeurtenissen' (dieren)
    const MAX_ACTIVE = () => NARROW() ? 2 : 3;

    function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
    function every(fn, ms) { const t = setInterval(fn, ms); timers.push(t); return t; }

    function sprite(layer, src, h, cls) {
        const img = document.createElement('img');
        img.src = IMG + src; img.alt = ''; img.draggable = false;
        img.className = 'bio-sprite ' + (cls || '');
        img.style.height = h + 'px';
        layer.appendChild(img);
        return img;
    }
    function wrap(layer, src, h) {
        const w = document.createElement('div'); w.className = 'bio-wrap';
        const img = document.createElement('img');
        img.src = IMG + src; img.alt = ''; img.draggable = false; img.style.height = h + 'px';
        w.appendChild(img); layer.appendChild(w);
        return { w, img };
    }
    function animate(el, frames, opts) {
        const a = el.animate(frames, Object.assign({ fill: 'forwards' }, opts));
        running.add(a);
        a.finished.then(() => running.delete(a)).catch(() => running.delete(a));
        if (paused) a.pause();
        return a;
    }
    function remove(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

    // Kwadratische/kubische bezier bemonsteren tot keyframes
    function cubic(p0, p1, p2, p3, t) {
        const u = 1 - t;
        return {
            x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
            y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
        };
    }
    // Pad-keyframes: pts = lijst {x,y}; flip = -1 spiegelt; tilt = draaien mee met de richting
    function pathFrames(pts, { flip = 1, tilt = 0, scale = 1, fadeIn = 0, fadeOut = 0 } = {}) {
        const n = pts.length;
        return pts.map((p, i) => {
            let rot = 0;
            if (tilt && i > 0) {
                const q = pts[i - 1];
                rot = Math.atan2(p.y - q.y, p.x - q.x) * 180 / Math.PI;
                if (flip < 0) rot = 180 - rot;              // gespiegeld: hoek omkeren
                rot = Math.max(-tilt, Math.min(tilt, rot)) * (flip < 0 ? -1 : 1);
            }
            const t = i / (n - 1);
            let op = 1;
            if (fadeIn && t < fadeIn) op = t / fadeIn;
            if (fadeOut && t > 1 - fadeOut) op = (1 - t) / fadeOut;
            return {
                transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scaleX(${flip * scale}) scaleY(${scale}) rotate(${rot.toFixed(1)}deg)`,
                opacity: op, offset: t
            };
        });
    }
    function sampleCurve(p0, p1, p2, p3, n = 40) {
        const out = [];
        for (let i = 0; i <= n; i++) out.push(cubic(p0, p1, p2, p3, i / n));
        return out;
    }

    // ---------- BLOEMEN ----------
    const flowers = [];
    // % van links; de zone rond de vijver blijft vrij (desktop: 25–42, mobiel: 66–84)
    const flowerSlots = () => currentScene.slots ? currentScene.slots : (NARROW() ? [4, 14, 26, 40, 54, 92] : [3, 9, 15, 21, 46, 54, 62, 70, 79, 88, 96]);
    function addFlower() {
        const max = NARROW() ? Math.ceil(currentScene.flowersMax / 2) : currentScene.flowersMax;
        if (flowers.length >= max) return;
        const used = flowers.map(f => f.slot);
        const free = flowerSlots().filter(s => !used.includes(s));
        if (!free.length) return;
        const slot = pick(free), data = pick(currentScene.flowers || SPRITES.flowers);
        const h = rand(data.h[0], data.h[1]);
        const img = sprite(L.bioGarden, data.src, h, 'bio-flower');
        const x = px(slot) - 20, y = GROUND - 3 + (data.sink || 0) - h;   // top van de bloem
        const pos = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)${chance(.5) ? ' scaleX(-1)' : ''}`;
        img.style.setProperty('--pos', pos);
        flowers.push({ el: img, slot });
        if (REDUCE) { img.style.transform = pos; return; }
        const a = animate(img, [
            { transform: pos + ' scale(.15)', opacity: 0 },
            { transform: pos + ' scale(1.06)', opacity: 1, offset: .7 },
            { transform: pos + ' scale(1)', opacity: 1 }
        ], { duration: 2600, easing: 'cubic-bezier(.2,.7,.3,1)' });
        a.finished.then(() => {
            a.cancel();
            img.style.transform = pos;
            img.style.setProperty('--sway-dur', rand(4, 7).toFixed(1) + 's');
            img.style.setProperty('--sway-delay', (-rand(0, 5)).toFixed(1) + 's');
            img.classList.add('sway');
        }).catch(() => {});
    }
    function wiltFlower() {
        if (flowers.length < 4) return;
        const f = flowers.splice(Math.floor(Math.random() * flowers.length), 1)[0];
        f.el.classList.remove('sway');
        const pos = f.el.style.getPropertyValue('--pos');
        animate(f.el, [{ transform: pos, opacity: 1 }, { transform: pos + ' scale(.6)', opacity: 0 }],
            { duration: 1800, easing: 'ease-in' }).finished.then(() => remove(f.el)).catch(() => {});
    }

    // ---------- VIJVER, RIET, ROERDOMP ----------
    const pond = { get x() { return NARROW() ? 75 : 33; }, el: null, reeds: [], roerdomp: null, flipTimer: null };
    function showPond() {
        if (pond.el) return;
        const h = 30;
        const img = sprite(L.bioPond, 'Poel1.webp', h, 'center');
        const x = px(pond.x) - 45, y = GROUND - 22;
        img.style.transform = `translate(${x}px, ${y}px)`;
        pond.el = img;
        animate(img, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCE ? 1 : 2500, easing: 'ease-out' });
        // Na een tijdje wordt de poel rijker (Poel3: lelies en oevergroen)
        later(() => {
            const big = sprite(L.bioPond, 'Poel3.webp', 40, 'center');
            big.style.transform = `translate(${px(pond.x) - 60}px, ${GROUND - 30}px)`;
            animate(big, [{ opacity: 0 }, { opacity: 1 }], { duration: 2500 });
            animate(img, [{ opacity: 1 }, { opacity: 0 }], { duration: 2500 }).finished.then(() => remove(img)).catch(() => {});
            pond.el = big;
        }, REDUCE ? 10 : 25000);
        // Riet rondom
        [[pond.x - 8, 'Lisdodde.webp', 64, 1, 500], [pond.x - 1.5, 'Lisdodde.webp', 48, -1, 1800], [pond.x + 7, 'Lisdodde3.webp', 50, -1, 2800]]
            .forEach(([pct, src, h, flip, delay]) => later(() => {
                const r = sprite(L.bioGarden, src, h, 'bio-flower');
                const pos = `translate(${px(pct) - 24}px, ${GROUND - 2 - h}px) scaleX(${flip})`;
                r.style.setProperty('--pos', pos);
                pond.reeds.push(r);
                if (REDUCE) { r.style.transform = pos; return; }
                animate(r, [{ transform: pos + ' scale(.2)', opacity: 0 }, { transform: pos + ' scale(1)', opacity: 1 }],
                    { duration: 2500, easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.then(a => {
                        r.style.transform = pos;
                        r.style.setProperty('--sway-dur', '6s'); r.style.setProperty('--sway-delay', (-rand(0, 4)).toFixed(1) + 's');
                        r.classList.add('sway');
                    }).catch(() => {});
            }, REDUCE ? 10 : delay));
    }
    function showRoerdomp() {
        if (pond.roerdomp || !pond.el) return;
        const h = 58;
        const box = document.createElement('div');
        box.className = 'bio-wrap bio-roerdomp';
        box.style.transform = `translate(${px(pond.x - 4.5)}px, ${GROUND - 4 - h}px)`;
        const a = document.createElement('img'), b = document.createElement('img');
        a.src = b.src = IMG + 'Roerdomp.webp'; a.alt = b.alt = ''; a.style.height = b.style.height = h + 'px';
        b.style.position = 'absolute'; b.style.top = 0; b.style.left = 0; b.style.transform = 'scaleX(-1)'; b.style.opacity = 0;
        box.append(a, b); L.bioGarden.appendChild(box);
        pond.roerdomp = box;
        animate(box, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCE ? 1 : 3000 });
        if (REDUCE) return;
        let flipped = false;
        const flip = () => { flipped = !flipped; a.style.opacity = flipped ? 0 : 1; b.style.opacity = flipped ? 1 : 0; };
        box.addEventListener('flip', flip);
        pond.flipTimer = every(() => { if (chance(.7)) flip(); }, 22000);
    }

    // ---------- DIEREN ----------
    function withActive(fn) { if (active >= MAX_ACTIVE()) return false; active++; fn(() => { active = Math.max(0, active - 1); }); return true; }

    // Vlinder: gebogen pad met fladder-bobbel, rust even op een bloem
    function butterfly(done) {
        const blue = chance(.5);
        const { w, img } = wrap(L.bioSky, blue ? 'Vlinder2.webp' : 'Vlinder.webp', blue ? 22 : 26);
        const right = chance(.5), width = W();
        const x0 = right ? -40 : width + 40, x1 = right ? width + 40 : -40;
        const rest = flowers.length ? pick(flowers) : null;
        const restX = rest ? px(rest.slot) - 5 : width / 2;
        const restY = rest ? GROUND - 12 - parseFloat(rest.el.style.height) : NAV - 10;
        // Twee bogen: aanvliegen naar de bloem, en weer weg
        const p1 = sampleCurve({ x: x0, y: 20 }, { x: (x0 + restX) / 2, y: -5 }, { x: restX - (right ? 60 : -60), y: 55 }, { x: restX, y: restY }, 30);
        const p2 = sampleCurve({ x: restX, y: restY }, { x: restX + (right ? 40 : -40), y: 15 }, { x: (restX + x1) / 2, y: 60 }, { x: x1, y: 10 }, 30);
        const dur = rand(16000, 22000);
        const frames = pathFrames(p1, { flip: right ? 1 : -1 }).map(f => ({ ...f, offset: f.offset * .42 }))
            .concat([{ ...pathFrames([p1[p1.length - 1]], { flip: right ? 1 : -1 })[0], offset: .58 }])
            .concat(pathFrames(p2, { flip: right ? 1 : -1 }).map(f => ({ ...f, offset: .58 + f.offset * .42 })));
        animate(w, frames, { duration: dur, easing: 'linear' });
        // Fladderen: het beestje zelf danst op en neer
        animate(img, [{ transform: 'translateY(0) rotate(-4deg)' }, { transform: 'translateY(-5px) rotate(4deg)' }],
            { duration: rand(380, 520), direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        later(() => { remove(w); done(); }, dur + 100);
    }

    // Lieveheersbeestje: landt op een bloem, wandelt even, vliegt weg
    function ladybug(done) {
        const f = flowers.length ? pick(flowers) : null;
        const x = f ? px(f.slot) : px(rand(20, 60));
        const y = f ? GROUND - 6 - parseFloat(f.el.style.height) : NAV - 5;
        const img = sprite(L.bioFront, 'Ladybug.webp', 15, 'center');
        const hold = rand(4000, 7000);
        const pts = sampleCurve({ x, y }, { x: x + 30, y: y - 40 }, { x: x + 80, y: -20 }, { x: x + 140, y: -40 }, 20);
        const frames = [{ transform: `translate(${x - 40}px, ${y - 30}px) scale(.6)`, opacity: 0, offset: 0 },
            { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1, offset: .12 },
            { transform: `translate(${x + 4}px, ${y - 1}px) scale(1)`, opacity: 1, offset: .5 },
            { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1, offset: .75 }]
            .concat(pathFrames(pts, { fadeOut: .5 }).map(fr => ({ ...fr, offset: .75 + fr.offset * .25 })));
        const dur = hold + 4000;
        animate(img, frames, { duration: dur, easing: 'linear' });
        later(() => { remove(img); done(); }, dur + 50);
    }

    // Egel: scharrelt over de grond, snuffelt halverwege even
    function hedgehog(done) {
        const h = rand(26, 32);
        const { w, img } = wrap(L.bioGround, 'egel.webp', h);
        const right = chance(.5), width = W();
        const x0 = right ? -60 : width + 10, x1 = right ? width + 10 : -60, y = GROUND - h + 3;
        const stop = rand(.35, .6), dur = rand(34000, 44000);
        const flip = right ? -1 : 1;   // egel kijkt naar links in de tekening
        const at = t => `translate(${(x0 + (x1 - x0) * t).toFixed(0)}px, ${y}px) scaleX(${flip})`;
        animate(w, [
            { transform: at(0), offset: 0 }, { transform: at(stop), offset: stop },
            { transform: at(stop), offset: stop + .08 }, { transform: at(1), offset: 1 }
        ], { duration: dur, easing: 'linear' });
        animate(img, [{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(-1.5px) rotate(1.5deg)' }],
            { duration: 420, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        later(() => { remove(w); done(); }, dur + 100);
    }

    // Rups: kruipt traag over het gras
    function caterpillar(done) {
        const h = 15;
        const img = sprite(L.bioGround, 'Rups1.webp', h);
        const right = chance(.5), width = W();
        const x0 = right ? -40 : width + 10, x1 = right ? width + 10 : -40, y = GROUND - h + 1;
        const dur = rand(55000, 75000);
        animate(img, [{ transform: `translate(${x0}px, ${y}px) scaleX(${right ? 1 : -1})` },
            { transform: `translate(${x1}px, ${y}px) scaleX(${right ? 1 : -1})` }], { duration: dur, easing: 'linear' });
        later(() => { remove(img); done(); }, dur + 100);
    }

    // Zwaluw: scheert in een boog laag over het gras
    function swallow(done, forceRight, delay, yShift) {
        later(() => {
            const s = pick(SPRITES.swallows);
            const right = forceRight === undefined ? chance(.5) : forceRight;
            const flip = s.faces === (right ? 1 : -1) ? 1 : -1;
            const width = W(), up = chance(.35), ys = yShift || 0;
            const x0 = right ? -60 : width + 60, x1 = right ? width + 60 : -60;
            const dip = rand(GROUND - 8, GROUND + 15) + ys;
            const pts = up
                ? sampleCurve({ x: x0, y: 30 + ys }, { x: x0 + (x1 - x0) * .3, y: dip + 20 }, { x: x0 + (x1 - x0) * .6, y: dip }, { x: x0 + (x1 - x0) * .85, y: -60 }, 40)
                : sampleCurve({ x: x0, y: 18 + ys }, { x: x0 + (x1 - x0) * .35, y: dip + 25 }, { x: x0 + (x1 - x0) * .65, y: dip }, { x: x1, y: 5 + ys }, 40);
            const img = sprite(L.bioSky, s.src, 28, 'center');
            const dur = rand(4200, 5600);
            animate(img, pathFrames(pts, { flip, tilt: 28 }), { duration: dur, easing: 'cubic-bezier(.35,0,.65,1)' });
            later(() => { remove(img); done(); }, dur + 50);
        }, delay || 0);
    }
    function swallowGroup(done) {
        const n = chance(.5) ? 3 : 2, right = chance(.5);
        let left = n;
        for (let i = 0; i < n; i++) swallow(() => { if (--left === 0) done(); }, right, i * 550, i * 9);
    }

    // IJsvogel: komt aan, bidt boven de poel, duikt, en vertrekt
    async function kingfisher(done) {
        if (!pond.el) return done();
        const img = sprite(L.bioFront, 'Kingfisher.webp', 34, 'center');
        const width = W(), hx = px(pond.x) - 10, hy = NAV - 40;
        try {
            await animate(img, pathFrames(sampleCurve({ x: width + 50, y: 10 }, { x: width - 80, y: 55 }, { x: hx + 90, y: 5 }, { x: hx, y: hy }, 30), { tilt: 20, fadeIn: .1 }),
                { duration: 2600, easing: 'cubic-bezier(.3,0,.5,1)' }).finished;
            await animate(img, [{ transform: `translate(${hx}px, ${hy}px)` }, { transform: `translate(${hx + 2}px, ${hy - 3}px)` }],
                { duration: 700, direction: 'alternate', iterations: 3, easing: 'ease-in-out' }).finished;
            await animate(img, [{ transform: `translate(${hx}px, ${hy}px) rotate(0deg)` },
                { transform: `translate(${hx - 6}px, ${GROUND - 20}px) rotate(-55deg) scale(.85)`, offset: .45 },
                { transform: `translate(${hx - 6}px, ${GROUND - 20}px) rotate(-55deg) scale(.85)`, opacity: .9, offset: .6 },
                { transform: `translate(${hx + 10}px, ${hy}px) rotate(0deg)` }], { duration: 1300, easing: 'ease-in-out' }).finished;
            await animate(img, pathFrames(sampleCurve({ x: hx + 10, y: hy }, { x: hx + 60, y: hy - 30 }, { x: width - 60, y: 40 }, { x: width + 60, y: 0 }, 30), { flip: -1, tilt: 20, fadeOut: .1 }),
                { duration: 2400, easing: 'cubic-bezier(.4,0,.7,1)' }).finished;
        } catch (e) { /* geannuleerd bij reset */ }
        remove(img); done();
    }

    // Otter: zwemt naar de poel, kijkt rond, en duikt weg
    function otter(done) {
        if (!pond.el) return done();
        const h = 26;
        const { w, img } = wrap(L.bioFront, 'Otter.webp', h);
        const width = W(), y = GROUND - h + 6, tx = px(pond.x) + 20;
        const dur = 18000;
        const f = x => `translate(${x.toFixed(0)}px, ${y}px)`;
        animate(w, [
            { transform: f(width + 40), opacity: 0, offset: 0 }, { transform: f(width - 10), opacity: 1, offset: .06 },
            { transform: f(tx), opacity: 1, offset: .5 }, { transform: f(tx), opacity: 1, offset: .68 },
            { transform: f(tx - 120), opacity: 1, offset: .9 }, { transform: `translate(${tx - 150}px, ${y + 22}px)`, opacity: 0, offset: 1 }
        ], { duration: dur, easing: 'linear' });
        animate(img, [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }],
            { duration: 900, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        later(() => { remove(w); done(); }, dur + 50);
    }

    // Ganzen en zeearend: hoog en ver weg, langzaam
    function highFlyer(src, h, right, dur, y, opacity) {
        const img = sprite(L.bioSky, src, h, 'center');
        img.style.opacity = opacity;
        const width = W(), x0 = right ? -140 : width + 40, x1 = right ? width + 40 : -140;
        animate(img, [{ transform: `translate(${x0}px, ${y}px)` }, { transform: `translate(${x0 + (x1 - x0) / 2}px, ${y - 6}px)`, offset: .5 },
            { transform: `translate(${x1}px, ${y}px)` }], { duration: dur, easing: 'linear' });
        later(() => remove(img), dur + 50);
    }
    const goose = () => highFlyer('Goose.webp', 16, false, 13000, 6, .85);
    const geese = () => highFlyer('Geese.webp', 20, true, 17000, 4, .8);
    const eagle = () => highFlyer('Zeearend.webp', 24, false, 20000, 3, .9);


    // ---------- REKWISIETEN EN SCÈNE-SPECIFIEKE DIEREN ----------
    function prop(layer, src, h, pct, { flip = 1, lift = 0, cls = '' } = {}) {
        const img = sprite(layer, src, h, cls);
        const pos = `translate(${px(pct)}px, ${GROUND - 2 + lift - h}px) scaleX(${flip})`;
        img.style.transform = pos; img.style.setProperty('--pos', pos);
        animate(img, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCE ? 1 : 1500 });
        return img;
    }

    // Wandelaars (Bergse Pad)
    function walker(done) {
        const girl = chance(.5), h = 52;
        const { w, img } = wrap(L.bioGround, girl ? 'Walkinggirl.webp' : 'WalkingGuy2.webp', h);
        const right = chance(.5), width = W();
        const x0 = right ? -120 : width + 20, x1 = right ? width + 20 : -120, y = GROUND - h + 4;
        const dur = rand(22000, 30000), flip = right ? 1 : -1;
        animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${flip})`, opacity: 0 },
            { transform: `translate(${x0 + (x1 - x0) * .06}px, ${y}px) scaleX(${flip})`, opacity: 1, offset: .06 },
            { transform: `translate(${x0 + (x1 - x0) * .94}px, ${y}px) scaleX(${flip})`, opacity: 1, offset: .94 },
            { transform: `translate(${x1}px, ${y}px) scaleX(${flip})`, opacity: 0 }], { duration: dur, easing: 'linear' });
        later(() => { remove(w); done(); }, dur + 50);
    }

    // De sloot-scène (oevers): otter komt aan, plonst in de poel, slobeend zwemt boos weg,
    // roerdomp schrikt, ijsvogel komt kijken. Daarna zwemt de eend rustig terug.
    function otterSplash(done) {
        if (!pond.el) return done();
        const h = 26, { w, img } = wrap(L.bioFront, 'Otter.webp', h);
        const y = GROUND - h + 6, tx = px(pond.x) - 30;
        const f = x => `translate(${x.toFixed(0)}px, ${y}px) scaleX(-1)`;
        const dur = 11000;
        animate(w, [
            { transform: f(-80), opacity: 0, offset: 0 }, { transform: f(-20), opacity: 1, offset: .06 },
            { transform: f(tx), opacity: 1, offset: .78 },
            { transform: `translate(${tx + 25}px, ${y - 14}px) scaleX(-1) rotate(-25deg)`, opacity: 1, offset: .86 },
            { transform: `translate(${tx + 50}px, ${y + 24}px) scaleX(-1) rotate(40deg)`, opacity: 0, offset: 1 }
        ], { duration: dur, easing: 'linear' });
        animate(img, [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }],
            { duration: 900, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        later(() => remove(w), dur + 50);
        later(() => angryDuck(), dur - 1500);              // eend schrikt op
        later(() => { if (pond.roerdomp) pond.roerdomp.dispatchEvent(new Event('flip')); }, dur - 800);
        later(() => withActive(kingfisher), dur + 20000);
        later(done, dur + 100);
    }
    function angryDuck() {
        const h = 30, { w, img } = wrap(L.bioFront, 'Slobeend.webp', h);
        const y = GROUND + 4, x0 = px(pond.x), x1 = -120, dur = 32000;
        const f = x => `translate(${x.toFixed(0)}px, ${y}px)`;
        animate(w, [{ transform: f(x0), opacity: 0 }, { transform: f(x0 - 30), opacity: 1, offset: .05 },
            { transform: f(x0 + (x1 - x0) * .95), opacity: 1, offset: .95 }, { transform: f(x1), opacity: 0 }], { duration: dur, easing: 'linear' });
        animate(img, [{ transform: 'translateY(0) rotate(-2deg)' }, { transform: 'translateY(-2px) rotate(2deg)' }],
            { duration: 700, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        const angry = document.createElement('img');
        angry.src = IMG + 'Angry.webp'; angry.alt = ''; angry.style.cssText = 'position:absolute;height:22px;width:auto;top:-22px;left:18px;';
        w.appendChild(angry);
        animate(angry, [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-5px) rotate(6deg)' }],
            { duration: 300, direction: 'alternate', iterations: 26, easing: 'ease-in-out' });
        later(() => animate(angry, [{ opacity: 1 }, { opacity: 0 }], { duration: 600 }).finished.then(() => remove(angry)).catch(() => {}), 8000);
        later(() => remove(w), dur + 50);
        later(() => withActive(calmDuck), dur + 8000);       // en na een poosje komt ze rustig terug
    }
    function calmDuck(done) {
        const h = 30, { w, img } = wrap(L.bioFront, 'Slobeend.webp', h);
        const y = GROUND + 4, x0 = -120, x1 = px(pond.x), dur = 36000;
        const f = x => `translate(${x.toFixed(0)}px, ${y}px) scaleX(-1)`;
        animate(w, [{ transform: f(x0), opacity: 0 }, { transform: f(x0 + 30), opacity: 1, offset: .05 },
            { transform: f(x1 - 40), opacity: 1, offset: .95 }, { transform: f(x1), opacity: 0 }], { duration: dur, easing: 'linear' });
        animate(img, [{ transform: 'translateY(0) rotate(-1deg)' }, { transform: 'translateY(-1.5px) rotate(1deg)' }],
            { duration: 1100, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        later(() => { remove(w); done(); }, dur + 50);
    }

    // Slobeend zwemt over de poel (oevers)
    function duck(done) {
        if (!pond.el) return done();
        const h = 20, { w, img } = wrap(L.bioFront, 'Slobeend.webp', h);
        const cx = px(pond.x), y = GROUND - h + 2, right = chance(.5);
        const a = cx - 70, b = cx + 70, x0 = right ? a : b, x1 = right ? b : a, flip = right ? -1 : 1;
        const dur = 16000;
        animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${flip})`, opacity: 0 },
            { transform: `translate(${x0 + (x1 - x0) * .15}px, ${y}px) scaleX(${flip})`, opacity: 1, offset: .15 },
            { transform: `translate(${x0 + (x1 - x0) * .5}px, ${y}px) scaleX(${flip})`, opacity: 1, offset: .55 },
            { transform: `translate(${x0 + (x1 - x0) * .85}px, ${y}px) scaleX(${flip})`, opacity: 1, offset: .85 },
            { transform: `translate(${x1}px, ${y}px) scaleX(${flip})`, opacity: 0 }], { duration: dur, easing: 'linear' });
        animate(img, [{ transform: 'translateY(0) rotate(-1deg)' }, { transform: 'translateY(-1.5px) rotate(1deg)' }],
            { duration: 1100, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        later(() => { remove(w); done(); }, dur + 50);
    }

    // Zeis en maaisel (zeisbrigade): zeis verschijnt, vers maaisel, gedroogd maaisel, alles wordt afgevoerd
    let zeisIndex = 0;
    function zeisCycle() {
        const spots = [18, 34, 50, 66, 82];
        const pct = spots[zeisIndex++ % spots.length];
        const zeis = prop(L.bioGround, zeisIndex % 2 ? 'Zeis.webp' : 'Zeis2.webp', 44, pct - 4, { flip: zeisIndex % 2 ? 1 : -1 });
        const steps = [
            [3000, () => { const m = prop(L.bioGround, 'Maaisel2.webp', 16, pct + 2); zeis._m2 = m; }],
            [11000, () => { const m = prop(L.bioGround, 'Maaisel.webp', 15, pct + 2); zeis._m1 = m; }],
            [16000, () => { if (zeis._m2) animate(zeis._m2, [{ opacity: 1 }, { opacity: 0 }], { duration: 1500 }).finished.then(() => remove(zeis._m2)).catch(() => {}); }],
            [22000, () => { if (zeis._m1) animate(zeis._m1, [{ opacity: 1 }, { opacity: 0 }], { duration: 1500 }).finished.then(() => remove(zeis._m1)).catch(() => {}); }],
            [25000, () => animate(zeis, [{ opacity: 1 }, { opacity: 0 }], { duration: 1500 }).finished.then(() => remove(zeis)).catch(() => {})],
            [29000, zeisCycle]
        ];
        steps.forEach(([t, fn]) => later(fn, t));
    }

    // Zwaluwtil en nestjes (zwaluwen)
    let til = null;
    function placeTil() {
        til = prop(L.bioGarden, 'Zwaluwtil.webp', 82, NARROW() ? 72 : 40);
        [10, 19, 28].forEach((pct, i) => later(() => {
            const n = sprite(L.bioGarden, 'HouseMartinnest.webp', 26);
            n.style.transform = `translate(${px(pct)}px, 0px)`;
            animate(n, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200 });
        }, 600 + i * 500));
    }
    function tilCircle(done) {
        if (!til) return done();
        const cx = px(NARROW() ? 72 : 40) + 12, cy = GROUND - 62, rx = 55, ry = 16;
        const s = pick(SPRITES.swallows), cw = chance(.5), n = 36, pts = [];
        for (let i = 0; i <= n; i++) {
            const t = (cw ? 1 : -1) * i / n * Math.PI * 2 * 1.5 - Math.PI;
            pts.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
        }
        const frames = pts.map((p, i) => {
            const q = pts[Math.max(0, i - 1)], goingRight = p.x >= q.x;
            const flip = s.faces === (goingRight ? 1 : -1) ? 1 : -1;
            const t = i / n;
            return { transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scaleX(${flip * .9}) scaleY(.9)`, opacity: t < .08 ? t / .08 : t > .92 ? (1 - t) / .08 : 1, offset: t };
        });
        const img = sprite(L.bioSky, s.src, 24, 'center');
        animate(img, frames, { duration: 5200, easing: 'linear' });
        later(() => { remove(img); done(); }, 5300);
    }

    // Opruim-intro (educatie): afval op het gras, vuilniszak, alles opgeruimd
    function cleanupIntro(cb) {
        const items = [['Redbull.webp', 22, 25, 0], ['Redbull.webp', 22, 45, 90], ['Pringles.webp', 20, 65, -90]]
            .map(([src, h, pct, rot]) => { const p = prop(L.bioGround, src, h, pct); p.style.transform += ` rotate(${rot}deg)`; return p; });
        later(() => {
            const bag = prop(L.bioGround, 'Garbage.webp', 30, 50);
            items.forEach((it, i) => later(() => {
                const pos = it.style.transform;
                animate(it, [{ transform: pos, opacity: 1 }, { transform: `translate(${px(50) + 8}px, ${GROUND - 20}px) scale(.3)`, opacity: 0 }],
                    { duration: 900, easing: 'ease-in' }).finished.then(() => remove(it)).catch(() => {});
            }, 1500 + i * 1800));
            later(() => {
                animate(bag, [{ opacity: 1 }, { opacity: 0 }], { duration: 800 }).finished.then(() => remove(bag)).catch(() => {});
                later(cb, 900);
            }, 1500 + items.length * 1800 + 2500);
        }, 2500);
    }

    // Bomen die groeien en gesnoeid worden (Bergse Pad)
    function treeCycle() {
        const spots = NARROW() ? [30] : [24, 58, 90];
        spots.forEach((pct, i) => later(() => {
            const h = 88, src = i % 2 ? 'Tree.webp' : 'Iep.webp';
            const img = sprite(L.bioGarden, src, h);
            const base = (s) => `translate(${px(pct)}px, ${GROUND - 2 - h}px) scale(${s})`;
            animate(img, [{ transform: base(.15), opacity: 0 }, { transform: base(1), opacity: 1 }], { duration: 14000, easing: 'ease-out' });
            later(() => animate(img, [{ transform: base(1), opacity: 1 }, { transform: base(.5), opacity: .9, offset: .3 }, { transform: base(.5), opacity: 0 }],
                { duration: 6000, easing: 'ease-in-out' }).finished.then(() => remove(img)).catch(() => {}), 30000);
        }, i * 4000));
        later(treeCycle, 45000);
    }

    // ---------- CHOREOGRAFIE ----------
    const F = SPRITES.flowers;
    const byName = (...names) => F.filter(f => names.some(n => f.src.startsWith(n)));
    const BASE = { sky: '#e8f1f6', water: false, flowersMax: 10, flowerEvery: 9000, eventEvery: 9000, pondAt: null, roerdompAt: null, kingfisherAt: null, otterAt: null, duckAt: null, geeseAt: null, eagleAt: null, setup: null, intro: null, extra: [] };
    const SCENES = {
        home: Object.assign({}, BASE, {
            animals: [[butterfly, 3], [hedgehog, 2], [caterpillar, 1], [ladybug, 2], [swallow, 4], [swallowGroup, 2]],
            pondAt: 40000, roerdompAt: 95000, kingfisherAt: 60000, otterAt: 130000, geeseAt: 110000, eagleAt: 180000
        }),
        zeisbrigade: Object.assign({}, BASE, {          // hooiland: veel bloemen, vlinders, en de zeis aan het werk
            flowersMax: 14, flowerEvery: 3000, eventEvery: 8000,
            slots: [3, 8, 14, 20, 27, 34, 42, 50, 58, 66, 74, 82, 89, 95],
            animals: [[butterfly, 4], [ladybug, 3], [caterpillar, 1], [swallow, 2]],
            setup: () => later(zeisCycle, 4000)
        }),
        oevers: Object.assign({}, BASE, {               // waterkant: poel meteen, ijsvogel, otter, slobeend
            sky: '#dcebf3', water: true,
            flowersMax: 7, flowers: byName('Gelelis', 'Lisdodde2', 'Veldoeket', 'Klaproos.'),
            pondAt: 1500, roerdompAt: 12000, geeseAt: 90000,
            animals: [[butterfly, 3], [swallow, 3], [ladybug, 1]],
            setup: () => { later(() => { withActive(otterSplash); every(() => withActive(otterSplash), 110000); }, 18000); }
        }),
        bergsepad: Object.assign({}, BASE, {            // wandelpad: riet, bomen die gesnoeid worden, wandelaars, ganzen
            flowersMax: 5, flowerEvery: 12000, flowers: byName('Lisdodde2', 'Klaproos.', 'Veldoeket'),
            slots: [6, 14, 40, 50, 70],
            animals: [[walker, 4], [swallow, 3], [butterfly, 1]],
            geeseAt: 5000, eagleAt: 90000,
            setup: () => {
                [[33, 'Rietkraag.webp', 46, 1], [76, 'Rietkraag.webp', 42, -1]].forEach(([p, s, h, f], i) => later(() => prop(L.bioPond, s, h, p, { flip: f }), 500 + i * 800));
                if (!NARROW()) { later(() => prop(L.bioGround, 'Bankje.webp', 34, 64), 1500); later(() => prop(L.bioGarden, 'Maria.webp', 46, 84), 2000); }
                later(treeCycle, 3000);
            }
        }),
        zwaluwen: Object.assign({}, BASE, {             // lucht: zwaluwtil, nestjes, veel zwaluwen
            flowersMax: 6, flowerEvery: 8000, slots: [3, 10, 40, 50, 60, 92],
            animals: [[swallow, 5], [swallowGroup, 3], [tilCircle, 4], [butterfly, 1]],
            eventEvery: 6000, geeseAt: 120000,
            setup: () => later(placeTil, 1500)
        }),
        aanplanten: Object.assign({}, BASE, {           // groei en bloei: rustig, veel bloemen, weinig dieren
            flowersMax: 12, flowerEvery: 4500, eventEvery: 14000,
            slots: [3, 10, 18, 26, 34, 42, 52, 62, 72, 82, 90, 96],
            animals: [[butterfly, 3], [ladybug, 2]]
        }),
        educatie: Object.assign({}, BASE, {             // speels: eerst opruimen, dan egel, rups, vlinders
            flowersMax: 8, flowerEvery: 5000, eventEvery: 8000,
            animals: [[hedgehog, 3], [caterpillar, 2], [butterfly, 3], [ladybug, 2]],
            intro: cleanupIntro
        })
    };
    let currentScene = SCENES[SCENE] || SCENES.home;
    function spawnEvent(scene) {
        if (paused || active >= MAX_ACTIVE() || !chance(.75)) return;
        const total = scene.animals.reduce((s, a) => s + a[1], 0);
        let r = Math.random() * total;
        for (const [fn, wgt] of scene.animals) { r -= wgt; if (r <= 0) { withActive(fn); break; } }
    }

    function start() {
        const scene = currentScene = SCENES[SCENE] || SCENES.home;
        if (scene.sky) {   // lucht: ook de navigatiebalk kleurt mee
            document.querySelectorAll('.bio-background, nav.site-nav').forEach(el => { el.style.background = scene.sky; });
        }
        document.body.classList.toggle('bio-water', !!scene.water);   // sloot onder het gras
        if (REDUCE) {          // stilstaand tafereel
            for (let i = 0; i < Math.min(7, scene.flowersMax); i++) addFlower();
            if (scene.pondAt !== null) { showPond(); later(showRoerdomp, 50); }
            if (scene.setup) scene.setup();
            return;
        }
        const go = () => {
            for (let i = 0; i < 4; i++) later(addFlower, 800 + i * Math.min(2200, scene.flowerEvery));
            every(addFlower, scene.flowerEvery);
            later(() => every(() => { if (chance(.5)) { wiltFlower(); later(addFlower, 4000); } }, 40000), 120000);
            later(() => { spawnEvent(scene); every(() => spawnEvent(scene), scene.eventEvery); }, 3000);
            if (scene.pondAt !== null) later(showPond, scene.pondAt);
            if (scene.roerdompAt !== null) later(showRoerdomp, scene.roerdompAt);
            if (scene.kingfisherAt !== null) later(() => { withActive(kingfisher); every(() => { if (chance(.55)) withActive(kingfisher); }, 50000); }, scene.kingfisherAt);
            if (scene.otterAt !== null) later(() => { withActive(otter); every(() => { if (chance(.4)) withActive(otter); }, 95000); }, scene.otterAt);
            if (scene.duckAt !== null) later(() => { withActive(duck); every(() => { if (chance(.5)) withActive(duck); }, 45000); }, scene.duckAt);
            if (scene.geeseAt !== null) later(() => { chance(.5) ? goose() : geese(); every(() => { if (chance(.4)) (chance(.5) ? goose() : geese()); }, 70000); }, scene.geeseAt);
            if (scene.eagleAt !== null) later(eagle, scene.eagleAt);
            if (scene.setup) scene.setup();
            later(() => { clear(); start(); }, RESET_AFTER);
        };
        if (scene.intro) scene.intro(go); else go();
    }
    function clear() {
        timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = [];
        running.forEach(a => { try { a.cancel(); } catch (e) {} }); running.clear();
        ['bioPond', 'bioGround', 'bioGarden', 'bioSky', 'bioFront'].forEach(k => { if (L[k]) L[k].innerHTML = ''; });
        flowers.length = 0; pond.el = null; pond.roerdomp = null; pond.reeds = []; active = 0; til = null;
    }

    // Pauzeren als het tabblad niet zichtbaar is
    document.addEventListener('visibilitychange', () => {
        paused = document.hidden;
        running.forEach(a => { try { paused ? a.pause() : a.play(); } catch (e) {} });
    });

    // Bij grote breedteveranderingen (draaien van telefoon) opnieuw beginnen
    let lastW = innerWidth;
    addEventListener('resize', () => {
        if (Math.abs(innerWidth - lastW) > 150) { lastW = innerWidth; clear(); start(); }
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => later(start, 800));
    else later(start, 800);
})();
