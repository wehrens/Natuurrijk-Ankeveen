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
    const MAX_ACTIVE = () => { const m = (currentScene && currentScene.maxActive) || 3; return NARROW() ? m - 1 : m; };

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
        // richting per segment: de hoek waarmee de neus (die na scaleX in de bewegingsrichting wijst) omhoog of omlaag moet
        const ang = pts.map((p, i) => {
            if (!tilt || i === 0) return 0;
            const q = pts[i - 1], dx = p.x - q.x, dy = p.y - q.y;
            if (Math.abs(dx) < .01 && Math.abs(dy) < .01) return null;
            const a = Math.atan2(dy, dx) * 180 / Math.PI;
            return dx >= 0 ? a : a - 180 * Math.sign(a);          // naar links: hoek t.o.v. de linker horizon
        });
        for (let i = 1; i < n; i++) if (ang[i] === null) ang[i] = ang[i - 1] || 0;
        if (n > 1) ang[0] = ang[1];
        const smooth = ang.map((a, i) => { const w = [ang[i - 1], a, ang[i + 1]].filter(v => v !== undefined); return w.reduce((x, y) => x + y, 0) / w.length; });
        return pts.map((p, i) => {
            let rot = Math.max(-tilt, Math.min(tilt, smooth[i]));
            if (flip < 0) rot = -rot;                                 // gespiegeld: de rotatie keert om
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
        const h = rand(data.h[0], data.h[1]) * (currentScene.flowerScale || 1);
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
        // Twee lagen: het waterkringetje achter (iets links en lager), het groene rondje (oever) ervoor.
        // Eerst verschijnt de begroeiing, daarna loopt het water vol.
        const water = sprite(L.bioPond, 'Poel1.webp', 27, 'center');
        water.style.transform = `translate(${px(pond.x) - 52}px, ${GROUND + 12}px)`;
        water.style.opacity = 0;
        const green = sprite(L.bioPond, 'Poel3.webp', 58, 'center');
        green.style.transform = `translate(${px(pond.x) - 62}px, ${GROUND - 14}px)`;
        pond.el = green;
        animate(green, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCE ? 1 : 2500, easing: 'ease-out' });
        later(() => {
            animate(water, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCE ? 1 : 2000, easing: 'ease-out', fill: 'forwards' });
        }, REDUCE ? 10 : 1500);
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
        const { w, img } = wrap(L.bioSky, blue ? 'Vlinder2.webp' : 'Vlinder.webp', (blue ? 22 : 26) * (currentScene.flowerScale || 1));
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
        if (fence.el) L.bioGround.insertBefore(w, fence.el);   // achter de schutting langs, zichtbaar door het poortje
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
            animate(img, pathFrames(pts, { flip, tilt: 55 }), { duration: dur, easing: 'cubic-bezier(.3,0,.7,1)' });
            later(() => { remove(img); done(); }, dur + 50);
        }, delay || 0);
    }
    function swallowGroup(done) {
        const n = chance(.5) ? 3 : 2, right = chance(.5);
        let left = n;
        for (let i = 0; i < n; i++) swallow(() => { if (--left === 0) done(); }, right, i * 550, i * 9);
    }

    // IJsvogel: komt aan, bidt boven de poel, duikt, en vertrekt
    let kingfisherBusy = false, otterBusy = false;
    async function kingfisher(done) {
        if (!pond.el || kingfisherBusy) return done();
        kingfisherBusy = true;
        const img = sprite(L.bioFront, 'Kingfisher.webp', 34, 'center');
        const width = W(), hx = px(pond.x) - 10, hy = NAV - 40;
        try {
            await animate(img, pathFrames(sampleCurve({ x: width + 50, y: 10 }, { x: width - 80, y: 55 }, { x: hx + 90, y: 5 }, { x: hx, y: hy }, 30), { tilt: 20, fadeIn: .1 }),
                { duration: 2600, easing: 'cubic-bezier(.3,0,.5,1)' }).finished;
            await animate(img, [{ transform: `translate(${hx}px, ${hy}px)` }, { transform: `translate(${hx + 2}px, ${hy - 3}px)` }],
                { duration: 700, direction: 'alternate', iterations: 3, easing: 'ease-in-out' }).finished;
            await animate(img, [{ transform: `translate(${hx}px, ${hy}px) rotate(0deg)` },
                { transform: `translate(${hx - 6}px, ${GROUND + 8}px) rotate(-55deg) scale(.85)`, offset: .45 },
                { transform: `translate(${hx - 6}px, ${GROUND + 8}px) rotate(-55deg) scale(.85)`, opacity: .9, offset: .6 },
                { transform: `translate(${hx + 10}px, ${hy}px) rotate(0deg)` }], { duration: 1300, easing: 'ease-in-out' }).finished;
            await animate(img, pathFrames(sampleCurve({ x: hx + 10, y: hy }, { x: hx + 60, y: hy - 30 }, { x: width - 60, y: 40 }, { x: width + 60, y: 0 }, 30), { flip: -1, tilt: 20, fadeOut: .1 }),
                { duration: 2400, easing: 'cubic-bezier(.4,0,.7,1)' }).finished;
        } catch (e) { /* geannuleerd bij reset */ }
        remove(img); kingfisherBusy = false; done();
    }

    // Otter: zwemt naar de poel, kijkt rond, en duikt weg
    function otter(done) {
        if (!pond.el || otterBusy) return done();
        otterBusy = true;
        const h = 26;
        const { w, img } = wrap(L.bioFront, 'Otter.webp', h);
        const width = W(), y = GROUND - h + 6, tx = px(pond.x) + 20;
        const dur = 18000;
        const f = x => `translate(${x.toFixed(0)}px, ${y}px)`;
        animate(w, [
            { transform: f(width + 40), opacity: 0, offset: 0 }, { transform: f(width - 10), opacity: 1, offset: .06 },
            { transform: f(tx), opacity: 1, offset: .5 }, { transform: f(tx), opacity: 1, offset: .68 },
            { transform: f(tx - 120), opacity: 1, offset: .9 }, { transform: `translate(${tx - 150}px, ${y + 30}px)`, opacity: 0, offset: 1 }
        ], { duration: dur, easing: 'linear' });
        animate(img, [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }],
            { duration: 900, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        later(() => { remove(w); otterBusy = false; done(); }, dur + 50);
    }

    // Ganzen en zeearend: hoog en ver weg, langzaam
    function highFlyer(src, h, right, dur, y, opacity) {
        const img = sprite(L.bioSky, src, h, 'center');
        img.style.opacity = opacity;
        const width = W(), x0 = right ? -140 : width + 40, x1 = right ? width + 40 : -140;
        animate(img, [{ transform: `translate(${x0}px, ${y}px)` }, { transform: `translate(${x0 + (x1 - x0) / 2}px, ${y - 6}px)`, offset: .5 },
            { transform: `translate(${x1}px, ${y}px)` }], { duration: dur, easing: 'linear' });
        later(() => remove(img), dur + 50);
        return img;
    }
    const goose = () => highFlyer('Goose.webp', 16, false, 13000, 6, .85);
    const geese = () => highFlyer('Geese.webp', 20, true, 17000, 4, .8);
    const eagle = () => highFlyer('Zeearend.webp', 24, false, 20000, 3, .9);


    // ---------- REKWISIETEN EN SCÈNE-SPECIFIEKE DIEREN ----------
    function prop(layer, src, h, pct, { flip = 1, lift = 0, cls = '', instant = false } = {}) {
        const img = sprite(layer, src, h, cls);
        const pos = `translate(${px(pct)}px, ${GROUND - 2 + lift - h}px) scaleX(${flip})`;
        img.style.transform = pos; img.style.setProperty('--pos', pos);
        animate(img, [{ opacity: 0 }, { opacity: 1 }], { duration: (REDUCE || instant) ? 1 : 1500 });
        return img;
    }

    // ---------- MENSEN (Bergse Pad) ----------
    // Dezelfde bouwstenen als de ontmoetingsstrook op de verenigingenpagina, maar groter: een mens is hier ~50px.
    const KLEUR = ['#7B5CC4', '#F39A2B', '#2BB39A', '#D64541', '#3B8FE0', '#C9A227', '#5B8C5A', '#8A6D3B'];
    const HUID = ['#F2C9B0', '#E3B093', '#C68A5C', '#8D5A3C', '#F6D6C2'];
    const HAAR = ['#2b2b2b', '#5a3a2a', '#8b5a2b', '#d9b36a', '#b0b0b0', '#c0392b'];
    const BROEK = ['#2f3e55', '#4a5568', '#6b7b8c', '#3b3b3b', '#7a5c3e', '#1f4e79', '#9aa5b1'];
    const MENS = 41;                                   // standaardlengte in px
    const FEET = GROUND - 1;                           // de voeten staan net op de graslijn
    function mensDiv(h, w) { const d = document.createElement('div'); d.className = 'bio-wrap bio-mens'; d.style.height = h + 'px'; d.style.width = w + 'px'; return d; }
    function person(color, h) {
        const w = mensDiv(h, h * .45);
        const huid = pick(HUID), haar = pick(HAAR), broek = pick(BROEK), schoen = pick(['#2b2b2b', '#4a3728', '#6b4a2b', '#1f2d40']);
        const hairStyle = pick([
            `<path d="M4.4 5 q0 -5.5 4.6 -5.5 q4.6 0 4.6 5.5 q-1.5 -2.5 -4.6 -2.5 q-3.1 0 -4.6 2.5z" fill="${haar}"/>`,
            `<path d="M4.4 6 q0 -6.5 4.6 -6.5 q4.6 0 4.6 6.5 l0 6 l-2 0 l0 -4 q-2.6 -1.5 -5.2 0 l0 4 l-2 0 z" fill="${haar}"/>`,
            `<path d="M4.6 4 q1 -4.6 4.4 -4.6 q3.4 0 4.4 4.6 q-2 -1.6 -4.4 -1.6 q-2.4 0 -4.4 1.6z" fill="${haar}"/>`,
            `<path d="M9 0.2 q5 0 4.8 5.6 q-1.8 -2.8 -4.8 -2.8 q-3 0 -4.8 2.8 q-0.2 -5.6 4.8 -5.6z M4 5 l10 0" fill="${haar}"/>`
        ]);
        const been = (cls, d, ox) => `<g class="${cls}" style="transform-box:view-box;transform-origin:${ox}px 24px"><path d="${d}" fill="none" stroke="${broek}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#000" stroke-width=".7" opacity=".18" stroke-linecap="round" stroke-linejoin="round" transform="translate(0.9 0)"/></g>`;
        const schoenen = (x, y) => `<path d="M${x - 2.1} ${y - .2} h4.4 a1.1 1.1 0 0 1 0 2.2 h-4.4 z" fill="${schoen}"/>`;
        const arm = (cls, d, ox, hx, hy) => `<g class="${cls}" style="transform-box:view-box;transform-origin:${ox}px 14px"><path d="${d}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="1.3" fill="${huid}"/></g>`;
        w.innerHTML = `<svg viewBox="0 0 18 40" width="${h * .45}" height="${h}" aria-hidden="true" style="overflow:visible">
            <g class="legB" style="transform-box:view-box;transform-origin:9px 24px"><path d="M9.5 24 l1.2 7 l-0.4 7" fill="none" stroke="${broek}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 24 l1.2 7 l-0.4 7" fill="none" stroke="#000" stroke-width="3.6" opacity=".15" stroke-linecap="round" stroke-linejoin="round"/>${schoenen(10.6, 38)}</g>
            ${arm('armB', 'M13.5 14 l0.8 6 l-1 4', 13, 13.2, 24.4)}
            <g class="legA" style="transform-box:view-box;transform-origin:9px 24px"><path d="M8.5 24 l-1.2 7 l0.4 7" fill="none" stroke="${broek}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>${schoenen(7.6, 38)}</g>
            <path class="romp" d="M3 13 q6 -4 12 0 l1.5 12 h-15 z" fill="${color}"/>
            <path d="M3 13 q3 -2 6 -2.2 l0.3 14.2 h-6.3 z" fill="#000" opacity=".1"/>
            <path d="M9.4 11 l0.3 13.6" stroke="#000" opacity=".18" stroke-width=".5"/>
            <path d="M7.2 11.6 l1.9 2.6 l1.9 -2.6" fill="none" stroke="#fff" opacity=".55" stroke-width=".7"/>
            <path d="M4.5 22 h9 l0.3 3.5 h-9.6 z" fill="${broek}"/>
            <path d="M4.3 22.3 h9.4" stroke="#3a2a1a" stroke-width=".9"/>
            ${arm('armA', 'M4.5 14 l-0.8 6 l1 4', 5, 4.8, 24.4)}
            <g class="kop" style="transform-box:view-box;transform-origin:9px 10px">
                <path d="M9 9.2 l0.2 1.6" stroke="${huid}" stroke-width="2.2"/>
                <circle cx="9" cy="5" r="4.6" fill="${huid}"/>
                <circle cx="10.3" cy="4.6" r=".55" fill="#2b2b2b"/><circle cx="12.4" cy="4.6" r=".55" fill="#2b2b2b"/>
                <path d="M10.6 7.2 q1.2 0.9 2.3 0" fill="none" stroke="#9a5a4a" stroke-width=".5" stroke-linecap="round"/>
                <circle cx="5.2" cy="5.6" r=".9" fill="${huid}" stroke="#000" stroke-opacity=".12" stroke-width=".4"/>
                ${hairStyle}</g></svg>`;
        w.dataset.huid = huid;
        return w;
    }
    // Loopbeweging: benen en armen zwaaien om en om, het lijf veert mee. Bij pause gaan de ledematen terug naar rust.
    function bob(el, dur) {
        const svg = el.firstElementChild, T = dur * 2;
        let body = null, limbs = [];
        const start = () => {
            body = animate(svg, [{ transform: 'translateY(0)' }, { transform: 'translateY(-1.5px)' }], { duration: dur, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
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
        return { pause: settle, play: () => { if (!body) start(); }, cancel: () => { limbs.forEach(a => a.cancel()); if (body) body.cancel(); limbs = []; body = null; } };
    }
    // Lopen van x0 naar x1 (ms per px = speed); geeft de duur terug en roept cb aan het eind
    function loop(p, x0, x1, h, speed, cb) {
        const y = FEET - h, f = x1 > x0 ? 1 : -1, d = Math.abs(x1 - x0) * speed;
        p.style.transform = `translate(${x0}px, ${y}px) scaleX(${f})`;
        animate(p, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: d, easing: 'linear' })
            .finished.then(() => cb && cb()).catch(() => {});
        return d;
    }
    const WALK = () => rand(26, 32);                   // ms per px: rustig wandeltempo

    // Wandelaars: alleen, met z'n tweeën, soms met een hondje aan de lijn
    const VACHT = ['#8b5a2b', '#2b2b2b', '#d9b36a', '#f4efe6', '#a0522d', '#6b6b6b'];
    function hondje(h) {
        const vacht = pick(VACHT), vlek = pick(VACHT), klein = chance(.5), dw = klein ? 24 : 30, dh = dw * .65;
        const licht = vacht === '#f4efe6' || vacht === '#d9b36a', rnd = licht ? 'stroke="#8a7560" stroke-width=".6"' : '', poot = licht ? '#c9bca8' : vacht;
        const dog = document.createElement('div');
        dog.style.cssText = `position:absolute;left:${h * .45 + 22 - dw}px;top:${h - dh}px;width:${dw}px;height:${dh}px`;
        dog.innerHTML = `<svg viewBox="0 0 20 13" width="${dw}" height="${dh}" aria-hidden="true" style="overflow:visible">
            <path class="tail" d="M3.2 5.5 q-2.6 -1.4 -2.6 -4.4" fill="none" stroke="${poot}" stroke-width="1.5" stroke-linecap="round" style="transform-box:fill-box;transform-origin:100% 100%"/>
            <ellipse cx="9" cy="6.6" rx="6.2" ry="3.2" fill="${vacht}" ${rnd}/>
            <ellipse cx="7" cy="6" rx="2.2" ry="1.6" fill="${vlek}" opacity=".7"/>
            <path d="M4.6 8.5 v4.3 M7 8.8 v4 M11.4 8.8 v4 M13.6 8.5 v4.3" stroke="${poot}" stroke-width="1.5" stroke-linecap="round"/>
            <ellipse cx="18.4" cy="4.9" rx="1.6" ry="1.1" fill="${vacht}" ${rnd}/><circle cx="15.6" cy="4" r="2.9" fill="${vacht}" ${rnd}/><ellipse cx="18.2" cy="4.9" rx="1.3" ry=".8" fill="${vacht}"/>
            <circle cx="19.6" cy="4.6" r=".6" fill="#16233a"/><circle cx="16.4" cy="3.4" r=".45" fill="#16233a"/>
            <path d="M14.2 1.8 q-1.4 0.6 -1 3.2 q1 -0.6 1.8 -2.4 z" fill="${vlek}"/>
            <path d="M13.2 5.6 l2.4 1.2" stroke="#D64541" stroke-width=".9"/></svg>`;
        return { dog, dw, dh };
    }
    function wandelaar(done) {
        const n = chance(.55) ? 1 : 2, metHond = chance(.4), right = chance(.5), width = W(), speed = WALK();
        const x0 = right ? -80 : width + 40, x1 = right ? width + 60 : -120;
        let dur = 0;
        for (let i = 0; i < n; i++) {
            const h = rand(MENS - 6, MENS + 2), p = person(pick(KLEUR), h);
            const off = i * rand(24, 30) * (right ? -1 : 1);
            if (metHond && i === 0) {
                // baasje en hondje in één wrapper, met een lijn ertussen
                const wrapW = h * .45 + 22, box = mensDiv(h, wrapW);
                p.style.cssText = 'position:absolute;left:0;top:0';
                const { dog, dw, dh } = hondje(h);
                const lijn = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                lijn.setAttribute('width', wrapW); lijn.setAttribute('height', h); lijn.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
                const hx = h * .45 * .58, hy = h * .37, cx = wrapW - dw + dw * .7, cy = h - dh + dh * .45;
                lijn.innerHTML = `<path d="M${hx} ${hy} Q${(hx + cx) / 2} ${Math.max(hy, cy) + 5} ${cx} ${cy}" fill="none" stroke="#3d4a5c" stroke-width=".9"/>`;
                box.append(p, lijn, dog); L.bioFront.appendChild(box);
                animate(dog.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }], { duration: rand(150, 190), direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
                animate(dog.querySelector('.tail'), [{ transform: 'rotate(-14deg)' }, { transform: 'rotate(14deg)' }], { duration: 260, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
                const b = bob(p, rand(400, 470));
                dur = Math.max(dur, loop(box, x0 + off, x1 + off, h, speed, () => { b.cancel(); remove(box); }));
            } else {
                L.bioFront.appendChild(p);
                const b = bob(p, rand(400, 470));
                dur = Math.max(dur, loop(p, x0 + off, x1 + off, h, speed, () => { b.cancel(); remove(p); }));
            }
        }
        later(done, dur + 100);
    }

    // Joggers: 1 of 2, soepel tempo
    function jogger(h) {
        const w = mensDiv(h, h * .6);
        const top = pick(['#D64541', '#7B5CC4', '#3B8FE0', '#2BB39A', '#FF4F9A', '#F39A2B']), tight = pick(['#16233a', '#2f3e55', '#3b3b3b']);
        const huid = pick(HUID), haar = pick(HAAR), pony = chance(.5);
        const leg = `fill="none" stroke="${tight}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
        const arm = `fill="none" stroke="${huid}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"`;
        w.innerHTML = `<svg viewBox="0 0 24 40" width="${h * .6}" height="${h}" aria-hidden="true" style="overflow:visible"><g transform="rotate(6 12 38)">
            <path class="armB" d="M12 14 l-1.5 5 l3.5 3" ${arm} opacity=".75" style="transform-box:fill-box;transform-origin:50% 0%"/>
            <path class="legB" d="M12 24 l1.2 7 l-2 7" ${leg} opacity=".8" style="transform-box:fill-box;transform-origin:50% 0%"/>
            <path d="M8 13 q4 -3 8 0 l0.6 11 h-9.2 z" fill="${top}"/><path d="M7.3 22 h9.4 l0.5 4 h-10.4 z" fill="${tight}"/>
            <path class="legA" d="M12 24 l1.2 7 l-2 7" ${leg} style="transform-box:fill-box;transform-origin:50% 0%"/>
            <path class="armA" d="M12 14 l-1.5 5 l3.5 3" ${arm} style="transform-box:fill-box;transform-origin:50% 0%"/>
            ${pony ? `<path class="pony" d="M8.2 3.6 q-5.2 0.6 -6 6.4 q2.2 -2.4 6.4 -4 z" fill="${haar}" style="transform-box:fill-box;transform-origin:100% 0%"/>` : ''}
            <circle cx="12" cy="6" r="4.4" fill="${huid}"/><circle cx="13.3" cy="5.7" r=".5" fill="#2b2b2b"/><circle cx="15.2" cy="5.7" r=".5" fill="#2b2b2b"/>
            <path d="M12.4 32.6 h3.6 a1 1 0 0 1 0 2 h-3.6z" fill="#f4f4f4" opacity=".0"/>
            <path d="M7.6 6 q0 -5 4.4 -5 q4.4 0 4.4 5 q-1.6 -2.3 -4.4 -2.3 q-2.8 0 -4.4 2.3z" fill="${haar}"/></g></svg>`;
        return w;
    }
    function joggers(done) {
        const n = chance(.6) ? 1 : 2, right = chance(.5), width = W(), speed = 12;
        const x0 = right ? -80 : width + 40, x1 = right ? width + 60 : -120;
        let dur = 0;
        for (let i = 0; i < n; i++) {
            const h = rand(MENS - 4, MENS + 2), w = jogger(h); L.bioFront.appendChild(w);
            const off = i * rand(28, 36) * (right ? -1 : 1);
            dur = Math.max(dur, loop(w, x0 + off, x1 + off, h, speed, () => remove(w)));
            const T = rand(380, 430), o = { iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', delay: -rand(0, T) };
            const swing = (sel, a, b, dd) => { const el = w.querySelector(sel); if (el) animate(el, [{ transform: `rotate(${a}deg)` }, { transform: `rotate(${b}deg)` }], Object.assign({}, o, { duration: dd })); };
            swing('.legA', -32, 32, T / 2); swing('.legB', 32, -32, T / 2); swing('.armA', 38, -38, T / 2); swing('.armB', -38, 38, T / 2); swing('.pony', 6, -22, T / 4);
            animate(w.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }], Object.assign({}, o, { duration: T / 4 }));
        }
        later(done, dur + 100);
    }

    // Trappen: twee-delige benen (heup -> knie -> voet) waarvan de voeten rondjes draaien op de trappers
    const trappers = new Set(); let trapLoop = null;
    function been(hx, hy, px, py, L1, L2) {
        const dx = px - hx, dy = py - hy, d = Math.min(Math.hypot(dx, dy), L1 + L2 - .01);
        const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
        const bx = hx + a * dx / d, by = hy + a * dy / d;
        let kx = bx - h * dy / d, ky = by + h * dx / d;
        const k2x = bx + h * dy / d, k2y = by - h * dx / d; if (k2x > kx) { kx = k2x; ky = k2y; }   // knie naar voren
        return `M${hx} ${hy} L${kx.toFixed(2)} ${ky.toFixed(2)} L${px.toFixed(2)} ${py.toFixed(2)} l2.4 0`;
    }
    function trap(t) {
        if (!trappers.size) { trapLoop = null; return; }
        trappers.forEach(r => {
            if (!r.w.isConnected) { trappers.delete(r); return; }
            if (paused) return;
            const g = r.g; if (r.t0 === undefined) r.t0 = t;
            const th = r.phase + (t - r.t0) / 1000 * 2 * Math.PI * g.rate, R = g.R;
            const ax = g.cx + R * Math.cos(th), ay = g.cy + R * Math.sin(th), bx = g.cx - R * Math.cos(th), by = g.cy - R * Math.sin(th);
            r.a.setAttribute('d', been(g.hx, g.hy, ax, ay, g.L1, g.L2)); r.b.setAttribute('d', been(g.hx, g.hy, bx, by, g.L1, g.L2));
            r.c.setAttribute('d', `M${ax.toFixed(2)} ${ay.toFixed(2)} L${bx.toFixed(2)} ${by.toFixed(2)}`);
        });
        trapLoop = requestAnimationFrame(trap);
    }
    function trapper(w, g) {
        trappers.add({ w, a: w.querySelector('.legA'), b: w.querySelector('.legB'), c: w.querySelector('.crank'), phase: rand(0, 6.28), g });
        if (!trapLoop) trapLoop = requestAnimationFrame(trap);
    }

    // Fietsers: stadsfiets, rechtop; soms een kindje achterop, soms twee naast elkaar
    function stadsfiets(opts) {
        const { color, huid, haar, kind, scale = 1, ponytail = false } = opts;
        const W0 = 52 * scale, H0 = 40 * scale, w = mensDiv(H0, W0);
        w.innerHTML = `<svg viewBox="0 0 52 40" width="${W0}" height="${H0}" aria-hidden="true" style="overflow:visible">
            <g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="10" cy="31" r="7.5" fill="none" stroke="#3d4a5c" stroke-width="1.8"/><path d="M10 23.5v15M2.5 31h15M4.7 25.7l10.6 10.6M15.3 25.7L4.7 36.3" stroke="#3d4a5c" stroke-width=".8"/></g>
            <g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="42" cy="31" r="7.5" fill="none" stroke="#3d4a5c" stroke-width="1.8"/><path d="M42 23.5v15M34.5 31h15M36.7 25.7l10.6 10.6M47.3 25.7L36.7 36.3" stroke="#3d4a5c" stroke-width=".8"/></g>
            <path d="M10 31 l14 0 l-2 -12 M24 31 l12 -12 l6 12 M36 19 l0 -4 l3 0 M22 19 l-4 -1" fill="none" stroke="#3d4a5c" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="24" cy="31" r="2.2" fill="#3d4a5c"/>
            ${kind ? `<path d="M12 22 h6 l0 -6 h-5 z" fill="#5a6a7e"/><circle cx="15" cy="12" r="3" fill="${kind.huid}"/><path d="M12.2 11.8 q2.8 -3.4 5.6 0 q-1 -1.4 -2.8 -1.4 q-1.8 0 -2.8 1.4z" fill="${kind.haar}"/><path d="M12.5 16 q2.5 -2 5 0 l0.5 6 h-6 z" fill="${kind.color}"/><path d="M13.5 22 l-1 5 M16.5 22 l1 5" stroke="#2f3e55" stroke-width="2" stroke-linecap="round"/>` : ''}
            <path class="legB" d="" fill="none" stroke="#1f2d40" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path class="crank" d="" stroke="#3d4a5c" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M19 21 q0 -10 5 -11 q6 0 6 10 l-1 1 l-9 1 z" fill="${color}"/>
            <path class="legA" d="" fill="none" stroke="#2f3e55" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M24 12 l11 3" stroke="${huid}" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="25" cy="6" r="4.2" fill="${huid}"/><circle cx="26.3" cy="5.7" r=".5" fill="#2b2b2b"/><circle cx="28.1" cy="5.7" r=".5" fill="#2b2b2b"/>
            ${ponytail ? `<path d="M20.8 6 q0 -5 4.2 -5 q4.2 0 4.2 5 q-1.4 -2.2 -4.2 -2.2 q-2.8 0 -4.2 2.2z" fill="${haar}"/><path d="M21.5 5 q-4 1 -4.5 5.5 q2 -2 5 -3.2z" fill="${haar}"/>` : `<path d="M20.8 6 q0 -5 4.2 -5 q4.2 0 4.2 5 q-1.4 -2.2 -4.2 -2.2 q-2.8 0 -4.2 2.2z" fill="${haar}"/>`}</svg>`;
        return w;
    }
    function rijd(w, right, h, off, speed) {
        const width = W(), f = right ? 1 : -1, y = FEET - h + 1;
        const x0 = right ? -120 - off : width + 40 + off, x1 = right ? width + 80 : -160, dur = Math.abs(x1 - x0) * speed;
        animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
            .finished.then(() => remove(w)).catch(() => remove(w));
        w.querySelectorAll('.wheel').forEach(g => animate(g, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 1100, iterations: Infinity, easing: 'linear' }));
        trapper(w, { cx: 24, cy: 31, R: 3.4, hx: 22, hy: 19.5, rate: 1.1, L1: 8.6, L2: 8.2 });
        animate(w.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-1.2px)' }], { duration: 550, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        return dur;
    }
    function fietsers(done) {
        const right = chance(.5), n = chance(.6) ? 1 : 2, sc = 1.15, speed = 15;
        let dur = 0;
        for (let i = 0; i < n; i++) {
            const kind = n === 1 && chance(.35) ? { huid: pick(HUID), haar: pick(HAAR), color: pick(['#D64541', '#F39A2B', '#3B8FE0', '#FF4F9A']) } : null;
            const w = stadsfiets({ color: pick(KLEUR), huid: pick(HUID), haar: pick(HAAR), kind, scale: sc, ponytail: chance(.5) });
            L.bioFront.appendChild(w);
            dur = Math.max(dur, rijd(w, right, 40 * sc, i * 75, speed));
        }
        later(done, dur + 100);
    }

    // Bakfiets: de oude houten bak voorop, man in blauwe overall erachter
    function bakfiets(done) {
        const right = chance(.5), width = W(), f = right ? 1 : -1, huid = '#F2C2A8';
        const SW = 82, SH = SW * 40 / 80, w = mensDiv(SH, SW);
        const wiel = (cx, cy, r) => `<g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2b2b2b" stroke-width="1.8"/><circle cx="${cx}" cy="${cy}" r="${r - 1.2}" fill="none" stroke="#7a4a3a" stroke-width=".6"/><path d="M${cx} ${cy - r}v${2 * r}M${cx - r} ${cy}h${2 * r}M${cx - r * .7} ${cy - r * .7}l${r * 1.4} ${r * 1.4}M${cx + r * .7} ${cy - r * .7}l${-r * 1.4} ${r * 1.4}" stroke="#555" stroke-width=".6"/></g>`;
        w.innerHTML = `<svg viewBox="0 0 80 40" width="${SW}" height="${SH}" aria-hidden="true" style="overflow:visible">
            ${wiel(12, 31, 7.5)}${wiel(56, 31, 7.5)}
            <path d="M47 31 a9 9 0 0 1 18 0" fill="none" stroke="#2a2a2a" stroke-width="2.2"/>
            <path d="M5 31 a7.5 7.5 0 0 1 9 -7" fill="none" stroke="#ddd8cf" stroke-width="1.6"/>
            <path d="M12 31 L24 31 L40 31 L46 27 M24 31 L19 17 M38 30 L38 13 M38 13 H31" fill="none" stroke="#3a2e26" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="M31 13 l-3 0.8" stroke="#5a2a1a" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M14 17 h10 l1 -1.6 q-6 -1.6 -11.5 0 z" fill="#111"/>
            <ellipse cx="25" cy="31" rx="4" ry="2.6" fill="#2a2a2a"/>
            <rect x="41" y="13" width="38" height="14" rx=".6" fill="#4e4139" stroke="#2f2722" stroke-width=".8"/>
            <path d="M41 17.5 h38 M41 22 h38" stroke="#3a3029" stroke-width=".7"/>
            <path d="M46 14 v12 M56 14 v12 M66 14 v12 M74 14 v12" stroke="#5c4e44" stroke-width=".5"/>
            <rect x="41" y="25" width="38" height="2.2" fill="#ddd8cf"/>
            <path d="M44 13 h8 v-1.5 h5 v1.5 h4 v-2.5 h6 v2.5 z" fill="#c9a97a" opacity=".9"/>
            <path d="M60 13 q6 -3 12 -1 l-1 1 z" fill="#e8e4dc"/>
            <path class="legB" d="" fill="none" stroke="#163f7a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path class="crank" d="" stroke="#3d4a5c" stroke-width="1.2" stroke-linecap="round"/><circle cx="24" cy="31" r="2" fill="#555"/>
            <path d="M17 20 q-1 -11 6 -12 q8 0 7 11 l-1 1 l-11 1 z" fill="#1b4f9c"/>
            <path class="legA" d="" fill="none" stroke="#1b4f9c" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M23 11 l7 2.2" stroke="${huid}" stroke-width="2.4" stroke-linecap="round"/><circle cx="30.4" cy="13.2" r="1.3" fill="${huid}"/>
            <circle cx="23" cy="5" r="4.2" fill="${huid}"/><circle cx="24.6" cy="4.6" r=".5" fill="#2b2b2b"/><circle cx="26.4" cy="4.6" r=".5" fill="#2b2b2b"/>
            <path d="M18.6 5.2 q0 -5.4 4.4 -5.4 q4.4 0 4.4 5.4 q-1.4 -2.4 -4.4 -2.4 q-3 0 -4.4 2.4 z" fill="#1a1a1a"/>
            <path d="M20 2.2 q1.2 -1.4 2.4 -1.2 M25 1.6 q1 0.6 1.6 1.8" stroke="#b8b8b8" stroke-width=".7" fill="none" stroke-linecap="round"/>
            <path d="M18 20 q5 2.5 11 0" stroke="#163f7a" stroke-width="1" fill="none"/></svg>`;
        L.bioFront.appendChild(w);
        const y = FEET - SH + 1, x0 = right ? -140 : width + 40, x1 = right ? width + 80 : -180, dur = Math.abs(x1 - x0) * 17;
        animate(w, [{ transform: `translate(${x0}px, ${y}px) scaleX(${f})` }, { transform: `translate(${x1}px, ${y}px) scaleX(${f})` }], { duration: dur, easing: 'linear' })
            .finished.then(() => remove(w)).catch(() => remove(w));
        w.querySelectorAll('.wheel').forEach(g => animate(g, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 1400, iterations: Infinity, easing: 'linear' }));
        trapper(w, { cx: 24, cy: 31, R: 3.4, hx: 21.5, hy: 19.5, rate: .8, L1: 8.6, L2: 8.2 });
        animate(w.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-1px)' }], { duration: 700, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        later(done, dur + 100);
    }

    // Vogelaars: een of twee wandelaars met rugzakje en verrekijker. Ze blijven staan, zetten de kijker aan de ogen
    // en volgen een groepje overvliegende ganzen; daarna lopen ze verder.
    function vogelaar(h) {
        const p = person(pick(['#5B8C5A', '#8A6D3B', '#6b7b8c', '#7a5c3e', '#4a5568']), h), svg = p.firstElementChild;
        const rugzak = pick(['#D64541', '#1f4e79', '#C9A227', '#2BB39A']);
        svg.insertAdjacentHTML('afterbegin', `<rect x="0.8" y="12.5" width="4.6" height="10" rx="1.6" fill="${rugzak}"/><path d="M3 12.5 q2.5 -2 5 0" fill="none" stroke="${rugzak}" stroke-width="1"/>`);
        // verrekijker hangt op de borst; bij het kijken verschijnt hij aan de ogen (in de kop-groep)
        svg.querySelector('.romp').insertAdjacentHTML('afterend', `<g class="borst"><rect x="7.6" y="15.5" width="1.6" height="2.2" fill="#222"/><rect x="9.6" y="15.5" width="1.6" height="2.2" fill="#222"/></g>`);
        svg.querySelector('.kop').insertAdjacentHTML('beforeend', `<g class="kijker" opacity="0"><rect x="9.4" y="3.4" width="7.4" height="1.5" rx=".5" fill="#222"/><rect x="9.4" y="5.3" width="7.4" height="1.5" rx=".5" fill="#222"/><rect x="9.4" y="3.2" width="2.2" height="3.8" rx=".6" fill="#333"/><rect x="15.4" y="3.6" width="1.6" height="3" rx=".4" fill="#111"/></g>`);
        // kijkhouding: gebogen armen met de handen bij de kijker (los van de gewone zwaai-armen)
        const kleur = svg.querySelector('.romp').getAttribute('fill');
        svg.insertAdjacentHTML('beforeend', `<g class="kijkarmen" opacity="0"><path d="M5 14 l2.5 -3.5 l4 -3" fill="none" stroke="${kleur}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11.6" cy="7.3" r="1.3" fill="${p.dataset.huid}"/><path d="M13.5 14 l1.5 -3.5 l-0.3 -3.6" fill="none" stroke="${kleur}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="14.6" cy="6.8" r="1.3" fill="${p.dataset.huid}"/></g>`);
        return p;
    }
    function vogelaars(done) {
        const n = chance(.5) ? 1 : 2, right = chance(.5), width = W(), speed = WALK(), f = right ? 1 : -1;
        const stopX = width * rand(.3, .55) + (right ? 0 : width * .15);
        const x0 = right ? -80 : width + 40, x1 = right ? width + 60 : -120;
        const group = [];
        let inDur = 0;
        for (let i = 0; i < n; i++) {
            const h = rand(MENS - 4, MENS + 2), p = vogelaar(h); L.bioFront.appendChild(p);
            const off = i * 30 * -f, xs = stopX + off;
            const b = bob(p, rand(400, 470));
            inDur = Math.max(inDur, loop(p, x0 + off, xs, h, speed, () => b.pause()));
            group.push({ p, h, xs, b, f });
        }
        // kijken: armen omhoog, verrekijker aan de ogen, hoofd volgt de ganzen
        const kijk = (g, aan) => {
            const svg = g.p.firstElementChild;
            ['.armA', '.armB'].forEach(s => animate(svg.querySelector(s), [{ opacity: aan ? 1 : 0 }, { opacity: aan ? 0 : 1 }], { duration: 350, delay: aan ? 0 : 200 }));
            animate(svg.querySelector('.kijkarmen'), [{ opacity: aan ? 0 : 1 }, { opacity: aan ? 1 : 0 }], { duration: 350, delay: aan ? 200 : 0 });
            animate(svg.querySelector('.kijker'), [{ opacity: aan ? 0 : 1 }, { opacity: aan ? 1 : 0 }], { duration: 300, delay: aan ? 300 : 0 });
            animate(svg.querySelector('.borst'), [{ opacity: aan ? 1 : 0 }, { opacity: aan ? 0 : 1 }], { duration: 300, delay: aan ? 300 : 0 });
        };
        const face = (g, dir) => { if (g.f === dir) return; g.f = dir; animate(g.p, [{ transform: `translate(${g.xs}px, ${FEET - g.h}px) scaleX(${-dir})` }, { transform: `translate(${g.xs}px, ${FEET - g.h}px) scaleX(${dir})` }], { duration: 350, easing: 'ease-in-out' }); };
        later(() => {
            // de ganzen komen van de kant waar ze vandaan kwamen en vliegen over hen heen
            const DUR = 15000, width = W(), gx0 = right ? -140 : width + 40, gx1 = right ? width + 40 : -140;
            const img = highFlyer('Geese.webp', 20, right, DUR, 4, .85), t0 = performance.now();
            later(() => group.forEach(g => kijk(g, true)), 600);
            const watch = every(() => {
                const t = (performance.now() - t0) / DUR;
                if (t >= 1) { clearInterval(watch); return; }
                const gx = gx0 + (gx1 - gx0) * t + 40, gy = 14;
                group.forEach(g => {
                    const px0 = g.xs + g.h * .22, py0 = FEET - g.h + 8;
                    const dx = gx - px0, dy = py0 - gy, dir = dx >= 0 ? 1 : -1;
                    face(g, dir);
                    const ang = Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI;           // 0 = horizon, 90 = recht boven
                    const tilt = -(6 + Math.min(ang, 80) * .38);                        // tot ~ -36 graden achterover
                    g.p.firstElementChild.querySelector('.kop').style.transform = `rotate(${tilt.toFixed(1)}deg)`;
                });
            }, 160);
            later(() => {
                group.forEach(g => { kijk(g, false); g.p.firstElementChild.querySelector('.kop').style.transition = 'transform .5s'; g.p.firstElementChild.querySelector('.kop').style.transform = 'rotate(0deg)'; });
                later(() => {
                    let out = 0;
                    group.forEach(g => { face(g, f); later(() => { g.b.play(); out = Math.max(out, loop(g.p, g.xs, x1 + (g.xs - stopX), g.h, speed, () => { g.b.cancel(); remove(g.p); })); }, 400); });
                    later(done, 400 + (Math.abs(x1 - stopX) + 60) * speed + 200);
                }, 1200);
            }, 15200);
        }, inDur + 700);
    }

    // De sloot-scène (oevers): otter komt aan, plonst in de poel, slobeend zwemt boos weg,
    // roerdomp schrikt, ijsvogel komt kijken. Daarna zwemt de eend rustig terug.
    function otterSplash(done) {
        if (!pond.el || otterBusy) return done();
        otterBusy = true;
        const h = 26, { w, img } = wrap(L.bioFront, 'Otter.webp', h);
        const y = GROUND - h + 6, tx = px(pond.x) - 30;
        const f = x => `translate(${x.toFixed(0)}px, ${y}px) scaleX(-1)`;
        const dur = 11000;
        animate(w, [
            { transform: f(-80), opacity: 0, offset: 0 }, { transform: f(-20), opacity: 1, offset: .06 },
            { transform: f(tx), opacity: 1, offset: .78 },
            { transform: `translate(${tx + 25}px, ${y - 14}px) scaleX(-1) rotate(-25deg)`, opacity: 1, offset: .86 },
            { transform: `translate(${tx + 50}px, ${y + 34}px) scaleX(-1) rotate(40deg)`, opacity: 0, offset: 1 }
        ], { duration: dur, easing: 'linear' });
        animate(img, [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }],
            { duration: 900, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        later(() => { remove(w); otterBusy = false; }, dur + 50);
        later(() => angryDuck(), dur - 1500);              // eend schrikt op
        later(() => { if (pond.roerdomp) pond.roerdomp.dispatchEvent(new Event('flip')); }, dur - 800);
        later(() => withActive(kingfisher), dur + 20000);
        later(done, dur + 100);
    }
    function angryDuck() {
        const h = 30, { w, img } = wrap(L.bioFront, 'Slobeend.webp', h);
        const y = GROUND + 8, x0 = px(pond.x), x1 = -120, dur = 32000;
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
        const y = GROUND + 8, x0 = -120, x1 = px(pond.x), dur = 36000;
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

    // Sinusmaaien (zeisbrigade): een stuk gras groeit hoog op, de zeis komt en maait het kort.
    // Steeds een ander stuk, nooit de hele breedte tegelijk. De bloemen blijven staan.
    const MOW_SPOTS = [4, 18, 31, 44, 57, 70, 83];
    let mowIndex = 0;
    function mowCycle() {
        const pct = MOW_SPOTS[mowIndex % MOW_SPOTS.length];
        mowIndex += 3;                                 // springt heen en weer over het veld
        const w = px(NARROW() ? 22 : 12);
        const tall = document.createElement('div');
        tall.className = 'bio-tallgrass';
        tall.style.cssText = `left:${px(pct)}px;width:${w}px;`;
        L.bioGround.insertBefore(tall, L.bioGround.firstChild);   // achter zeis en maaisel, vóór de navigatiebalk
        const growFor = rand(18000, 26000);
        const grow = animate(tall, [{ transform: 'scaleY(1)' }, { transform: `scaleY(${rand(3.4, 4.4).toFixed(2)})` }],
            { duration: growFor, easing: 'cubic-bezier(.3,.6,.4,1)' });
        later(() => {
            // De zeis komt erbij
            const right = chance(.5);
            const zeis = prop(L.bioGround, right ? 'Zeis.webp' : 'Zeis2.webp', 66, pct + (right ? -3 : 9), { flip: right ? 1 : -1 });
            later(() => {
                // Maaien: het lange gras zakt in
                const cur = getComputedStyle(tall).transform;
                grow.cancel(); tall.style.transform = cur;
                animate(tall, [{ transform: cur }, { transform: 'scaleY(1)' }], { duration: 2600, easing: 'ease-in-out' })
                    .finished.then(() => remove(tall)).catch(() => {});
                const m2 = prop(L.bioGround, 'Maaisel2.webp', 30, pct + 3);
                later(() => animate(zeis, [{ opacity: 1 }, { opacity: 0 }], { duration: 1500 }).finished.then(() => remove(zeis)).catch(() => {}), 4000);
                later(() => { const m1 = prop(L.bioGround, 'Maaisel.webp', 28, pct + 3);
                    animate(m2, [{ opacity: 1 }, { opacity: 0 }], { duration: 1500 }).finished.then(() => remove(m2)).catch(() => {});
                    later(() => animate(m1, [{ opacity: 1 }, { opacity: 0 }], { duration: 1500 }).finished.then(() => remove(m1)).catch(() => {}), 9000);
                }, 9000);
            }, 2000);
        }, growFor);
        later(mowCycle, growFor + 14000 + rand(0, 6000));
    }
    function startMowing() { mowCycle(); later(mowCycle, 12000); }

    // Zwaluwtil en nestjes (zwaluwen)
    let til = null;
    function placeTil() {
        til = prop(L.bioGarden, 'Zwaluwtil.webp', 82, NARROW() ? 72 : 40);
        nests.length = 0;
        [10, 19, 28].forEach((pct, i) => later(() => {
            const n = sprite(L.bioGarden, 'HouseMartinnest.webp', 26);
            n.style.transform = `translate(${px(pct)}px, 0px)`;
            animate(n, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200 });
            nests.push({ x: px(pct) + 13, y: 23 });      // de opening onderin het nestje
        }, 600 + i * 500));
    }
    const nests = [];

    // Zwaluw vliegt een nestje in, blijft even en vliegt weer uit
    function nestVisit(done, delay, nestIndex) {
        later(() => {
            if (!nests.length) return done();
            const nest = nests[nestIndex % nests.length];
            const s = pick(SPRITES.swallows), width = W();
            const fromRight = chance(.5);
            const x0 = fromRight ? width + 60 : -60;
            const flipIn = s.faces === (fromRight ? -1 : 1) ? 1 : -1;
            const inPts = sampleCurve({ x: x0, y: 40 }, { x: x0 + (nest.x - x0) * .35, y: GROUND + 5 }, { x: nest.x + (fromRight ? 90 : -90), y: 60 }, { x: nest.x, y: nest.y + 8 }, 34);
            const img = sprite(L.bioSky, s.src, 26, 'center');
            // aanvliegen (0–94%), dan kleiner worden en in het nest verdwijnen
            const inFrames = pathFrames(inPts, { flip: flipIn, tilt: 25 }).map(f => ({ ...f, offset: f.offset * .94 }));
            inFrames.push({ transform: `translate(${nest.x}px, ${nest.y}px) scale(.35) scaleX(${flipIn})`, opacity: 0, offset: 1 });
            animate(img, inFrames, { duration: 4200, easing: 'cubic-bezier(.35,0,.6,1)' });
            const stay = rand(5000, 9000);
            later(() => {
                remove(img);
                const toRight = chance(.5);
                const x1 = toRight ? width + 60 : -60;
                const flipOut = s.faces === (toRight ? 1 : -1) ? 1 : -1;
                const out = sprite(L.bioSky, s.src, 26, 'center');
                const outPts = sampleCurve({ x: nest.x, y: nest.y + 6 }, { x: nest.x + (toRight ? 40 : -40), y: 70 }, { x: nest.x + (x1 - nest.x) * .5, y: GROUND }, { x: x1, y: 20 }, 34);
                const outFrames = [{ transform: `translate(${nest.x}px, ${nest.y}px) scale(.35) scaleX(${flipOut})`, opacity: 0, offset: 0 }]
                    .concat(pathFrames(outPts, { flip: flipOut, tilt: 25 }).map(f => ({ ...f, offset: .06 + f.offset * .94 })));
                animate(out, outFrames, { duration: 4000, easing: 'cubic-bezier(.4,0,.65,1)' });
                later(() => { remove(out); done(); }, 4100);
            }, 4200 + stay);
        }, delay || 0);
    }
    function nestPair(done) {
        const first = Math.floor(Math.random() * 3);
        let left = 2;
        nestVisit(() => { if (--left === 0) done(); }, 0, first);
        nestVisit(() => { if (--left === 0) done(); }, 1800, first + 1 + Math.floor(Math.random() * 2));
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
        const items = [['Redbull.webp', 44, 25, 0], ['Redbull.webp', 44, 45, 90], ['Pringles.webp', 40, 65, -90]]
            .map(([src, h, pct, rot]) => { const p = prop(L.bioGround, src, h, pct); p.style.transform += ` rotate(${rot}deg)`; return p; });
        later(() => {
            const bag = prop(L.bioGround, 'Garbage.webp', 48, 50);
            items.forEach((it, i) => later(() => {
                const pos = it.style.transform;
                animate(it, [{ transform: pos, opacity: 1 }, { transform: `translate(${px(50) + 14}px, ${GROUND - 30}px) scale(.3)`, opacity: 0 }],
                    { duration: 900, easing: 'ease-in' }).finished.then(() => remove(it)).catch(() => {});
            }, 1500 + i * 1800));
            later(() => {
                animate(bag, [{ opacity: 1 }, { opacity: 0 }], { duration: 800 }).finished.then(() => remove(bag)).catch(() => {});
                later(cb, 900);
            }, 1500 + items.length * 1800 + 2500);
        }, 2500);
    }

    // Bomen die groeien en gesnoeid worden (Bergse Pad)
    function tak(x, y, right) {
        const d = document.createElement('div'); d.className = 'bio-wrap';
        d.innerHTML = `<svg viewBox="0 0 20 12" width="22" height="13" aria-hidden="true" style="overflow:visible"><path d="M1 10 q8 -4 18 -8" fill="none" stroke="#6b4a2b" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="6" r="2.4" fill="#5f9b3c"/><circle cx="13" cy="3.6" r="2.6" fill="#4f8a32"/><circle cx="17" cy="2.4" r="2" fill="#6fae46"/></svg>`;
        L.bioFront.appendChild(d);
        const dx = (right ? 1 : -1) * rand(10, 26), y1 = GROUND - 6;
        animate(d, [{ transform: `translate(${x}px, ${y}px) rotate(0deg)`, opacity: 1 }, { transform: `translate(${x + dx}px, ${y1}px) rotate(${right ? 160 : -160}deg)`, opacity: 1, offset: .75 }, { transform: `translate(${x + dx}px, ${y1}px) rotate(${right ? 160 : -160}deg)`, opacity: 0 }], { duration: 2600, easing: 'cubic-bezier(.4,0,.8,.6)' });
        later(() => remove(d), 2700);
    }
    function treeCycle() {
        const spots = NARROW() ? [30] : [24, 58, 90];
        spots.forEach((pct, i) => later(() => {
            const h = 88, src = i % 2 ? 'Tree.webp' : 'Iep.webp', wdt = h * .78;
            const wrap = document.createElement('div'); wrap.className = 'bio-wrap';
            wrap.style.cssText = `width:${wdt}px;height:${h}px;transform-origin:50% 100%`;
            const img = document.createElement('img'); img.src = IMG + src; img.alt = ''; img.draggable = false;
            img.style.cssText = `height:${h}px;width:auto;display:block;margin:0 auto`;
            wrap.appendChild(img); L.bioGarden.appendChild(wrap);
            const x = px(pct) - wdt / 2, y = GROUND - 2 - h, right = chance(.5);
            const base = (sc, rot = 0) => `translate(${x}px, ${y}px) scale(${sc}) rotate(${rot}deg)`;
            animate(wrap, [{ transform: base(.15), opacity: 0 }, { transform: base(1), opacity: 1 }], { duration: 14000, easing: 'ease-out' });
            // snoeien: de kroon wordt in stappen kleiner, bij elke knip valt er een tak
            const snoei = [[12, 6, 0, 4], [22, 16, 0, 12], [34, 24, 0, 20]];
            let prev = 'inset(0 0 0 0 round 0 0 0 0)';
            snoei.forEach(([t, r, b, l], k) => later(() => {
                const next = `inset(${t}% ${r}% ${b}% ${l}% round ${38 + k * 6}% ${42 + k * 5}% 0 0)`;
                animate(img, [{ clipPath: prev }, { clipPath: next }], { duration: 500, easing: 'steps(2, end)' }); prev = next;
                tak(x + wdt * (k % 2 ? .78 - r / 100 : .2 + l / 100), y + h * t / 100, k % 2 === 1);
                if (k === 2) later(() => tak(x + wdt * .5, y + h * .3, !right), 700);
            }, 24000 + k * 6000));
            // dan wankelt hij even en valt om; op de grond vervaagt hij
            later(() => {
                animate(wrap, [{ transform: base(1, 0) }, { transform: base(1, right ? -3 : 3) }, { transform: base(1, right ? 2 : -2) }, { transform: base(1, 0) }], { duration: 900, easing: 'ease-in-out' });
                later(() => animate(wrap, [{ transform: base(1, 0), easing: 'cubic-bezier(.6,0,1,.6)' }, { transform: base(1, right ? 86 : -86), offset: .55 }, { transform: base(1, right ? 83 : -83), offset: .7 }, { transform: base(1, right ? 86 : -86), opacity: 1, offset: .82 }, { transform: base(1, right ? 86 : -86), opacity: 0 }], { duration: 4800 }).finished.then(() => remove(wrap)).catch(() => remove(wrap)), 1000);
            }, 46000);
        }, i * 5000));
        later(treeCycle, 70000);
    }

    // ---------- EGELSNELWEG (egels): schutting, egel loopt vast, poortje, en door ----------
    const fence = { el: null, x: 0, w: 72, gap: false };
    function placeFence() {
        const pct = NARROW() ? 66 : 36, h = 83, s = h / 585;
        const wl = Math.round(375 * s), wr = Math.round(305 * s);
        fence.w = wl + wr;
        const mk = (side, x, w) => {
            const box = document.createElement('div');
            box.className = 'bio-wrap';
            box.style.transform = `translate(${x}px, ${GROUND - 2 - h}px)`;
            box.innerHTML = `<img class="full" src="${IMG}schutting-${side}.webp" alt="" style="height:${h}px;width:${w}px;display:block">
                <img class="cut" src="${IMG}schutting-poortje-${side}.webp" alt="" style="height:${h}px;width:${w}px;display:block;position:absolute;top:0;left:0;opacity:0">`;
            return box;
        };
        // Twee helften: de egel loopt vóór de linkerhelft en, na het poortje, achter de rechterhelft
        const left = mk('links', px(pct), wl), right = mk('rechts', px(pct) + wl, wr);
        right.insertAdjacentHTML('beforeend', `<svg class="arch" width="${fence.w}" height="${h}" viewBox="0 0 680 585" style="position:absolute;top:0;left:-${wl}px;opacity:0">
            <path d="M317 585 V527 a58 58 0 0 1 116 0 V585 h-18 V527 a40 40 0 0 0 -80 0 V585 z" fill="#2f7d4f"/></svg>`);
        L.bioGround.appendChild(left); L.bioGround.appendChild(right);
        fence.el = left; fence.right = right; fence.x = px(pct); fence.gap = false;
        [left, right].forEach(b => animate(b, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCE ? 1 : 1200 }));
    }
    function openGate() {
        if (!fence.el || fence.gap) return;
        fence.gap = true;
        [fence.el, fence.right].forEach(b => {
            animate(b.querySelector('.cut'), [{ opacity: 0 }, { opacity: 1 }], { duration: 1500 });
            animate(b.querySelector('.full'), [{ opacity: 1 }, { opacity: 0 }], { duration: 1500 });
        });
        later(() => animate(fence.right.querySelector('.arch'), [{ opacity: 0 }, { opacity: 1 }], { duration: 1500 }), 1800);
    }
    function closeGate() {
        if (!fence.el) return;
        fence.gap = false;
        animate(fence.right.querySelector('.arch'), [{ opacity: 1 }, { opacity: 0 }], { duration: 800 });
        [fence.el, fence.right].forEach(b => {
            animate(b.querySelector('.cut'), [{ opacity: 1 }, { opacity: 0 }], { duration: 800 });
            animate(b.querySelector('.full'), [{ opacity: 0 }, { opacity: 1 }], { duration: 800 });
        });
    }
    // Het verhaal: egel komt van links, botst, druipt af, poortje, en gaat erdoor
    function hedgehogStory(done) {
        if (!fence.el) return done();
        const h = 30, hw = 40;
        const { w, img } = wrap(L.bioGround, 'egel.webp', h);
        L.bioGround.insertBefore(w, fence.right);      // vóór de linkerhelft, achter de rechterhelft
        const y = GROUND - h + 3, stopX = fence.x - hw + 2;
        const f = (x, flip) => `translate(${x.toFixed(0)}px, ${y}px) scaleX(${flip})`;
        const bob = animate(img, [{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(-1.5px) rotate(1.5deg)' }],
            { duration: 420, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        const walkIn = 9000;
        animate(w, [{ transform: f(-60, -1) }, { transform: f(stopX, -1) }], { duration: walkIn, easing: 'linear' });
        later(() => {                                   // botsen: drie keer duwen, geen beweging
            bob.pause();
            animate(w, [{ transform: f(stopX, -1) }, { transform: f(stopX + 5, -1), offset: .5 }, { transform: f(stopX, -1) }],
                { duration: 700, iterations: 3, easing: 'ease-in-out' });
        }, walkIn);
        later(() => {                                   // afdruipen: omkeren, stukje terug, wachten
            bob.play();
            animate(w, [{ transform: f(stopX, -1) }, { transform: f(stopX, 1), offset: .08 }, { transform: f(stopX - 70, 1), offset: .6 }, { transform: f(stopX - 70, 1) }],
                { duration: 5000, easing: 'linear' });
        }, walkIn + 2200);
        later(() => { bob.pause(); openGate(); }, walkIn + 6800);
        // En erdoor: zodra de egel het poortje gepasseerd is komt hij vóór de rechterhelft,
        // stopt duidelijk aan de andere kant, kijkt om zich heen, en scharrelt dan verder
        const x0 = stopX - 70, passX = fence.x + fence.w * 0.64 - 6, restX = fence.x + fence.w + 48, x1 = W() + 20;
        const t1 = 300 + (restX - x0) * 40;
        later(() => {
            bob.play();
            animate(w, [{ transform: f(x0, 1) }, { transform: f(x0, -1), offset: 300 / t1 }, { transform: f(restX, -1) }],
                { duration: t1, easing: 'linear' });
        }, walkIn + 11000);
        later(() => L.bioGround.appendChild(w), walkIn + 11000 + 300 + (passX - x0) * 40);   // nu vóór de schutting
        later(() => {                                   // aangekomen: even rondkijken
            bob.pause();
            animate(w, [{ transform: f(restX, -1) }, { transform: f(restX, 1), offset: .3 }, { transform: f(restX, 1), offset: .7 }, { transform: f(restX, -1) }],
                { duration: 2600, easing: 'steps(1, end)' });
        }, walkIn + 11000 + t1);
        const t3 = (x1 - restX) * 40;
        later(() => { bob.play(); animate(w, [{ transform: f(restX, -1) }, { transform: f(x1, -1) }], { duration: t3, easing: 'linear' }); }, walkIn + 11000 + t1 + 2600);
        later(() => { remove(w); done(); }, walkIn + 11000 + t1 + 2600 + t3 + 200);
    }
    // Na het verhaal: egels scharrelen vrij door het poortje (gewone egel-wandeling)
    function storyCycle() {
        withActive(hedgehogStory);
        later(() => { closeGate(); later(storyCycle, 3000); }, 120000);
    }


    // ---------- VLEERMUIZEN: grillige vlucht in de schemering, en een vleermuiskast aan een boom ----------
    const batSvg = color => 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 28"><path fill="' + color + '" d="M32 8c-2 0-3 2-4 3-3-3-7-5-12-5-6 0-11 3-16 8 4-1 7 0 9 3 2-2 5-2 7 0 1-2 4-2 6 0 1-1 2-3 3-6 1 3 2 5 3 6 2-2 5-2 6 0 2-2 5-2 7 0 2-3 5-4 9-3-5-5-10-8-16-8-5 0-9 2-12 5-1-1-2-3-4-3z"/></svg>');
    const BAT_SVG = batSvg('#9db0cc');
    const moon = { x: 0, y: 0, r: 0 };
    // Vloeiende kromme door een reeks steunpunten (Catmull-Rom)
    function spline(ctrl, per = 8) {
        const out = [], p = ctrl;
        for (let i = 0; i < p.length - 1; i++) {
            const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
            for (let j = 0; j < per; j++) {
                const t = j / per, t2 = t * t, t3 = t2 * t;
                out.push({
                    x: .5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
                    y: .5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
                });
            }
        }
        out.push(p[p.length - 1]);
        return out;
    }
    function bat(done) {
        const w = document.createElement('div'); w.className = 'bio-wrap';
        const img = document.createElement('img'); img.src = IMG + 'vleermuis-sprite.webp'; img.alt = '';
        img.style.height = rand(20, 28) + 'px'; img.style.width = 'auto';
        w.appendChild(img); L.bioSky.appendChild(w);
        const right = chance(.5), width = W();
        const x0 = right ? -60 : width + 60, x1 = right ? width + 60 : -60;
        // Grillig maar vloeiend: een handvol steunpunten, daar een kromme doorheen
        // Vloeiend getekend, maar met echt onverwachte zwenkingen: veel steunpunten, grote uitwijkingen,
        // en af en toe een schijnbeweging terug (de vleermuis hapt naar een insect)
        const n = 12, ctrl = [];
        for (let i = 0; i <= n; i++) {
            const back = i > 1 && i < n - 1 && chance(.25) ? (right ? -1 : 1) * rand(40, 90) : 0;
            ctrl.push({ x: x0 + (x1 - x0) * i / n + rand(-45, 45) + back, y: rand(4, NAV - 6) });
        }
        ctrl[0] = { x: x0, y: rand(10, 40) }; ctrl[n] = { x: x1, y: rand(10, 40) };
        if (moon.r && chance(.45)) { const k = Math.round(n / 2); ctrl[k] = { x: moon.x - 6, y: moon.y - 2 }; }
        const pts = spline(ctrl, 8);
        const dur = rand(7500, 10500);
        let dir = right;
        animate(w, pts.map((p, i) => {
            const q = pts[Math.max(0, i - 1)], dx = p.x - q.x;
            if (Math.abs(dx) > 1.5) dir = dx > 0;
            const tilt = i === 0 ? 0 : Math.max(-25, Math.min(25, Math.atan2(p.y - q.y, Math.abs(dx) + .1) * 57 * .45));
            return { transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scaleX(${dir ? -1 : 1}) rotate(${tilt.toFixed(1)}deg)`, offset: i / (pts.length - 1) };
        }), { duration: dur, easing: 'linear' });
        later(() => { remove(w); done(); }, dur + 50);
    }
    function batPair(done) { let left = 2; bat(() => { if (--left === 0) done(); }); later(() => bat(() => { if (--left === 0) done(); }), 900); }
    function placeNight() {
        // Maan (in de lucht-laag, dus ook over de navigatiebalk heen), tussen logo en menu
        moon.x = px(NARROW() ? 50 : 31); moon.y = NARROW() ? 12 : 30; moon.r = NARROW() ? 8 : 15;
        const m = document.createElement('div'); m.className = 'bio-wrap';
        m.style.transform = `translate(${moon.x - moon.r * 3}px, ${moon.y - moon.r * 3}px)`;
        const R = moon.r, S = R * 6;
        m.innerHTML = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
            <defs><radialGradient id="mglow"><stop offset="35%" stop-color="#fff5cc" stop-opacity=".55"/><stop offset="100%" stop-color="#fff5cc" stop-opacity="0"/></radialGradient></defs>
            <circle cx="${S / 2}" cy="${S / 2}" r="${R * 2.6}" fill="url(#mglow)"/>
            <circle cx="${S / 2}" cy="${S / 2}" r="${R}" fill="#fbf4d8"/>
            <circle cx="${S / 2 - R * .3}" cy="${S / 2 - R * .2}" r="${R * .22}" fill="#e3dab8"/>
            <circle cx="${S / 2 + R * .35}" cy="${S / 2 + R * .3}" r="${R * .16}" fill="#e3dab8"/>
            <circle cx="${S / 2 + R * .1}" cy="${S / 2 - R * .5}" r="${R * .1}" fill="#e3dab8"/></svg>`;
        L.bioSky.appendChild(m);
        animate(m, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCE ? 1 : 2500 });
        // Sterren die zachtjes fonkelen
        const n = NARROW() ? 14 : 30;
        for (let i = 0; i < n; i++) {
            const s = document.createElement('div');
            s.style.cssText = `position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;left:${rand(0, 100)}%;top:${rand(3, 60)}px;opacity:0`;
            L.bioSky.appendChild(s);
            animate(s, [{ opacity: 0 }, { opacity: rand(.5, 1), offset: .5 }, { opacity: .15 }],
                { duration: rand(1800, 4200), delay: rand(0, 3000), iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
        }
        // Grote boom: alleen stam en onderkant van de kruin in beeld, met de kast aan de stam
        const pct = NARROW() ? 56 : 36, h = NARROW() ? 170 : 300, tw = h * 228 / 292;
        const tree = sprite(L.bioGround, 'Boom.webp', h);
        tree.style.transform = `translate(${px(pct)}px, ${GROUND - 2 - h}px)`; tree.style.filter = 'brightness(.5) saturate(.6)';
        animate(tree, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCE ? 1 : 1200 });
        const bw = 22, bh = 32;
        const box = document.createElement('div'); box.className = 'bio-wrap';
        box.style.transform = `translate(${px(pct) + tw * .5 - bw / 2}px, ${GROUND - 2 - 64}px)`;
        box.innerHTML = `<svg width="${bw}" height="${bh}" viewBox="0 0 22 32">
            <path d="M11 0 L11 6" stroke="#9a9a9a" stroke-width="1"/>
            <rect x="1" y="6" width="20" height="21" rx="2" fill="#2a2725"/>
            <rect x="0" y="7" width="22" height="3" rx="1" fill="#3a3633"/>
            <path d="M6 16 q5-5 10 0 q-2 2-5 1 q-3 1-5-1z" fill="#3f3b37"/>
            <rect x="3" y="27" width="16" height="4" fill="#cdbf9e"/>
            <path d="M5 27v4M8 27v4M11 27v4M14 27v4M17 27v4" stroke="#b5a785" stroke-width=".8"/></svg>`;
        L.bioGround.appendChild(box);
        animate(box, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCE ? 1 : 1200 });
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
            setup: () => later(startMowing, 2000)
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
            slots: [6, 14, 40, 50, 70], eventEvery: 7500, maxActive: 4, flowerScale: .6,       // mensen zijn ~46px, dus bloemen kleiner
            animals: [[wandelaar, 5], [fietsers, 3], [joggers, 2], [bakfiets, 1], [vogelaars, 3], [swallow, 3], [butterfly, 1]],
            geeseAt: 5000, eagleAt: 90000,
            setup: () => {
                (NARROW() ? [[10, 'Rietkraag.webp', 40, 1]] : [[33, 'Rietkraag.webp', 46, 1], [76, 'Rietkraag.webp', 42, -1]]).forEach(([p, s, h, f], i) => later(() => prop(L.bioPond, s, h, p, { flip: f }), 500 + i * 800));
                prop(L.bioGround, 'Bankje.webp', NARROW() ? 28 : 33, NARROW() ? 66 : 64, { instant: true }); prop(L.bioGarden, 'Maria.webp', NARROW() ? 36 : 40, NARROW() ? 79 : 84, { instant: true });
                later(treeCycle, 3000);
            }
        }),
        zwaluwen: Object.assign({}, BASE, {             // lucht: zwaluwtil, nestjes, veel zwaluwen
            flowersMax: 6, flowerEvery: 8000, slots: [3, 10, 40, 50, 60, 92],
            animals: [[swallow, 4], [swallowGroup, 2], [tilCircle, 4], [nestPair, 4], [butterfly, 1]],
            eventEvery: 6000, geeseAt: 120000,
            setup: () => later(placeTil, 1500)
        }),
        aanplanten: Object.assign({}, BASE, {           // groei en bloei: rustig, veel bloemen, weinig dieren
            flowersMax: 12, flowerEvery: 4500, eventEvery: 14000,
            slots: [3, 10, 18, 26, 34, 42, 52, 62, 72, 82, 90, 96],
            animals: [[butterfly, 3], [ladybug, 2]]
        }),
        egels: Object.assign({}, BASE, {                // egelsnelweg: schutting, egel loopt vast, poortje, en door
            flowersMax: 6, flowerEvery: 7000, eventEvery: 9000,
            slots: NARROW() ? [6, 22, 40, 92] : [4, 12, 22, 48, 56, 64, 74, 84, 94],
            animals: [[hedgehog, 4], [caterpillar, 1], [butterfly, 2], [ladybug, 1]],
            setup: () => { placeFence(); later(storyCycle, 2500); }
        }),
        vleermuizen: Object.assign({}, BASE, {          // schemering: vleermuizen fladderen, kast aan de boom
            flowersMax: 5, flowerEvery: 9000, eventEvery: 6000,
            slots: NARROW() ? [6, 30, 50] : [4, 14, 24, 58, 70, 84, 94],
            animals: [[bat, 5], [batPair, 3]],
            setup: placeNight
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
        document.body.classList.add('scene-' + SCENE);   // vangnet: de klasse hoort al in de HTML te staan
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
        kingfisherBusy = false; otterBusy = false; flowers.length = 0; pond.el = null; pond.roerdomp = null; pond.reeds = []; active = 0; til = null; nests.length = 0; fence.el = null; fence.right = null; moon.r = 0;
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

    window.biotoop = { wandelaar, fietsers, joggers, bakfiets, vogelaars, swallow, swallowGroup };   // handig om te testen
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => later(start, 800));
    else later(start, 800);
})();
