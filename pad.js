/* ===== Working-out pad =====
   A ruled notepad under each question. Cooper writes with his finger (or types with the keyboard).
   Handwriting is read on the iPad itself and snaps into neat typed text on the line.
   Finished lines like "12 × 3 = 36" are checked: a tick when the maths is right and on the way to the answer,
   a pop-up hint when the maths is wrong or heading somewhere that won't help.
   The pad never works anything out FOR him (no answers are ever shown), so it can't be used as a calculator. */
const Pad = (() => {
  "use strict";
  /* ---------- handwriting templates (drawn in a 100 x 100 box) ---------- */
  const arc = (cx, cy, rx, ry, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  const seg = (...p) => p;
  const T = {
    "0": [[arc(50, 50, 32, 48, -90, 270, 24)], [arc(50, 50, 32, 48, -90, -450, 24)], [arc(50, 50, 40, 48, -60, 300, 24)]],
    "1": [[seg([50, 0], [50, 100])], [seg([30, 22], [55, 0], [55, 100])], [seg([30, 22], [55, 0], [55, 100]), seg([35, 100], [75, 100])]],
    "2": [[[...arc(50, 28, 32, 28, 200, 360, 10), [80, 40], [15, 100], [88, 100]]], [[...arc(50, 30, 28, 26, 190, 350, 8), [75, 48], [20, 98], [85, 96]]], [[...arc(50, 28, 30, 27, 180, 345, 9), [70, 52], [18, 96], [52, 96], [88, 92]]], [[...arc(50, 30, 34, 30, 170, 340, 9), [30, 80], ...arc(30, 92, 9, 8, -90, 200, 6), [55, 96], [90, 96]]], [[...arc(50, 30, 35, 30, 190, 380, 12), [12, 100], [88, 100]]], [[...arc(48, 26, 30, 26, 210, 380, 10), [20, 95], [22, 100], [85, 98]]]],
    "3": [[[...arc(48, 27, 30, 25, 200, 450, 12), ...arc(48, 74, 34, 26, 270, 520, 12)]], [[[18, 4], [80, 4], [40, 45], ...arc(48, 72, 34, 28, 280, 520, 12)]]],
    "4": [[seg([62, 0], [8, 66], [88, 66]), seg([65, 25], [65, 100])], [seg([20, 0], [12, 55], [85, 55]), seg([68, 10], [68, 100])], [seg([62, 0], [8, 66], [88, 66], [65, 66], [65, 100])]],
    "5": [[seg([80, 2], [25, 2]), [[25, 2], [20, 45], ...arc(48, 70, 33, 30, 230, 500, 12)]], [[[80, 2], [25, 2], [20, 45], ...arc(48, 70, 33, 30, 230, 500, 12)]]],
    "6": [[[[75, 4], [45, 20], [22, 55], ...arc(50, 72, 30, 28, 180, 540, 16)]], [[[70, 0], [30, 45], ...arc(50, 70, 30, 30, 200, 560, 16)]]],
    "7": [[seg([10, 0], [90, 0], [38, 100])], [seg([10, 0], [90, 0], [38, 100]), seg([35, 52], [80, 52])], [seg([10, 14], [12, 0], [90, 0], [45, 100])]],
    "8": [[[...arc(50, 26, 26, 24, 10, -250, 12), ...arc(50, 74, 32, 26, -90, 270, 16).reverse()]], [[...arc(50, 26, 28, 25, 180, 450, 12), ...arc(50, 74, 32, 26, 270, -90, 16)]]],
    "9": [[[...arc(48, 28, 30, 27, 0, 380, 16), [80, 28], [75, 100]]], [[...arc(48, 28, 30, 27, -20, 350, 16), [78, 30], [78, 100]]], [[...arc(48, 28, 30, 27, 0, 360, 16), [78, 30], [60, 75], [40, 100]]]],
    "+": [[seg([50, 0], [50, 100]), seg([0, 50], [100, 50])], [seg([0, 50], [100, 50]), seg([50, 0], [50, 100])]],
    "×": [[seg([0, 0], [100, 100]), seg([100, 0], [0, 100])], [seg([100, 0], [0, 100]), seg([0, 0], [100, 100])]],
    "÷": [],
    "/": [[seg([85, 0], [15, 100])], [seg([15, 100], [85, 0])]],
    "(": [[arc(90, 50, 55, 50, 240, 120, 12)]],
    ")": [[arc(10, 50, 55, 50, -60, 60, 12)]],
  };
  /* ---------- $P point-cloud recogniser (order- and direction-free) ---------- */
  const NP = 32;
  function resample(pts, n) {
    let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const I = L / (n - 1) || 1, out = [pts[0].slice()]; let D = 0;
    const p = pts.map(q => q.slice());
    for (let i = 1; i < p.length; i++) {
      if (p[i][2] !== p[i - 1][2]) continue; // different strokes
      const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      if (D + d >= I && d > 0) { const t = (I - D) / d, q = [p[i - 1][0] + t * (p[i][0] - p[i - 1][0]), p[i - 1][1] + t * (p[i][1] - p[i - 1][1]), p[i][2]]; out.push(q); p.splice(i, 0, q); D = 0; }
      else D += d;
    }
    while (out.length < n) out.push(p[p.length - 1].slice());
    return out.slice(0, n);
  }
  // smooth out shaky fingers before reading (moving average along each stroke)
  function smooth(st) { if (st.length < 5) return st; const r = 1; return st.map((_, i) => { let sx = 0, sy = 0, n = 0; for (let k = Math.max(0, i - r); k <= Math.min(st.length - 1, i + r); k++) { sx += st[k][0]; sy += st[k][1]; n++; } return [sx / n, sy / n]; }); }
  function normalise(strokes) {
    let pts = []; strokes.forEach((s, k) => s.forEach(p => pts.push([p[0], p[1], k])));
    if (pts.length === 1) pts.push([pts[0][0] + 0.1, pts[0][1], 0]);
    pts = resample(pts, NP);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const s = Math.max(x1 - x0, y1 - y0) || 1; let cx = 0, cy = 0;
    pts = pts.map(([x, y]) => [(x - x0) / s, (y - y0) / s]); pts.forEach(([x, y]) => { cx += x; cy += y; }); cx /= NP; cy /= NP;
    return pts.map(([x, y]) => [x - cx, y - cy]);
  }
  function cloudDist(a, b, start) {
    const used = new Uint8Array(NP); let sum = 0, i = start;
    do { let min = 1e9, idx = -1; for (let j = 0; j < NP; j++) if (!used[j]) { const d = (a[i][0] - b[j][0]) ** 2 + (a[i][1] - b[j][1]) ** 2; if (d < min) { min = d; idx = j; } }
      used[idx] = 1; const w = 1 - ((i - start + NP) % NP) / NP; sum += w * Math.sqrt(min); i = (i + 1) % NP; } while (i !== start);
    return sum;
  }
  function greedy(a, b) { const step = Math.floor(Math.sqrt(NP)); let m = 1e9; for (let i = 0; i < NP; i += step) m = Math.min(m, cloudDist(a, b, i), cloudDist(b, a, i)); return m; }
  // templates + slanted / squashed copies so different writing styles still match
  const LIB = [];
  for (const [ch, vars] of Object.entries(T)) for (const v of vars) for (const [sl, sx] of [[0, 1], [0.2, 1], [-0.15, 1], [0, 0.7], [0.15, 0.8]]) {
    LIB.push({ ch, n: v.length, cloud: normalise(v.map(s => s.map(([x, y]) => [50 + (x - 50) * sx + (50 - y) * sl, y]))) });
  }
  function bbox(strokes) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const s of strokes) for (const [x, y] of s) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }; }
  function classify(strokes, LH) {
    strokes = strokes.map(smooth);
    const b = bbox(strokes), big = Math.max(b.w, b.h);
    const boxes = strokes.map(s => bbox([s]));
    const tiny = bb => Math.max(bb.w, bb.h) < LH * 0.16, flat = bb => bb.h < bb.w * 0.35 && bb.w > LH * 0.18;
    if (big < LH * 0.16) return ".";
    if (strokes.length === 1 && flat(b)) return "−";
    if (strokes.length === 2 && boxes.every(flat)) return "=";
    if (strokes.length >= 3 && boxes.filter(flat).length === 1 && boxes.filter(tiny).length === strokes.length - 1) return "÷";
    const n = strokes.filter(s => !tiny(bbox([s]))).length;
    const strokesUsed = strokes.filter(s => !tiny(bbox([s])));
    if (n === 1 && b.w < b.h * 0.32) { // a single thin upright stroke: 1 or /
      const s = strokesUsed[0], top = s.reduce((a, p) => p[1] < a[1] ? p : a), bot = s.reduce((a, p) => p[1] > a[1] ? p : a);
      return (top[0] - bot[0]) > b.h * 0.38 ? "/" : "1";
    }
    const cloud = normalise(strokesUsed.length ? strokesUsed : strokes);
    let best = "?", bd = 1e9;
    for (const t of LIB) { let d = greedy(cloud, t.cloud); if (t.n !== n) d *= 1.12; if (d < bd) { bd = d; best = t.ch; } }
    return best;
  }
  // split a line's strokes into characters: strokes that overlap side-to-side belong together
  function groupChars(strokes, LH) {
    const items = strokes.map(s => ({ s, b: bbox([s]) })).sort((a, c) => a.b.x0 - c.b.x0), groups = [];
    for (const it of items) {
      const g = groups[groups.length - 1];
      if (g) { const ov = Math.min(g.b.x1, it.b.x1) - Math.max(g.b.x0, it.b.x0), small = Math.max(4, Math.min(g.b.w, it.b.w));
        const dot = Math.max(it.b.w, it.b.h) < LH * 0.16 && it.b.x0 >= g.b.x0 - 4 && it.b.x1 <= g.b.x1 + 4 && g.strokes.some(s => { const bb = bbox([s]); return bb.h < bb.w * 0.35; });
        if (ov > small * 0.35 || dot) { g.strokes.push(it.s); g.b = bbox(g.strokes); continue; } }
      groups.push({ strokes: [it.s], b: it.b });
    }
    return groups;
  }
  function recognise(strokes, LH) {
    const groups = groupChars(strokes, LH); let out = "";
    groups.forEach(g => { out += classify(g.strokes, LH); });
    return out;
  }


  /* ---------- sketch tidying: turn rough shapes into clean ones ---------- */
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  function segDist(p, a, b) { const l2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2; if (!l2) return dist(p, a); let t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l2; t = Math.max(0, Math.min(1, t)); return dist(p, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]); }
  function rdp(pts, eps) { if (pts.length < 3) return pts.slice(); let md = 0, mi = 0; for (let i = 1; i < pts.length - 1; i++) { const d = segDist(pts[i], pts[0], pts[pts.length - 1]); if (d > md) { md = d; mi = i; } }
    if (md <= eps) return [pts[0], pts[pts.length - 1]]; const a = rdp(pts.slice(0, mi + 1), eps), b = rdp(pts.slice(mi), eps); return a.slice(0, -1).concat(b); }
  const pathLen = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += dist(pts[i], pts[i - 1]); return L; };
  // nudge nearly level / upright edges to exactly level / upright
  function straighten(a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], ang = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI) % 180;
    if (ang < 9 || ang > 171) { const y = (a[1] + b[1]) / 2; return [[a[0], y], [b[0], y]]; }
    if (Math.abs(ang - 90) < 9) { const x = (a[0] + b[0]) / 2; return [[x, a[1]], [x, b[1]]]; } return [a, b]; }
  function fitShape(pts) {
    if (pts.length < 2) return null;
    const b = bbox([pts]), diag = Math.hypot(b.w, b.h); if (diag < 12) return null;
    const L = pathLen(pts), closed = dist(pts[0], pts[pts.length - 1]) < Math.max(18, diag * 0.22);
    if (!closed) {
      const chord = dist(pts[0], pts[pts.length - 1]), dev = Math.max(...pts.map(q => segDist(q, pts[0], pts[pts.length - 1])));
      if (chord > 10 && (L / Math.max(1, chord) < 1.08 || dev < Math.max(5, chord * 0.09))) { const [a, c] = straighten(pts[0], pts[pts.length - 1]); return { t: "line", pts: [a, c] }; }
      const v = rdp(pts, diag * 0.06);
      if (v.length <= 4) { let ok = true; for (let i = 1; i < v.length; i++) { const seg = pts.slice(pts.indexOf(v[i - 1]), pts.indexOf(v[i]) + 1); if (seg.length > 1 && pathLen(seg) / Math.max(1, dist(v[i - 1], v[i])) > 1.15) ok = false; } if (ok) return { t: "poly", pts: v, closed: false }; }
      return null;
    }
    // closed: circle/oval, or a polygon with 3 or 4 corners
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, rx = b.w / 2, ry = b.h / 2;
    let err = 0; for (const p of pts) { const r = Math.hypot((p[0] - cx) / (rx || 1), (p[1] - cy) / (ry || 1)); err += Math.abs(r - 1); } err /= pts.length;
    const loop = pts.concat([pts[0]]);
    let far = 0; for (let i = 1; i < loop.length; i++) if (dist(loop[i], loop[0]) > dist(loop[far], loop[0])) far = i;
    const v = rdp(loop.slice(0, far + 1), diag * 0.07).concat(rdp(loop.slice(far), diag * 0.07).slice(1));
    let corners = v.slice(0, -1); if (corners.length > 1 && dist(corners[0], corners[corners.length - 1]) < diag * 0.12) corners.pop();
    // merge corners that are very close together
    corners = corners.filter((c, i) => i === 0 || dist(c, corners[i - 1]) > diag * 0.12);
    // drop "corners" that sit on a straight edge
    for (let k = 0; k < 3 && corners.length > 3; k++) corners = corners.filter((c, i) => { const a = corners[(i - 1 + corners.length) % corners.length], n = corners[(i + 1) % corners.length]; return segDist(c, a, n) > diag * 0.08; });
    if (err < 0.12 && corners.length > 4) return { t: "ell", cx, cy, rx: Math.abs(rx - ry) < 0.12 * Math.max(rx, ry) ? (rx + ry) / 2 : rx, ry: Math.abs(rx - ry) < 0.12 * Math.max(rx, ry) ? (rx + ry) / 2 : ry };
    if (corners.length === 3) return { t: "poly", pts: corners, closed: true };
    if (corners.length === 4) {
      const axis = corners.every((c, i) => { const n = corners[(i + 1) % 4], ang = Math.abs(Math.atan2(n[1] - c[1], n[0] - c[0]) * 180 / Math.PI) % 90; return ang < 14 || ang > 76; });
      if (axis) { let x0 = Math.min(...corners.map(c => c[0])), x1 = Math.max(...corners.map(c => c[0])), y0 = Math.min(...corners.map(c => c[1])), y1 = Math.max(...corners.map(c => c[1]));
        const w = x1 - x0, h = y1 - y0; if (Math.abs(w - h) < 0.12 * Math.max(w, h)) { const s = (w + h) / 2, mx = (x0 + x1) / 2, my = (y0 + y1) / 2; x0 = mx - s / 2; x1 = mx + s / 2; y0 = my - s / 2; y1 = my + s / 2; }
        return { t: "poly", pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], closed: true }; }
      return { t: "poly", pts: corners, closed: true };
    }
    if (err < 0.2) return { t: "ell", cx, cy, rx, ry };
    return null;
  }
  // in Sketch mode: is this little group of strokes written numbers? returns the text, or null
  function sketchText(strokes) {
    const b = bbox(strokes); if (b.h > 110 || b.h < 14) return null;
    const LH = Math.max(40, b.h * 1.15), groups = groupChars(strokes, LH);
    for (let i = 1; i < groups.length; i++) if (groups[i].b.x0 - groups[i - 1].b.x1 > b.h * 0.9) return null; // spread out like tick marks
    const txt = groups.map(g => classify(g.strokes, LH)).join("");
    if (!/^[0-9+−×÷=./]+$/.test(txt) || !/[0-9]/.test(txt)) return null;
    if (strokes.length === 1) { const f = fitShape(strokes[0]); // one stroke: shapes win unless it really looks like a digit
      if (txt === "1" || txt === "/" ) return null;
      if (txt === "0" && !(b.h > b.w * 1.25 && b.h < 80)) return null;
      if (f && (f.t === "ell" || f.t === "line")) return null; }
    return { txt, x: b.x0, y: b.y1, h: b.h };
  }

  /* ---------- reading and checking a line of working ---------- */
  const tidy = s => s.replace(/[xX*]/g, "×").replace(/[−–—]/g, "-").replace(/÷/g, "/").replace(/:/g, "/").replace(/,/g, "").replace(/\s+/g, "");
  function evalExpr(src) { // + - × / and brackets, normal order of operations. Never shown to the child.
    const s = src.replace(/×/g, "*"); let i = 0;
    const num = () => { const m = /^\d*\.?\d+/.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]); };
    const atom = () => { if (s[i] === "(") { i++; const v = add(); if (s[i] !== ")") throw 0; i++; return v; } if (s[i] === "-") { i++; return -atom(); } return num(); };
    const mul = () => { let v = atom(); while (s[i] === "*" || s[i] === "/") { const o = s[i++], r = atom(); v = o === "*" ? v * r : v / r; } return v; };
    const add = () => { let v = mul(); while (s[i] === "+" || s[i] === "-") { const o = s[i++], r = mul(); v = o === "+" ? v + r : v - r; } return v; };
    const v = add(); if (i !== s.length || !isFinite(v)) throw 0; return v;
  }
  const near = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
  function pathNumbers(q, answerVals) { // every number in the question and its worked steps
    const txt = [q.prompt, ...(q.steps || []), ...(q.hints || [])].join(" ").replace(/\*\*/g, "").replace(/(\d)[   ](?=\d{3}\b)/g, "$1");
    const set = new Set((txt.match(/\d*\.?\d+/g) || []).map(Number)); answerVals.forEach(v => set.add(v)); return set;
  }
  // returns {kind: "none" | "ok" | "done" | "wrong" | "offpath", ...}
  function checkLine(text, q, answerVals) {
    const t = tidy(text); if (!t.includes("=")) return { kind: "none" };
    const parts = t.split("=");
    if (parts.some(p => p === "")) return { kind: "none" }; // still writing
    let vals; try { vals = parts.map(evalExpr); } catch (e) { return { kind: "none" }; }
    for (let k = 1; k < vals.length; k++) if (!near(vals[k], vals[k - 1])) return { kind: "wrong", left: parts[k - 1].replace(/\*/g, "×").replace(/\//g, " ÷ ").replace(/([+\-×])/g, " $1 ") };
    const res = vals[vals.length - 1];
    if (answerVals.some(a => near(a, res))) return { kind: "done" };
    const P = pathNumbers(q, answerVals);
    if ([...P].some(p => near(p, res))) return { kind: "ok" };
    return { kind: "offpath" };
  }
  // neat display: spaces around + − × ÷ =
  const pretty = s => s.replace(/\s+/g, "").replace(/[xX*]/g, "×").replace(/-/g, "−").replace(/:/g, "÷").replace(/([+−×÷=])/g, " $1 ").replace(/\s+/g, " ").trim();
  return { recognise, checkLine, tidy, pretty, fitShape, sketchText };
})();
if (typeof module !== "undefined") module.exports = Pad;
