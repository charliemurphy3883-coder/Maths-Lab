/* Coop's Maths Lab — question engine + learning model.
   Everything here is plain data in / plain data out so it can be tested and saved.
   Levels: 1 = Year 4 (late Stage 2), 2 = Year 5 (Stage 3), 3 = Year 6 / extension. */
(function (root) {
  "use strict";
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const coN = d => { let n; do { n = ri(1, d - 1); } while (gcd(n, d) !== 1); return n; };
  const r6 = n => Math.round(n * 1e6) / 1e6;
  // Australian style: spaces for 5+ digit numbers (12 345), none for 4 digits (4567)
  function fmt(n) {
    if (typeof n !== "number" || !isFinite(n)) return String(n);
    const neg = n < 0; n = r6(Math.abs(n));
    let [i, d] = n.toString().split(".");
    if (i.length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (neg ? "−" : "") + i + (d ? "." + d : "");
  }
  const money = c => "$" + (c / 100).toFixed(2);
  const NAMES = ["Cooper", "Mia", "Jack", "Ava", "Leo", "Zara", "Noah", "Isla", "Max", "Ruby", "Ollie", "Chloe"];
  const COLS = ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands", "millions", "ten millions", "hundred millions"];
  const YEAR = { 1: "Year 4", 2: "Year 5", 3: "Year 6+" };

  /* ---------- answers ---------- */
  const A = {
    num: v => ({ t: "num", v: r6(v) }),
    frac: (n, d, simplest) => ({ t: "frac", n, d, simplest: !!simplest }),
    time: (h, m) => ({ t: "time", h, m }),
    choice: (o, c) => ({ t: "choice", o, c }),
  };
  function parseNum(s) {
    s = String(s).replace(/[\s,$%° ]/g, "").replace(/−/g, "-");
    if (/^-?\d+\/\d+$/.test(s)) { const [n, d] = s.split("/").map(Number); return d ? n / d : NaN; }
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }
  function check(ans, input) {
    if (input == null || input === "") return false;
    if (ans.t === "choice") return Number(input) === ans.c;
    if (ans.t === "num") { const v = parseNum(input); return !isNaN(v) && Math.abs(v - ans.v) < 1e-6; }
    if (ans.t === "time") {
      const s = String(input).replace(/\s/g, "");
      let m = s.match(/^(\d{1,2}):?(\d{2})$/); if (!m) return false;
      return Number(m[1]) === ans.h && Number(m[2]) === ans.m;
    }
    if (ans.t === "frac") {
      const s = String(input).replace(/\s/g, "");
      const m = s.match(/^(\d+)\/(\d+)$/);
      if (!m) { if (ans.simplest) return ans.d === 1 && parseNum(s) === ans.n; const v = parseNum(s); return !isNaN(v) && Math.abs(v - ans.n / ans.d) < 1e-6; }
      const n = +m[1], d = +m[2]; if (!d) return false;
      if (ans.simplest) return n === ans.n && d === ans.d;
      return n * ans.d === ans.n * d;
    }
    return false;
  }
  function answerText(ans) {
    if (ans.t === "num") return fmt(ans.v);
    if (ans.t === "frac") return ans.d === 1 ? String(ans.n) : `${ans.n}/${ans.d}`;
    if (ans.t === "time") return `${String(ans.h).padStart(2, "0")}:${String(ans.m).padStart(2, "0")}`;
    if (ans.t === "choice") return ans.o[ans.c];
  }

  /* ---------- skills (NSW Mathematics K–10 Syllabus 2022, Stage 3 outcomes) ---------- */
  const SKILLS = [
    { id: "place", code: "MA3-RN-01", name: "Place value & rounding", strand: "Number", base: 40 },
    { id: "addsub", code: "MA3-AR-01", name: "Adding & subtracting", strand: "Number", base: 60 },
    { id: "mult", code: "MA3-MR-01", name: "Multiplying", strand: "Number", base: 70 },
    { id: "div", code: "MA3-MR-01", name: "Dividing", strand: "Number", base: 70 },
    { id: "order", code: "MA3-MR-02", name: "Order of operations", strand: "Number", base: 60 },
    { id: "patterns", code: "MA3-MR-02", name: "Number sentences & patterns", strand: "Algebra", base: 60 },
    { id: "decimals", code: "MA3-RN-02", name: "Decimals", strand: "Number", base: 50 },
    { id: "fractions", code: "MA3-RQF-01", name: "Fractions", strand: "Number", base: 50 },
    { id: "fracqty", code: "MA3-RQF-02", name: "Fractions of amounts", strand: "Number", base: 50 },
    { id: "percent", code: "MA3-RN-03", name: "Percentages", strand: "Number", base: 60 },
    { id: "area", code: "MA3-2DS-02/03", name: "Perimeter & area", strand: "Measurement", base: 60 },
    { id: "angles", code: "MA3-GM-03", name: "Angles", strand: "Space", base: 50 },
    { id: "time", code: "MA3-NSM-02", name: "Time", strand: "Measurement", base: 60 },
    { id: "volume", code: "MA3-3DS-02", name: "Volume & capacity", strand: "Measurement", base: 60 },
    { id: "chance", code: "MA3-CHAN-01", name: "Chance", strand: "Statistics", base: 50 },
    { id: "puzzle", code: "MAO-WM-01", name: "Problem solving & lateral thinking", strand: "Working mathematically", base: 120 },
  ];
  const SKILL = Object.fromEntries(SKILLS.map(s => [s.id, s]));

  /* ---------- lessons: the method for each skill ---------- */
  const LESSONS = {
    place: ["Every digit sits in a column: ones, tens, hundreds, thousands, ten thousands, hundred thousands, millions.", "A digit's value = the digit × its column. The 7 in 47 302 is in the thousands column, so it's worth 7000.", "To round: find the column you're rounding to, then look at the digit just to its right.", "5 or more → round up. Less than 5 → round down. Everything after becomes zero."],
    addsub: ["Line the numbers up by place value: ones under ones, tens under tens.", "Start from the ones column and work left.", "Adding: if a column makes 10 or more, carry 1 to the next column.", "Subtracting: if the top digit is too small, trade 1 from the next column (it becomes 10 here).", "Check: estimate first by rounding, and see if your answer is close."],
    mult: ["Know your tables: they are the building blocks.", "Split (partition) the bigger number: 47 × 6 = 40 × 6 + 7 × 6 = 240 + 42 = 282.", "For two 2-digit numbers, split one of them: 34 × 27 = 34 × 20 + 34 × 7.", "Multiplying by 10 moves every digit one place left; by 100, two places."],
    div: ["Division shares into equal groups. Think: what times the divisor gets close?", "Use tables in chunks: 156 ÷ 6 → 6 × 20 = 120, 36 left, 6 × 6 = 36, so 20 + 6 = 26.", "A remainder is what's left over that can't make a full group.", "In word problems decide: do we need one more group (round up) or only full groups (round down)?"],
    order: ["Work in this order: Brackets first.", "Then × and ÷, working left to right.", "Then + and −, working left to right.", "Rewrite the problem after each step so you don't lose track."],
    patterns: ["In a number sentence, the box is just a missing number: use the opposite operation to find it.", "Patterns: find the rule by looking at how each term changes (add 4? double?).", "Working backwards: undo each step in reverse order (if they added 7 last, subtract 7 first).", "For the nth term of an 'add the same each time' pattern: first term + (n − 1) × the jump."],
    decimals: ["Digits after the point are tenths, hundredths, thousandths.", "Compare decimals column by column from the left. Add zeros so they are the same length: 0.4 = 0.400.", "To add or subtract, line up the decimal points.", "× 10 moves digits one place left (bigger); ÷ 10 moves them one place right."],
    fractions: ["The bottom number (denominator) is how many equal parts; the top (numerator) is how many we have.", "Equivalent fractions: multiply or divide top and bottom by the same number.", "To simplify, divide top and bottom by the biggest number that goes into both.", "To compare or add, make the denominators the same first."],
    fracqty: ["To find a fraction of an amount: divide by the bottom, multiply by the top.", "3/4 of 32: 32 ÷ 4 = 8 (that's one quarter), 8 × 3 = 24.", "If you know a part, work backwards: 1/5 of a number is 12, so the whole is 12 × 5."],
    percent: ["Per cent means 'out of 100'. 25% = 25/100 = 0.25.", "50% is half, 25% is a quarter, 10% is a tenth.", "To find 10%, divide by 10. Then build other percentages: 30% = 3 × 10%, 5% = half of 10%.", "Discount: work out the percentage, then subtract it from the price."],
    area: ["Perimeter is the distance around the outside: add every side.", "Area of a rectangle = length × width, in square units (cm²).", "Area of a triangle = half of base × height.", "Odd shapes: split them into rectangles, find each area, then add."],
    angles: ["A right angle is 90°, a straight line is 180°, a full turn is 360°.", "Angles on a straight line add to 180°. Angles around a point add to 360°.", "The angles inside a triangle add to 180°.", "Acute < 90°, right = 90°, obtuse between 90° and 180°, reflex > 180°."],
    time: ["24-hour time: after midday add 12 to the hour. 3:45 pm → 15:45.", "There are 60 minutes in an hour, not 100!", "For time between two clock times, jump to the next whole hour, then count on.", "When adding time, add hours and minutes separately; if minutes reach 60, carry an hour."],
    volume: ["Volume is how much space something takes up, measured in cubes (cm³).", "Volume of a rectangular prism = length × width × height.", "1 cm³ holds 1 mL. 1000 mL = 1 L.", "If you know the volume and two sides, divide to find the missing side."],
    chance: ["Probability = number of ways it can happen ÷ total number of outcomes.", "It can be written as a fraction, decimal or percentage, from 0 (impossible) to 1 (certain).", "Probability of NOT happening = 1 − probability of happening.", "Expected results: probability × number of tries."],
    puzzle: ["Read the question twice. Lateral thinking puzzles often hide a trick in the wording.", "Draw a picture or make a table.", "Try small numbers first and look for a pattern.", "Check your answer actually fits every clue."],
  };

  /* ---------- question generators ---------- */
  const G = {};
  const Q = (o) => Object.assign({ hints: [], steps: [], unit: "", diagram: null }, o);

  G.place = L => {
    const digits = L === 1 ? ri(4, 5) : L === 2 ? ri(6, 7) : ri(7, 9);
    if (Math.random() < 0.5) {
      // value of a digit
      let N, p, d, s;
      for (let k = 0; k < 50; k++) {
        N = ri(10 ** (digits - 1), 10 ** digits - 1); s = String(N); p = ri(1, digits - 1); d = Number(s[s.length - 1 - p]);
        if (d !== 0 && s.split("").filter(c => c === String(d)).length === 1) break;
      }
      const v = d * 10 ** p;
      return Q({ prompt: `What is the value of the digit **${d}** in **${fmt(N)}**?`, answer: A.num(v),
        hints: [`Find the ${d}. Which column is it in? Count columns from the right: ones, tens, hundreds…`, `The ${d} is in the **${COLS[p]}** column.`, `So it's worth ${d} × ${fmt(10 ** p)}.`],
        steps: [`Columns from the right: ones, tens, hundreds, thousands…`, `The ${d} is in the ${COLS[p]} column.`, `Value = ${d} × ${fmt(10 ** p)} = **${fmt(v)}**`] });
    }
    // rounding
    const N = ri(10 ** (digits - 1), 10 ** digits - 1);
    const kMax = Math.min(digits - 1, L === 1 ? 3 : L === 2 ? 4 : 6), kMin = L === 1 ? 1 : 2;
    const k = ri(kMin, Math.max(kMin, kMax)), P = 10 ** k, r = Math.round(N / P) * P;
    const lo = Math.floor(N / P) * P, next = Math.floor(N / (P / 10)) % 10;
    return Q({ prompt: `Round **${fmt(N)}** to the nearest **${fmt(P)}**.`, answer: A.num(r),
      hints: [`Which two multiples of ${fmt(P)} is ${fmt(N)} between?`, `It's between ${fmt(lo)} and ${fmt(lo + P)}. Look at the digit just right of the ${COLS[k]} column.`, `That digit is ${next}. 5 or more rounds up, less than 5 rounds down.`],
      steps: [`${fmt(N)} is between ${fmt(lo)} and ${fmt(lo + P)}.`, `The digit after the ${COLS[k]} column is ${next}.`, next >= 5 ? `${next} is 5 or more, so round up.` : `${next} is less than 5, so round down.`, `Answer: **${fmt(r)}**`] });
  };

  G.addsub = L => {
    const big = L === 1 ? [100, 9999] : L === 2 ? [1000, 99999] : [10000, 999999];
    const add = Math.random() < 0.5;
    let a = ri(...big), b = ri(big[0], Math.floor(big[1] / (add ? 1 : 1)));
    if (!add && b > a) [a, b] = [b, a];
    if (!add && a === b) a += ri(10, 99);
    const res = add ? a + b : a - b;
    const word = L >= 2 && Math.random() < 0.5;
    const n = pick(NAMES);
    let prompt;
    if (word && add) prompt = pick([`A stadium had **${fmt(a)}** people on Saturday and **${fmt(b)}** on Sunday. How many people over the weekend?`, `${n}'s town planted **${fmt(a)}** trees last year and **${fmt(b)}** this year. How many trees altogether?`]);
    else if (word) prompt = pick([`A library had **${fmt(a)}** books and gave away **${fmt(b)}**. How many books are left?`, `A game needs **${fmt(a)}** points to win. ${n} has **${fmt(b)}**. How many more points are needed?`]);
    else prompt = `**${fmt(a)} ${add ? "+" : "−"} ${fmt(b)}**`;
    const ans = A.num(res), unit = "";
    const est = (x) => { const p = 10 ** (String(x).length - 1); return Math.round(x / p) * p; };
    return Q({ prompt, answer: ans, unit,
      hints: [`Estimate first: about ${fmt(est(a))} ${add ? "+" : "−"} ${fmt(est(b))}.`, `Line them up by place value and start with the ones column.`, add ? `If a column adds to 10 or more, carry the 1 to the next column.` : `If the top digit is smaller, trade 1 from the column to the left.`],
      steps: [`Estimate: ${fmt(est(a))} ${add ? "+" : "−"} ${fmt(est(b))} ≈ ${fmt(add ? est(a) + est(b) : est(a) - est(b))}`, `Line up the columns:  ${fmt(a)} ${add ? "+" : "−"} ${fmt(b)}`, `Work right to left, ${add ? "carrying" : "trading"} where needed.`, `Answer: **${answerText(ans)}**`] });
  };

  G.mult = L => {
    let a, b, word = false;
    const v = Math.random();
    if (L === 1) { if (v < 0.4) { a = ri(3, 12); b = ri(3, 12); } else { a = ri(12, 99); b = ri(3, 9); } }
    else if (L === 2) { if (v < 0.35) { a = ri(101, 999); b = ri(3, 9); } else if (v < 0.5) { a = ri(12, 999); b = pick([10, 100, 1000]); } else { a = ri(12, 49); b = ri(12, 39); } }
    else { if (v < 0.5) { a = ri(101, 499); b = ri(12, 49); } else { a = ri(25, 99); b = ri(25, 99); word = true; } }
    const res = a * b;
    let prompt = `**${fmt(a)} × ${fmt(b)}**`;
    if (word) prompt = pick([`A school orders **${a}** boxes of pencils with **${b}** pencils in each. How many pencils?`, `${pick(NAMES)} reads **${b}** pages every day for **${a}** days. How many pages?`]);
    let steps, hints;
    if (b === 10 || b === 100 || b === 1000) {
      const z = String(b).length - 1;
      hints = [`Multiplying by ${b} moves every digit ${z} place${z > 1 ? "s" : ""} to the left.`, `Add ${z} zero${z > 1 ? "s" : ""} to the end of ${a}.`];
      steps = [`× ${b}: digits move ${z} place${z > 1 ? "s" : ""} left.`, `${fmt(a)} → **${fmt(res)}**`];
    } else if (b < 10 && a < 13) {
      hints = [`This is a times-table fact.`, `Count in ${b}s, or use a fact you know: ${a} × ${b - 1} = ${a * (b - 1)}, then add one more ${a}.`];
      steps = [`${a} × ${b - 1} = ${a * (b - 1)}`, `${a * (b - 1)} + ${a} = **${res}**`];
    } else if (b < 10) {
      const parts = String(a).split("").map((d, i, arr) => Number(d) * 10 ** (arr.length - 1 - i)).filter(x => x);
      hints = [`Split ${a} into ${parts.join(" + ")}.`, `Multiply each part by ${b}: ${parts.map(p => `${p} × ${b}`).join(", ")}.`, `Add the answers together.`];
      steps = [`${a} = ${parts.join(" + ")}`, ...parts.map(p => `${fmt(p)} × ${b} = ${fmt(p * b)}`), `${parts.map(p => fmt(p * b)).join(" + ")} = **${fmt(res)}**`];
    } else {
      const t = Math.floor(b / 10) * 10, o = b % 10;
      hints = [`Split ${b} into ${t} + ${o}.`, `Work out ${a} × ${t} and ${a} × ${o}.`, `Add the two answers.`];
      steps = [`${b} = ${t} + ${o}`, `${fmt(a)} × ${t} = ${fmt(a * t)}`, `${fmt(a)} × ${o} = ${fmt(a * o)}`, `${fmt(a * t)} + ${fmt(a * o)} = **${fmt(res)}**`];
    }
    return Q({ prompt, answer: A.num(res), hints, steps });
  };

  G.div = L => {
    const v = Math.random();
    if (L === 1 || v < 0.45) {
      const d = L === 1 ? ri(2, 9) : ri(3, 9), q = L === 1 ? ri(3, 15) : L === 2 ? ri(12, 150) : ri(120, 1200);
      const n = d * q;
      const chunk = Math.floor(q / 10) * 10;
      return Q({ prompt: `**${fmt(n)} ÷ ${d}**`, answer: A.num(q),
        hints: [`How many ${d}s make ${fmt(n)}? Think of your ${d} times table.`, chunk ? `${d} × ${chunk} = ${fmt(d * chunk)}. How much is left?` : `${d} × what = ${n}?`, chunk ? `${fmt(n - d * chunk)} ÷ ${d} = ${q - chunk}. Add the chunks.` : `Count up in ${d}s.`],
        steps: chunk ? [`Take a big chunk: ${d} × ${chunk} = ${fmt(d * chunk)}`, `Left over: ${fmt(n)} − ${fmt(d * chunk)} = ${fmt(n - d * chunk)}`, `${fmt(n - d * chunk)} ÷ ${d} = ${q - chunk}`, `${chunk} + ${q - chunk} = **${fmt(q)}**`] : [`${d} × ${q} = ${n}`, `So ${n} ÷ ${d} = **${q}**`] });
    }
    // remainder word problems
    const d = L === 2 ? ri(4, 9) : ri(12, 30), q = L === 2 ? ri(6, 40) : ri(8, 40), r = ri(1, d - 1), n = d * q + r;
    const up = Math.random() < 0.5;
    const prompt = up ? `**${n}** students are going on an excursion. Each bus holds **${d}**. How many buses are needed?`
      : `${pick(NAMES)} has **${n}** eggs and packs them into cartons of **${d}**. How many **full** cartons?`;
    const ans = up ? q + 1 : q;
    return Q({ prompt, answer: A.num(ans),
      hints: [`Work out ${n} ÷ ${d}.`, `${d} × ${q} = ${d * q}, with ${r} left over.`, up ? `The ${r} left over still need a seat!` : `The ${r} left over can't fill a carton.`],
      steps: [`${n} ÷ ${d} = ${q} remainder ${r}`, up ? `The ${r} extra students need another bus, so round up.` : `Only full cartons count, so ignore the remainder.`, `Answer: **${ans}**`] });
  };

  G.order = L => {
    let expr, steps, val;
    for (let k = 0; k < 100; k++) {
      const a = ri(2, 12), b = ri(2, 12), c = ri(2, 12), d = ri(2, 9), e = ri(2, 6);
      const form = L === 1 ? ri(0, 2) : L === 2 ? ri(3, 5) : ri(6, 8);
      if (form === 0) { expr = `${a} + ${b} × ${c}`; steps = [`× first: ${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`]; val = a + b * c; }
      if (form === 1) { const m = b * c; expr = `${a + m} − ${m} ÷ ${c}`; steps = [`÷ first: ${m} ÷ ${c} = ${b}`, `${a + m} − ${b} = ${a + m - b}`]; val = a + m - b; }
      if (form === 2) { expr = `(${a} + ${b}) × ${c}`; steps = [`Brackets first: ${a} + ${b} = ${a + b}`, `${a + b} × ${c} = ${(a + b) * c}`]; val = (a + b) * c; }
      if (form === 3) { const m = c * d; expr = `${a} × ${b} − ${m} ÷ ${d}`; steps = [`${a} × ${b} = ${a * b}`, `${m} ÷ ${d} = ${c}`, `${a * b} − ${c} = ${a * b - c}`]; val = a * b - c; }
      if (form === 4) { const x = Math.max(a, b) + ri(1, 9), y = Math.min(a, b); expr = `(${x} − ${y}) × ${c} + ${d}`; steps = [`Brackets: ${x} − ${y} = ${x - y}`, `${x - y} × ${c} = ${(x - y) * c}`, `${(x - y) * c} + ${d} = ${(x - y) * c + d}`]; val = (x - y) * c + d; }
      if (form === 5) { expr = `${a} + ${b} × ${c} − ${d}`; steps = [`× first: ${b} × ${c} = ${b * c}`, `Left to right: ${a} + ${b * c} = ${a + b * c}`, `${a + b * c} − ${d} = ${a + b * c - d}`]; val = a + b * c - d; }
      if (form === 6) { const m = e * ri(2, 6); const inner = c + d; expr = `${a} + ${b} × (${c} + ${d}) − ${m} ÷ ${e}`; steps = [`Brackets: ${c} + ${d} = ${inner}`, `${b} × ${inner} = ${b * inner}`, `${m} ÷ ${e} = ${m / e}`, `${a} + ${b * inner} − ${m / e} = ${a + b * inner - m / e}`]; val = a + b * inner - m / e; }
      if (form === 7) { const s = a * d; expr = `${s} ÷ ${d} × ${b} + ${c}`; steps = [`× and ÷ left to right: ${s} ÷ ${d} = ${a}`, `${a} × ${b} = ${a * b}`, `${a * b} + ${c} = ${a * b + c}`]; val = a * b + c; }
      if (form === 8) { const x = Math.max(c, d) + ri(2, 8), y = Math.min(c, d); expr = `${a} × (${x} − ${y}) − ${b} × ${e}`; steps = [`Brackets: ${x} − ${y} = ${x - y}`, `${a} × ${x - y} = ${a * (x - y)}`, `${b} × ${e} = ${b * e}`, `${a * (x - y)} − ${b * e} = ${a * (x - y) - b * e}`]; val = a * (x - y) - b * e; }
      if (val >= 0) break;
    }
    steps[steps.length - 1] = steps[steps.length - 1].replace(/= (\d+)$/, "= **$1**");
    return Q({ prompt: `**${expr}**`, answer: A.num(val),
      hints: [`Remember the order: Brackets, then × and ÷, then + and −.`, steps[0], steps.length > 2 ? steps[1] : `Now finish it off.`], steps });
  };

  G.patterns = L => {
    const v = Math.random();
    if (L === 1) {
      if (v < 0.5) { const a = ri(3, 12), b = ri(3, 12); return Q({ prompt: `**${a} × ☐ = ${a * b}**  What number goes in the box?`, answer: A.num(b), hints: [`Use the opposite of ×.`, `${a * b} ÷ ${a} = ?`], steps: [`The opposite of × is ÷.`, `${a * b} ÷ ${a} = **${b}**`] }); }
      const t = pick([100, 250, 500, 1000]), a = ri(11, t - 11);
      return Q({ prompt: `**☐ + ${a} = ${t}**  What number goes in the box?`, answer: A.num(t - a), hints: [`Use the opposite of +.`, `${t} − ${a} = ?`], steps: [`The opposite of + is −.`, `${t} − ${a} = **${t - a}**`] });
    }
    if (L === 2) {
      if (v < 0.5) {
        const s = ri(2, 20), d = ri(3, 12), n = 5, seq = Array.from({ length: n }, (_, i) => s + i * d);
        return Q({ prompt: `What comes next?  **${seq.slice(0, 4).join(", ")}, …**`, answer: A.num(seq[4]), hints: [`How much does it go up by each time?`, `${seq[1]} − ${seq[0]} = ${d}.`], steps: [`Each step adds ${d}.`, `${seq[3]} + ${d} = **${seq[4]}**`] });
      }
      const a = ri(3, 9), b = ri(1, 15), x = ri(3, 12), r = a * x - b;
      return Q({ prompt: `**☐ × ${a} − ${b} = ${r}**  What number goes in the box?`, answer: A.num(x), hints: [`Work backwards. Undo the "− ${b}" first.`, `${r} + ${b} = ${r + b}. Now undo the × ${a}.`], steps: [`Undo − ${b}: ${r} + ${b} = ${r + b}`, `Undo × ${a}: ${r + b} ÷ ${a} = **${x}**`] });
    }
    if (v < 0.5) {
      const x = ri(4, 25), m = pick([2, 3, 4]), add = ri(3, 19), res = x * m + add;
      return Q({ prompt: `${pick(NAMES)} thinks of a number, multiplies it by **${m}**, then adds **${add}**. The answer is **${res}**. What was the number?`, answer: A.num(x),
        hints: [`Work backwards: undo the last step first.`, `${res} − ${add} = ${res - add}.`, `Now undo × ${m}.`], steps: [`Undo + ${add}: ${res} − ${add} = ${res - add}`, `Undo × ${m}: ${res - add} ÷ ${m} = **${x}**`] });
    }
    const s = ri(1, 12), d = ri(2, 9), n = ri(12, 40), t = s + (n - 1) * d;
    return Q({ prompt: `A pattern goes **${s}, ${s + d}, ${s + 2 * d}, ${s + 3 * d}, …**  What is the **${n}th** number?`, answer: A.num(t),
      hints: [`The jump each time is ${d}.`, `To get to the ${n}th number you make ${n - 1} jumps from the first.`, `${s} + ${n - 1} × ${d}`], steps: [`Jump = ${d}`, `Number of jumps = ${n} − 1 = ${n - 1}`, `${s} + ${n - 1} × ${d} = ${s} + ${(n - 1) * d} = **${t}**`] });
  };

  G.decimals = L => {
    const v = Math.random();
    const dp = L === 1 ? 1 : L === 2 ? 2 : 3, S = 10 ** dp;
    if (v < 0.35) {
      // which is largest
      let opts;
      for (let k = 0; k < 50; k++) {
        const whole = ri(0, L === 1 ? 9 : 3);
        const set = new Set();
        while (set.size < (L === 1 ? 2 : 3)) { const places = ri(1, dp); set.add((whole + ri(1, 10 ** places - 1) / 10 ** places).toFixed(places).replace(/0+$/, "")); }
        opts = [...set].filter(s => !s.endsWith("."));
        if (opts.length === set.size && new Set(opts.map(Number)).size === opts.length) break;
      }
      const vals = opts.map(Number), best = vals.indexOf(Math.max(...vals));
      const w = Math.max(...opts.map(o => (o.split(".")[1] || "").length));
      return Q({ prompt: `Which is the **largest**?`, answer: A.choice(opts, best),
        hints: [`Compare the whole numbers first, then tenths, then hundredths.`, `Add zeros so they're the same length: ${opts.map(o => Number(o).toFixed(w)).join(", ")}.`],
        steps: [`Make them the same length: ${opts.map(o => Number(o).toFixed(w)).join(", ")}`, `Compare digit by digit from the left.`, `Largest: **${opts[best]}**`] });
    }
    if (v < 0.75 || L === 1) {
      const a = ri(S, 20 * S), b = ri(S / 10 + 1, 10 * S), add = Math.random() < 0.5 || a <= b;
      const res = add ? a + b : a - b;
      const fa = (a / S).toFixed(dp), fb = (b / S).toFixed(dp);
      return Q({ prompt: `**${fa} ${add ? "+" : "−"} ${fb}**`, answer: A.num(res / S),
        hints: [`Line up the decimal points.`, `Work it like whole numbers: ${a} ${add ? "+" : "−"} ${b} = ${res}, then put the point back.`],
        steps: [`Line up the points:  ${fa} ${add ? "+" : "−"} ${fb}`, `Without the points: ${a} ${add ? "+" : "−"} ${b} = ${res}`, `Put the point back (${dp} decimal place${dp > 1 ? "s" : ""}): **${fmt(res / S)}**`] });
    }
    const a = ri(1, 999) / 10 ** ri(1, 3), m = pick([10, 100, 1000]), divide = L === 3 && Math.random() < 0.5;
    const res = divide ? a / m : a * m, z = String(m).length - 1;
    return Q({ prompt: `**${fmt(a)} ${divide ? "÷" : "×"} ${m}**`, answer: A.num(res),
      hints: [`${divide ? "÷" : "×"} ${m} moves every digit ${z} place${z > 1 ? "s" : ""} to the ${divide ? "right (smaller)" : "left (bigger)"}.`],
      steps: [`${divide ? "÷" : "×"} ${m}: digits move ${z} place${z > 1 ? "s" : ""} ${divide ? "right" : "left"}.`, `${fmt(a)} → **${fmt(res)}**`] });
  };

  G.fractions = L => {
    const v = Math.random();
    if (L === 1) {
      if (v < 0.5) {
        const d = pick([2, 3, 4, 5]), n = coN(d), k = ri(2, 4);
        return Q({ prompt: `**${n}/${d} = ☐/${d * k}**  What number goes in the box?`, answer: A.num(n * k),
          hints: [`What did ${d} get multiplied by to make ${d * k}?`, `Do the same to the top: ${n} × ${k}.`], steps: [`${d} × ${k} = ${d * k}`, `So the top is ${n} × ${k} = **${n * k}**`] });
      }
      const d = ri(5, 12), a = ri(1, d - 1); let b = ri(1, d - 1); if (b === a) b = a === 1 ? 2 : a - 1;
      const opts = [`${a}/${d}`, `${b}/${d}`];
      return Q({ prompt: `Which is **bigger**?`, answer: A.choice(opts, a > b ? 0 : 1), hints: [`The bottoms are the same, so the pieces are the same size.`, `More pieces = bigger.`], steps: [`Same denominator (${d}).`, `Compare the tops: ${a} and ${b}.`, `Bigger: **${a > b ? opts[0] : opts[1]}**`] });
    }
    if (L === 2) {
      if (v < 0.35) {
        const d = pick([4, 6, 8, 9, 10, 12, 15, 16]), n0 = ri(1, d - 1), g = gcd(n0, d);
        if (g === 1) return G.fractions(L);
        return Q({ prompt: `Write **${n0}/${d}** in simplest form.`, answer: A.frac(n0 / g, d / g, true),
          hints: [`What's the biggest number that goes into both ${n0} and ${d}?`, `${g} goes into both.`], steps: [`Biggest common factor of ${n0} and ${d} is ${g}.`, `${n0} ÷ ${g} = ${n0 / g},  ${d} ÷ ${g} = ${d / g}`, `Answer: **${n0 / g}/${d / g}**`] });
      }
      if (v < 0.65) {
        const d = ri(5, 12), a = ri(1, d - 2), b = ri(1, d - 1 - a);
        return Q({ prompt: `**${a}/${d} + ${b}/${d}**  (write as a fraction, e.g. 3/8)`, answer: A.frac(a + b, d, false),
          hints: [`The bottoms are the same, so just add the tops.`], steps: [`Same denominator: add the tops.`, `${a} + ${b} = ${a + b}`, `Answer: **${a + b}/${d}**`] });
      }
      const d = pick([2, 3, 4, 5]), k = pick([2, 3]), D = d * k, a = ri(1, d - 1); let B = ri(1, D - 1); if (B === a * k) B = B + 1 < D ? B + 1 : B - 1;
      const opts = [`${a}/${d}`, `${B}/${D}`];
      return Q({ prompt: `Which is **bigger**?`, answer: A.choice(opts, a * k > B ? 0 : 1), hints: [`Make the bottoms the same.`, `${a}/${d} = ${a * k}/${D}.`], steps: [`${a}/${d} = ${a * k}/${D}`, `Compare ${a * k}/${D} with ${B}/${D}.`, `Bigger: **${a * k > B ? opts[0] : opts[1]}**`] });
    }
    if (v < 0.5) {
      const d = pick([2, 3, 4, 5]), k = pick([2, 3, 4]), D = d * k, a = coN(d), b = coN(D);
      const n = a * k + b;
      return Q({ prompt: `**${a}/${d} + ${b}/${D}**  (write as a fraction)`, answer: A.frac(n, D, false),
        hints: [`Change ${a}/${d} so it has a bottom of ${D}.`, `${a}/${d} = ${a * k}/${D}. Now add the tops.`], steps: [`${a}/${d} = ${a * k}/${D}`, `${a * k}/${D} + ${b}/${D} = **${n}/${D}**`, n > D ? `(That's more than 1 whole: ${Math.floor(n / D)} and ${n % D}/${D})` : ``].filter(Boolean) });
    }
    const w = ri(1, 5), d = ri(2, 9), n = coN(d);
    return Q({ prompt: `Write **${w} ${n}/${d}** as an improper fraction.`, answer: A.frac(w * d + n, d, false),
      hints: [`How many ${d}ths are in ${w} whole${w > 1 ? "s" : ""}?`, `${w} × ${d} = ${w * d}. Then add the ${n}.`], steps: [`${w} wholes = ${w} × ${d} = ${w * d} ${d}ths`, `${w * d} + ${n} = ${w * d + n}`, `Answer: **${w * d + n}/${d}**`] });
  };

  G.fracqty = L => {
    if (L === 1) {
      const d = pick([2, 3, 4, 5, 10]), q = ri(2, 12), tot = d * q;
      return Q({ prompt: `What is **1/${d} of ${tot}**?`, answer: A.num(q), hints: [`1/${d} means share into ${d} equal groups.`, `${tot} ÷ ${d}`], steps: [`1/${d} of ${tot} = ${tot} ÷ ${d} = **${q}**`] });
    }
    if (L === 2) {
      const d = pick([3, 4, 5, 6, 8, 10]); let n = ri(2, d - 1); while (gcd(n, d) !== 1) n = ri(1, d - 1); const q = ri(3, 15), tot = d * q;
      return Q({ prompt: `What is **${n}/${d} of ${tot}**?`, answer: A.num(n * q), hints: [`First find 1/${d}: ${tot} ÷ ${d}.`, `1/${d} is ${q}. Now multiply by ${n}.`], steps: [`1/${d} of ${tot} = ${tot} ÷ ${d} = ${q}`, `${n}/${d} = ${n} × ${q} = **${n * q}**`] });
    }
    if (Math.random() < 0.5) {
      const d = pick([4, 5, 8, 10, 12]), n = coN(d), q = ri(3, 12), tot = d * q;
      return Q({ prompt: `**${n}/${d}** of the **${tot}** students in Year 5 ride a bike to school. How many students **don't** ride a bike?`, answer: A.num(tot - n * q),
        hints: [`Find ${n}/${d} of ${tot} first.`, `${tot} ÷ ${d} = ${q}, × ${n} = ${n * q} ride. Who's left?`], steps: [`1/${d} of ${tot} = ${q}`, `${n}/${d} = ${n * q} ride bikes`, `${tot} − ${n * q} = **${tot - n * q}** don't`] });
    }
    const d = pick([3, 4, 5, 6, 8]), n = coN(d), part = n * ri(2, 12), whole = part / n * d;
    return Q({ prompt: `**${n}/${d}** of a number is **${part}**. What is the number?`, answer: A.num(whole),
      hints: [`If ${n}/${d} is ${part}, what is 1/${d}?`, `1/${d} = ${part} ÷ ${n} = ${part / n}. The whole is ${d} of those.`], steps: [`1/${d} = ${part} ÷ ${n} = ${part / n}`, `Whole = ${part / n} × ${d} = **${whole}**`] });
  };

  G.percent = L => {
    const v = Math.random();
    if (L === 1) {
      if (v < 0.5) { const n = ri(1, 9); return Q({ prompt: `Write **${n}/10** as a decimal.`, answer: A.num(n / 10), hints: [`Tenths are the first place after the point.`], steps: [`${n} tenths = **0.${n}**`] }); }
      const p = pick([50, 25, 10]), tot = (100 / p) * ri(2, 12);
      return Q({ prompt: `What is **${p}% of ${tot}**?`, answer: A.num(tot * p / 100), hints: [`${p}% is ${p === 50 ? "half" : p === 25 ? "a quarter" : "a tenth"}.`, `${tot} ÷ ${100 / p}`], steps: [`${p}% = 1/${100 / p}`, `${tot} ÷ ${100 / p} = **${tot * p / 100}**`] });
    }
    if (L === 2) {
      if (v < 0.35) {
        const f = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [1, 20], [9, 20]]);
        const p = f[0] * 100 / f[1];
        return Q({ prompt: `Write **${f[0]}/${f[1]}** as a percentage.`, answer: A.num(p), unit: "%", hints: [`Percent means "out of 100".`, `What do you multiply ${f[1]} by to get 100? Do the same to the top.`], steps: [`${f[1]} × ${100 / f[1]} = 100`, `${f[0]} × ${100 / f[1]} = ${p}`, `${f[0]}/${f[1]} = ${p}/100 = **${p}%**`] });
      }
      if (v < 0.5) { const d = ri(1, 99); return Q({ prompt: `Write **${(d / 100).toFixed(2)}** as a percentage.`, answer: A.num(d), unit: "%", hints: [`× 100 to turn a decimal into a percentage.`], steps: [`${(d / 100).toFixed(2)} × 100 = **${d}%**`] }); }
      const p = pick([10, 20, 25, 50, 75]), tot = ri(2, 20) * (p === 25 || p === 75 ? 4 : 10);
      const ten = tot / 10;
      return Q({ prompt: `What is **${p}% of ${tot}**?`, answer: A.num(tot * p / 100),
        hints: p % 25 === 0 ? [`${p}% = ${p}/100 = ${p / 25}/4.`, `A quarter of ${tot} is ${tot / 4}.`] : [`Start with 10%: ${tot} ÷ 10 = ${ten}.`, `${p}% is ${p / 10} lots of 10%.`],
        steps: p % 25 === 0 ? [`25% of ${tot} = ${tot} ÷ 4 = ${tot / 4}`, `${p}% = ${p / 25} × ${tot / 4} = **${tot * p / 100}**`] : [`10% of ${tot} = ${ten}`, `${p}% = ${p / 10} × ${ten} = **${tot * p / 100}**`] });
    }
    if (v < 0.5) {
      const p = pick([5, 15, 30, 35, 40, 45, 60, 65, 70, 85, 90, 95]), tot = ri(2, 30) * 20;
      const ten = tot / 10, res = tot * p / 100;
      return Q({ prompt: `What is **${p}% of ${tot}**?`, answer: A.num(res), hints: [`Find 10% first: ${tot} ÷ 10 = ${ten}.`, `5% is half of 10% = ${ten / 2}.`, `Build ${p}% from 10%s and 5%s.`],
        steps: [`10% = ${ten}, 5% = ${ten / 2}`, `${p}% = ${Math.floor(p / 10)} × 10%${p % 10 ? " + 5%" : ""}`, `= ${Math.floor(p / 10) * ten}${p % 10 ? " + " + ten / 2 : ""} = **${fmt(res)}**`] });
    }
    const p = pick([10, 20, 25, 30, 40, 50]), price = ri(4, 30) * 10, off = price * p / 100;
    return Q({ prompt: `A ${pick(["basketball", "jacket", "game", "pair of shoes", "scooter"])} costs **$${price}**. It's **${p}% off**. What is the sale price in dollars?`, answer: A.num(price - off),
      hints: [`Work out ${p}% of $${price} first.`, `${p}% of ${price} = $${off}. That's the discount.`, `Take the discount away from the price.`], steps: [`${p}% of $${price} = $${off}`, `$${price} − $${off} = **$${price - off}**`] });
  };

  G.area = L => {
    const v = Math.random();
    if (L === 1) {
      const w = ri(3, 12), h = ri(2, 9);
      if (v < 0.5) return Q({ prompt: `What is the **perimeter** of this rectangle?`, answer: A.num(2 * (w + h)), unit: "cm", diagram: { k: "rect", w, h, wl: `${w} cm`, hl: `${h} cm` },
        hints: [`Perimeter = distance all the way around.`, `There are two sides of ${w} cm and two of ${h} cm.`], steps: [`${w} + ${h} + ${w} + ${h}`, `= 2 × ${w + h} = **${2 * (w + h)} cm**`] });
      return Q({ prompt: `What is the **area** of this rectangle?`, answer: A.num(w * h), unit: "cm²", diagram: { k: "rect", w, h, wl: `${w} cm`, hl: `${h} cm` },
        hints: [`Area of a rectangle = length × width.`, `${w} × ${h}`], steps: [`Area = ${w} × ${h} = **${w * h} cm²**`] });
    }
    if (L === 2) {
      if (v < 0.4) { const w = ri(6, 25), h = ri(4, 15); return Q({ prompt: `A rectangle has an area of **${w * h} m²** and a width of **${h} m**. How long is it?`, answer: A.num(w), unit: "m", diagram: { k: "rect", w, h, wl: `? m`, hl: `${h} m` }, hints: [`Area = length × width, so length = area ÷ width.`, `${w * h} ÷ ${h}`], steps: [`length = ${w * h} ÷ ${h} = **${w} m**`] }); }
      if (v < 0.7) { const w = ri(8, 30), h = ri(5, 20); return Q({ prompt: `A garden bed is **${w} m** long and **${h} m** wide. What is its **area**?`, answer: A.num(w * h), unit: "m²", diagram: { k: "rect", w, h, wl: `${w} m`, hl: `${h} m` }, hints: [`Area = length × width.`, `${w} × ${h}: split it up if it helps.`], steps: [`${w} × ${h} = **${w * h} m²**`] }); }
      const s = ri(3, 15), per = 4 * s; return Q({ prompt: `A square has a perimeter of **${per} cm**. What is its **area**?`, answer: A.num(s * s), unit: "cm²", hints: [`All 4 sides of a square are equal. Find one side first.`, `${per} ÷ 4 = ${s} cm.`], steps: [`Side = ${per} ÷ 4 = ${s} cm`, `Area = ${s} × ${s} = **${s * s} cm²**`] });
    }
    if (v < 0.4) { const b = ri(2, 15) * 2, h = ri(3, 14); return Q({ prompt: `What is the **area** of this triangle?`, answer: A.num(b * h / 2), unit: "cm²", diagram: { k: "tri", b, h, bl: `${b} cm`, hl: `${h} cm` }, hints: [`A triangle is half of a rectangle.`, `Area = base × height ÷ 2.`], steps: [`base × height = ${b} × ${h} = ${b * h}`, `÷ 2 = **${b * h / 2} cm²**`] }); }
    const W = ri(8, 16), H = ri(6, 12), cw = ri(2, W - 4), ch = ri(2, H - 3);
    const area = W * H - cw * ch;
    return Q({ prompt: `What is the **area** of this L-shape? (All corners are right angles.)`, answer: A.num(area), unit: "cm²", diagram: { k: "lshape", W, H, cw, ch },
      hints: [`Think of it as a big rectangle with a corner cut out.`, `Big rectangle: ${W} × ${H} = ${W * H}. Cut-out corner: ${cw} × ${ch} = ${cw * ch}.`], steps: [`Whole rectangle: ${W} × ${H} = ${W * H} cm²`, `Missing corner: ${cw} × ${ch} = ${cw * ch} cm²`, `${W * H} − ${cw * ch} = **${area} cm²**`] });
  };

  G.angles = L => {
    const v = Math.random();
    if (L === 1) {
      if (v < 0.5) {
        const a = ri(1, 35) * 5, x = 180 - a;
        return Q({ prompt: `The angles sit on a **straight line**. Find **x**.`, answer: A.num(x), unit: "°", diagram: { k: "line", a, x: "x" }, hints: [`Angles on a straight line add up to 180°.`, `180 − ${a}`], steps: [`Straight line = 180°`, `x = 180 − ${a} = **${x}°**`] });
      }
      const ang = pick([ri(10, 85), 90, ri(95, 175), ri(185, 350)]);
      const opts = ["Acute", "Right", "Obtuse", "Reflex"], c = ang < 90 ? 0 : ang === 90 ? 1 : ang < 180 ? 2 : 3;
      return Q({ prompt: `What type of angle is **${ang}°**?`, answer: A.choice(opts, c), hints: [`Acute < 90°, right = 90°, obtuse between 90° and 180°, reflex > 180°.`], steps: [`${ang}° is ${["less than 90°", "exactly 90°", "between 90° and 180°", "more than 180°"][c]}.`, `So it's **${opts[c]}**.`] });
    }
    if (L === 2) {
      if (v < 0.5) {
        const a = ri(4, 20) * 5, b = ri(4, 20) * 5, x = 360 - a - b;
        return Q({ prompt: `These angles go all the way **around a point**. Find **x**.`, answer: A.num(x), unit: "°", diagram: { k: "point", a, b, x: "x" }, hints: [`Angles around a point add up to 360°.`, `${a} + ${b} = ${a + b}. How much more to 360?`], steps: [`Around a point = 360°`, `${a} + ${b} = ${a + b}`, `x = 360 − ${a + b} = **${x}°**`] });
      }
      const a = ri(10, 80), x = 90 - a;
      return Q({ prompt: `A right angle is split into two parts. One part is **${a}°**. What is the other part?`, answer: A.num(x), unit: "°", hints: [`A right angle is 90°.`, `90 − ${a}`], steps: [`Right angle = 90°`, `90 − ${a} = **${x}°**`] });
    }
    if (v < 0.6) {
      const a = ri(25, 90), b = ri(20, 155 - a), x = 180 - a - b;
      return Q({ prompt: `Find the missing angle **x** in the triangle.`, answer: A.num(x), unit: "°", diagram: { k: "triangle", a, b, x: "x" }, hints: [`The angles inside a triangle add up to 180°.`, `${a} + ${b} = ${a + b}.`], steps: [`Triangle angles = 180°`, `${a} + ${b} = ${a + b}`, `x = 180 − ${a + b} = **${x}°**`] });
    }
    const top = ri(10, 70) * 2, base = (180 - top) / 2;
    return Q({ prompt: `An **isosceles** triangle has a top angle of **${top}°**. The two bottom angles are equal. What is **one** bottom angle?`, answer: A.num(base), unit: "°", diagram: { k: "triangle", a: "x", b: "x", top },
      hints: [`All three angles add to 180°.`, `180 − ${top} = ${180 - top}, shared equally between two angles.`], steps: [`180 − ${top} = ${180 - top}`, `${180 - top} ÷ 2 = **${base}°**`] });
  };

  G.time = L => {
    const v = Math.random();
    const two = n => String(n).padStart(2, "0");
    const t12 = (h, m) => `${h % 12 || 12}:${two(m)} ${h < 12 ? "am" : "pm"}`;
    if (L === 1) {
      if (v < 0.5) { const h = ri(13, 23), m = ri(0, 11) * 5; return Q({ prompt: `Write **${t12(h, m)}** in 24-hour time.`, answer: A.time(h, m), hints: [`After midday, add 12 to the hour.`, `${h - 12} + 12 = ${h}`], steps: [`pm → add 12: ${h - 12} + 12 = ${h}`, `Answer: **${two(h)}:${two(m)}**`] }); }
      const h = ri(1, 4), m = ri(1, 11) * 5; return Q({ prompt: `How many minutes in **${h} h ${m} min**?`, answer: A.num(h * 60 + m), unit: "min", hints: [`There are 60 minutes in an hour.`, `${h} × 60 = ${h * 60}. Add the ${m}.`], steps: [`${h} × 60 = ${h * 60}`, `${h * 60} + ${m} = **${h * 60 + m} min**`] });
    }
    if (L === 2) {
      const h1 = ri(7, 14), m1 = ri(0, 11) * 5, dur = ri(4, 30) * 5, e = h1 * 60 + m1 + dur, h2 = Math.floor(e / 60), m2 = e % 60;
      const toHour = 60 - m1;
      return Q({ prompt: `A movie starts at **${t12(h1, m1)}** and finishes at **${t12(h2, m2)}**. How many minutes long is it?`, answer: A.num(dur), unit: "min",
        hints: [`Jump from ${t12(h1, m1)} to the next whole hour first.`, m1 ? `That's ${toHour} minutes to ${t12(h1 + 1, 0)}.` : `Count the whole hours, then the extra minutes.`, `Then count on to ${t12(h2, m2)}.`],
        steps: m1 && dur > toHour ? [`${t12(h1, m1)} → ${t12(h1 + 1, 0)} = ${toHour} min`, `${t12(h1 + 1, 0)} → ${t12(h2, m2)} = ${dur - toHour} min`, `${toHour} + ${dur - toHour} = **${dur} min**`] : [`Count on from ${t12(h1, m1)} to ${t12(h2, m2)}.`, `= **${dur} min**`] });
    }
    const h1 = ri(6, 19), m1 = ri(0, 59), dh = ri(1, 3), dm = ri(5, 55), e = (h1 * 60 + m1 + dh * 60 + dm) % 1440, h2 = Math.floor(e / 60), m2 = e % 60;
    return Q({ prompt: `A train leaves at **${two(h1)}:${two(m1)}**. The trip takes **${dh} h ${dm} min**. What time does it arrive? (24-hour time)`, answer: A.time(h2, m2),
      hints: [`Add the hours first, then the minutes.`, `${two(h1)}:${two(m1)} + ${dh} h = ${two(h1 + dh)}:${two(m1)}.`, `Now add ${dm} min. If the minutes go past 60, carry an hour.`],
      steps: [`+ ${dh} h → ${two(h1 + dh)}:${two(m1)}`, `+ ${dm} min → ${m1 + dm >= 60 ? `${m1} + ${dm} = ${m1 + dm} min = 1 h ${m1 + dm - 60} min` : `${m1} + ${dm} = ${m1 + dm} min`}`, `Arrives **${two(h2)}:${two(m2)}**`] });
  };

  G.volume = L => {
    const v = Math.random();
    if (L === 1) { const l = ri(2, 5), w = ri(2, 4), h = ri(2, 4); return Q({ prompt: `This prism is built from 1 cm cubes. It is **${l}** long, **${w}** wide and **${h}** high. How many cubes?`, answer: A.num(l * w * h), unit: "cubes", diagram: { k: "prism", l, w, h, cubes: true }, hints: [`Count one layer first: ${l} × ${w}.`, `There are ${h} layers.`], steps: [`One layer: ${l} × ${w} = ${l * w}`, `${h} layers: ${l * w} × ${h} = **${l * w * h}**`] }); }
    if (L === 2) {
      if (v < 0.5) { const l = ri(3, 12), w = ri(2, 9), h = ri(2, 10); return Q({ prompt: `Find the **volume** of the box.`, answer: A.num(l * w * h), unit: "cm³", diagram: { k: "prism", l, w, h, ll: `${l} cm`, wl: `${w} cm`, hl: `${h} cm` }, hints: [`Volume = length × width × height.`, `${l} × ${w} = ${l * w}, then × ${h}.`], steps: [`${l} × ${w} = ${l * w}`, `${l * w} × ${h} = **${l * w * h} cm³**`] }); }
      const L2 = ri(2, 19) / 2 + (Math.random() < 0.3 ? 0.25 : 0); return Q({ prompt: `How many **mL** in **${fmt(L2)} L**?`, answer: A.num(L2 * 1000), unit: "mL", hints: [`1 L = 1000 mL.`, `${fmt(L2)} × 1000`], steps: [`1 L = 1000 mL`, `${fmt(L2)} × 1000 = **${fmt(L2 * 1000)} mL**`] });
    }
    if (v < 0.5) { const l = ri(3, 12), w = ri(2, 10), h = ri(2, 10), V = l * w * h; return Q({ prompt: `A box has a volume of **${V} cm³**. It is **${l} cm** long and **${w} cm** wide. How high is it?`, answer: A.num(h), unit: "cm", diagram: { k: "prism", l, w, h, ll: `${l} cm`, wl: `${w} cm`, hl: `? cm` }, hints: [`Volume = l × w × h. Find l × w first.`, `${l} × ${w} = ${l * w}. Now ${V} ÷ ${l * w}.`], steps: [`${l} × ${w} = ${l * w}`, `h = ${V} ÷ ${l * w} = **${h} cm**`] }); }
    const l = ri(2, 6) * 10, w = ri(1, 4) * 10, h = ri(1, 5) * 10, V = l * w * h;
    return Q({ prompt: `A fish tank is **${l} cm × ${w} cm × ${h} cm**. How many **litres** of water fill it? (1 cm³ = 1 mL)`, answer: A.num(V / 1000), unit: "L", diagram: { k: "prism", l, w, h, ll: `${l} cm`, wl: `${w} cm`, hl: `${h} cm` },
      hints: [`Find the volume in cm³ first.`, `${l} × ${w} × ${h} = ${fmt(V)} cm³ = ${fmt(V)} mL.`, `1000 mL = 1 L, so ÷ 1000.`], steps: [`Volume = ${l} × ${w} × ${h} = ${fmt(V)} cm³`, `= ${fmt(V)} mL`, `÷ 1000 = **${fmt(V / 1000)} L**`] });
  };

  G.chance = L => {
    const v = Math.random();
    if (L === 1) {
      if (v < 0.5) { const n = ri(1, 6); return Q({ prompt: `A normal dice is rolled. What is the chance of rolling a **${n}**? (write as a fraction)`, answer: A.frac(1, 6, false), hints: [`How many sides does a dice have?`, `Only one side shows ${n}.`], steps: [`6 equally likely outcomes, 1 of them is a ${n}.`, `Chance = **1/6**`] }); }
      const r = ri(1, 9), b = ri(1, 9);
      if (r === b) return G.chance(L);
      const opts = ["Red", "Blue"]; return Q({ prompt: `A bag has **${r} red** and **${b} blue** marbles. Which colour are you **more likely** to pull out?`, answer: A.choice(opts, r > b ? 0 : 1), diagram: { k: "bag", counts: { red: r, blue: b } }, hints: [`More marbles of a colour = more likely.`], steps: [`${r} red vs ${b} blue.`, `**${r > b ? "Red" : "Blue"}** has more, so it's more likely.`] });
    }
    const r = ri(1, 8), b = ri(1, 8), g = ri(1, 8), tot = r + b + g;
    if (L === 2 || v < 0.4) {
      const c = pick(["red", "blue", "green"]), k = { red: r, blue: b, green: g }[c];
      if (L === 3) return Q({ prompt: `A bag has **${r} red**, **${b} blue** and **${g} green** marbles. What is the chance of **not** getting ${c}? (fraction)`, answer: A.frac(tot - k, tot, false), diagram: { k: "bag", counts: { red: r, blue: b, green: g } }, hints: [`Total marbles: ${tot}.`, `Not ${c} = ${tot} − ${k} = ${tot - k}.`], steps: [`Total = ${tot}`, `Not ${c} = ${tot - k}`, `Chance = **${tot - k}/${tot}**`] });
      return Q({ prompt: `A bag has **${r} red**, **${b} blue** and **${g} green** marbles. What is the chance of pulling out a **${c}** one? (fraction)`, answer: A.frac(k, tot, false), diagram: { k: "bag", counts: { red: r, blue: b, green: g } },
        hints: [`Chance = ways it can happen ÷ total.`, `There are ${k} ${c} out of ${tot} altogether.`], steps: [`Total = ${r} + ${b} + ${g} = ${tot}`, `${c}: ${k}`, `Chance = **${k}/${tot}**`] });
    }
    const sectors = pick([4, 5, 8, 10]), red = ri(1, sectors - 1), spins = sectors * ri(4, 20);
    return Q({ prompt: `A spinner has **${sectors}** equal parts and **${red}** of them are red. If you spin it **${spins}** times, about how many times would you expect red?`, answer: A.num(spins * red / sectors),
      hints: [`Chance of red = ${red}/${sectors}.`, `Expected = chance × number of spins.`], steps: [`Chance of red = ${red}/${sectors}`, `${spins} ÷ ${sectors} = ${spins / sectors}`, `× ${red} = **${spins * red / sectors}**`] });
  };

  /* ---------- problem solving & lateral thinking ---------- */
  const PUZZLES = [
    [1, "A farmer has 17 sheep. All but 9 run away. How many sheep are left?", 9, ["Read 'all but 9' very carefully."], "'All but 9' means every sheep except 9 ran away, so 9 are left."],
    [1, "How many months of the year have 28 days?", 12, ["Does January have at least 28 days?"], "Every month has at least 28 days, so all 12 do."],
    [1, "You're in a race and you overtake the person in 2nd place. What place are you in now?", 2, ["You took their spot, not the leader's."], "You passed 2nd place, so you're now 2nd (not 1st!)."],
    [1, "There are 3 apples. You take away 2. How many apples do YOU have?", 2, ["The question asks what YOU have."], "You took 2, so you have 2."],
    [1, "A family has 4 brothers. Each brother has 1 sister. How many children are in the family?", 5, ["Is it the same sister for everyone?"], "They all share the same sister: 4 brothers + 1 sister = 5."],
    [1, "A 12 m ribbon is cut into 1 m pieces. How many cuts are needed?", 11, ["Try a 3 m ribbon first. How many cuts?"], "The last piece doesn't need a cut: 12 pieces need 11 cuts."],
    [1, "How many eggs can you put into an empty basket?", 1, ["After the first egg, is the basket still empty?"], "Only one: after that the basket isn't empty any more!"],
    [1, "A brick weighs 1 kg plus half a brick. How many kg does a whole brick weigh?", 2, ["If half a brick + 1 kg = a whole brick, what is half a brick?"], "The other half of the brick must weigh 1 kg, so the brick is 2 kg."],
    [1, "How many squares are there on a 2 by 2 grid? (Count the big one too!)", 5, ["Count the small squares, then the big one."], "4 small + 1 big = 5."],
    [2, "Divide 30 by a half, then add 10. What do you get?", 70, ["Dividing by a half is not the same as halving.", "How many halves fit into 30?"], "30 ÷ ½ = 60 (60 halves in 30). 60 + 10 = 70."],
    [2, "Two fathers and two sons go fishing. Each catches one fish, but only 3 fish are caught. How many people went fishing?", 3, ["Can someone be a father AND a son?"], "Grandad, Dad and son: Dad is both a father and a son. 3 people."],
    [2, "A snail is at the bottom of a 10 m well. Each day it climbs 3 m, each night it slides back 2 m. On which day does it reach the top?", 8, ["It gains 1 m per full day, but watch the last day.", "Where is it at the start of day 8?"], "After 7 days it's at 7 m. On day 8 it climbs 3 m to 10 m and is out before sliding back."],
    [2, "A fence is 10 m long with a post every 2 m, including both ends. How many posts?", 6, ["Draw it: 0, 2, 4, …"], "Posts at 0, 2, 4, 6, 8, 10 = 6 posts."],
    [2, "What is the smallest number that 2, 3 and 4 all divide into with no remainder?", 12, ["Try the multiples of 4."], "4, 8, 12… 12 is the first that 3 also divides."],
    [2, "I'm a 2-digit number. My digits add to 9, I'm a multiple of 5, and my tens digit is bigger than 5. What am I?", 90, ["Multiples of 5 end in 0 or 5.", "List them and check the digit sum."], "Digits add to 9 and end in 0 or 5: 45 or 90. Tens digit > 5, so 90."],
    [2, "What is 1 + 2 + 3 + … + 10?", 55, ["Pair them up: 1 + 10, 2 + 9, …"], "5 pairs that each make 11: 5 × 11 = 55."],
    [2, "How many 1 cm cubes make one big 3 cm cube?", 27, ["How many in one layer? How many layers?"], "3 × 3 = 9 per layer, 3 layers: 27."],
    [2, "A triangle has one line drawn from the top corner down to the bottom side. How many triangles can you see now?", 3, ["Count the two small ones, then the big one."], "2 small triangles + the big original = 3."],
    [3, "5 machines make 5 toys in 5 minutes. How many minutes would 100 machines take to make 100 toys?", 5, ["How long does ONE machine take to make ONE toy?"], "Each machine makes 1 toy in 5 minutes, so 100 machines make 100 toys in 5 minutes."],
    [3, "A bat and a ball cost $1.10 together. The bat costs $1.00 more than the ball. How many cents does the ball cost?", 5, ["It's not 10c! Check: bat would be $1.10, total $1.20.", "Ball + (ball + 100c) = 110c"], "Ball = 5c, bat = $1.05. Together $1.10, and the bat is $1 more."],
    [3, "How many squares (of all sizes) are on a 3 by 3 grid?", 14, ["Count 1×1, then 2×2, then 3×3."], "9 small + 4 medium (2×2) + 1 big = 14."],
    [3, "Pages in a book are numbered 1 to 20. How many times is the digit 1 printed?", 12, ["List 1, 10, 11, 12… and remember 11 has two 1s."], "1, 10, 11 (two), 12–19 (eight): 1 + 1 + 2 + 8 = 12."],
    [3, "Writing all the numbers from 1 to 100, how many times do you write the digit 9?", 20, ["Count 9 in the ones place, then in the tens place."], "Ones place: 9, 19, …, 99 = 10. Tens place: 90–99 = 10. Total 20."],
    [3, "Half of a number is 4 more than a third of it. What is the number?", 24, ["Try numbers that halve and third nicely: 6, 12, 18, 24…"], "24: half is 12, a third is 8. 12 − 8 = 4. ✓"],
    [3, "Mia is 3 times as old as her brother. In 4 years she'll be twice as old as him. How old is Mia now?", 12, ["Try brother = 2, 3, 4… and check the 'in 4 years' clue."], "Brother 4, Mia 12. In 4 years: 8 and 16, and 16 is twice 8. ✓"],
    [3, "A frog starts at 0. Each turn it jumps forward 3 then back 1. On which turn does it first reach 10?", 5, ["After each full turn it's 2 further on.", "Where is it at the start of turn 5?"], "Start of turn 5 it's at 8. It jumps to 11, passing 10, before jumping back."],
    [3, "A clock strikes 6 times at 6 o'clock, taking 5 seconds (equal gaps). How many seconds to strike 12 at 12 o'clock?", 11, ["How many GAPS are there between 6 strikes?"], "6 strikes have 5 gaps → 1 second each. 12 strikes have 11 gaps → 11 seconds."],
  ];
  G.puzzle = L => {
    if (Math.random() < 0.55) {
      const pool = PUZZLES.filter(p => p[0] === L);
      const p = pick(pool);
      return Q({ prompt: p[1], answer: A.num(p[2]), hints: [...p[3], `Think again about exactly what the question asks.`], steps: [p[4], `Answer: **${p[2]}**`], puzzleId: PUZZLES.indexOf(p) });
    }
    const v = Math.random();
    if (L === 1) {
      const c = ri(2, 7), d = ri(2, 6);
      return Q({ prompt: `A yard has **${c} chickens** and **${d} dogs**. How many **legs** altogether?`, answer: A.num(c * 2 + d * 4), hints: [`Chickens have 2 legs, dogs have 4.`], steps: [`Chickens: ${c} × 2 = ${c * 2}`, `Dogs: ${d} × 4 = ${d * 4}`, `${c * 2} + ${d * 4} = **${c * 2 + d * 4}**`] });
    }
    if (L === 2) {
      if (v < 0.5) {
        const n = ri(4, 9), h = n * (n - 1) / 2;
        return Q({ prompt: `**${n}** friends meet and every person shakes hands with every other person once. How many handshakes?`, answer: A.num(h),
          hints: [`Try it with 3 people first (A–B, A–C, B–C).`, `The first person shakes ${n - 1} hands, the next ${n - 2} new ones, …`], steps: [`${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(" + ")}`, `= **${h}**`] });
      }
      const m = ri(5, 40), S = 3 * m;
      return Q({ prompt: `Three numbers in a row (like 4, 5, 6) add up to **${S}**. What is the **biggest** one?`, answer: A.num(m + 1),
        hints: [`The middle number is the average.`, `${S} ÷ 3 = ${m}, so that's the middle one.`], steps: [`Middle = ${S} ÷ 3 = ${m}`, `Numbers: ${m - 1}, ${m}, ${m + 1}`, `Biggest = **${m + 1}**`] });
    }
    if (v < 0.5) {
      const heads = ri(8, 20), dogs = ri(2, heads - 2), legs = (heads - dogs) * 2 + dogs * 4;
      return Q({ prompt: `A farm has chickens and dogs. There are **${heads} heads** and **${legs} legs**. How many **dogs**?`, answer: A.num(dogs),
        hints: [`Pretend every animal is a chicken first. How many legs would that be?`, `${heads} × 2 = ${heads * 2} legs. There are ${legs - heads * 2} extra legs.`, `Each dog adds 2 extra legs.`], steps: [`All chickens: ${heads} × 2 = ${heads * 2} legs`, `Extra legs: ${legs} − ${heads * 2} = ${legs - heads * 2}`, `Each dog has 2 extra: ${legs - heads * 2} ÷ 2 = **${dogs}** dogs`] });
    }
    const target = ri(6, 30) * 10;
    let best = null;
    for (let f = 0; f * 50 <= target; f++) { const rest = target - f * 50; if (rest % 20 === 0) { const n = f + rest / 20; if (!best || n < best.n) best = { n, f, t: rest / 20 }; } }
    if (!best) return G.puzzle(L);
    return Q({ prompt: `Using only **20c** and **50c** coins, what is the **fewest** coins that make exactly **${money(target)}**?`, answer: A.num(best.n),
      hints: [`Use as many 50c coins as you can, but the rest must be made from 20c.`, `Try different numbers of 50c coins and check the leftover divides by 20.`], steps: [`${best.f} × 50c = ${money(best.f * 50)}`, `${best.t} × 20c = ${money(best.t * 20)}`, `Total coins: ${best.f} + ${best.t} = **${best.n}**`] });
  };

  function generate(skill, level) {
    const q = G[skill](level);
    const sk = SKILL[skill];
    q.skill = skill; q.level = level; q.target = Math.round(sk.base * (1 + 0.25 * (level - 1)));
    q.id = Math.random().toString(36).slice(2, 10);
    return q;
  }

  /* ---------- learner model ---------- */
  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dayNum = s => Math.round(Date.UTC(...s.split("-").map((x, i) => i === 1 ? x - 1 : +x)) / 864e5);
  function newState(name = "Cooper", startLevel = 2) {
    const skills = {};
    SKILLS.forEach(s => { skills[s.id] = { level: s.id === "puzzle" ? 1 : startLevel, mastery: 40, seen: 0, correct: 0, recent: [], lastSeen: null, levelUps: 0 }; });
    return { v: 1, created: today(), name, dailyCount: 12, skills, days: {}, points: 0, badges: {}, streak: { count: 0, last: null }, inARow: 0, bestInARow: 0, puzzlesSolved: 0, bestTime: null, history: [], pin: null };
  }
  // help: 0 none, 1 one hint, 2 two+ hints, 3 shown the solution; tries: attempts used (1 or 2)
  function record(state, q, ok, help, tries, secs) {
    const s = state.skills[q.skill];
    let credit = ok ? [1, 0.7, 0.4, 0][Math.min(help, 3)] : 0;
    if (ok && tries > 1) credit = Math.min(credit, 0.5);
    s.seen++; if (ok) s.correct++;
    s.mastery = Math.round(s.mastery * 0.8 + credit * 100 * 0.2);
    s.recent.push(credit >= 0.7 ? 1 : 0); if (s.recent.length > 6) s.recent.shift();
    s.lastSeen = today();
    const events = [];
    const last5 = s.recent.slice(-5);
    if (last5.length >= 5 && last5.reduce((a, b) => a + b, 0) >= 4 && s.level < 3) { s.level++; s.recent = []; s.levelUps++; s.mastery = 45; events.push({ type: "levelup", skill: q.skill, level: s.level }); }
    else { const last4 = s.recent.slice(-4); if (last4.length >= 4 && last4.reduce((a, b) => a + b, 0) <= 1 && s.level > 1) { s.level--; s.recent = []; s.mastery = 55; events.push({ type: "leveldown", skill: q.skill, level: s.level }); } }
    const fast = secs <= q.target;
    let pts = 0;
    if (ok) { pts = 10 * q.level + (help === 0 && tries === 1 ? 5 : 0) + (fast && help === 0 ? 3 : 0); if (help >= 3) pts = 2; else if (help > 0 || tries > 1) pts = Math.round(pts / 2); }
    state.points += pts;
    if (ok && help < 3) { state.inARow++; state.bestInARow = Math.max(state.bestInARow, state.inARow); } else state.inARow = 0;
    if (ok && q.skill === "puzzle") state.puzzlesSolved++;
    state.history.push({ d: today(), s: q.skill, l: q.level, ok: ok ? 1 : 0, h: help, t: Math.round(secs), p: pts });
    if (state.history.length > 1500) state.history.splice(0, state.history.length - 1500);
    return { pts, credit, fast, events };
  }
  function buildDaily(state, n) {
    n = n || state.dailyCount;
    const nPuz = n >= 16 ? 3 : 2;
    const t = dayNum(today());
    const scored = SKILLS.filter(s => s.id !== "puzzle").map(s => {
      const st = state.skills[s.id];
      const since = st.lastSeen ? t - dayNum(st.lastSeen) : 10;
      return { id: s.id, score: (100 - st.mastery) * 0.6 + Math.min(since, 10) * 6 + (st.seen < 3 ? 25 : 0) + Math.random() * 25 };
    }).sort((a, b) => b.score - a.score);
    const picks = [];
    let round = 0;
    while (picks.length < n - nPuz) { picks.push(scored[round % scored.length].id); round++; if (round >= scored.length * 2) round = 0; }
    const qs = shuffle(picks).map(id => generate(id, state.skills[id].level));
    for (let i = 0; i < nPuz; i++) { const pos = Math.round(((i + 1) * qs.length) / nPuz); qs.splice(pos, 0, generate("puzzle", state.skills.puzzle.level)); }
    return qs;
  }
  const BADGES = [
    { id: "first", name: "First Mission", desc: "Finish your first daily set" },
    { id: "streak3", name: "On a Roll", desc: "3-day streak" },
    { id: "streak7", name: "Week Warrior", desc: "7-day streak" },
    { id: "streak14", name: "Unstoppable", desc: "14-day streak" },
    { id: "streak30", name: "Maths Machine", desc: "30-day streak" },
    { id: "perfect", name: "Perfect Day", desc: "Every answer right in a daily set" },
    { id: "nohelp", name: "Solo Mission", desc: "Finish a daily set without any help" },
    { id: "row10", name: "Hot Streak", desc: "10 right in a row" },
    { id: "row25", name: "On Fire", desc: "25 right in a row" },
    { id: "levelup", name: "Level Up", desc: "Move up a level in any skill" },
    { id: "year5", name: "Year 5 Ready", desc: "Achieve Year 5 in every skill" },
    { id: "year6", name: "Year 6 Explorer", desc: "Reach Year 6+ in any skill" },
    { id: "allyear6", name: "Extension Legend", desc: "Every skill at Year 6+" },
    { id: "puzzle10", name: "Puzzler", desc: "Solve 10 puzzles" },
    { id: "puzzle50", name: "Mastermind", desc: "Solve 50 puzzles" },
    { id: "speedy", name: "Speed Demon", desc: "Beat your best daily-set time with 80%+ right" },
    { id: "pts1000", name: "1000 Club", desc: "Earn 1000 points" },
    { id: "pts5000", name: "High Scorer", desc: "Earn 5000 points" },
  ];
  const RANKS = [[0, "Rookie"], [500, "Explorer"], [1500, "Solver"], [3500, "Ace"], [7000, "Master"], [12000, "Legend"], [20000, "Grand Legend"]];
  function rank(points) { let r = RANKS[0], next = null; for (let i = 0; i < RANKS.length; i++) { if (points >= RANKS[i][0]) { r = RANKS[i]; next = RANKS[i + 1] || null; } } return { name: r[1], from: r[0], next: next ? { name: next[1], at: next[0] } : null }; }
  function award(state, ids) { const got = []; ids.forEach(id => { if (!state.badges[id]) { state.badges[id] = today(); got.push(BADGES.find(b => b.id === id)); } }); return got; }
  function checkBadges(state, extra = {}) {
    const ids = [];
    const lv = SKILLS.filter(s => s.id !== "puzzle").map(s => state.skills[s.id].level);
    if (state.inARow >= 10) ids.push("row10");
    if (state.inARow >= 25) ids.push("row25");
    if (SKILLS.some(s => state.skills[s.id].levelUps > 0)) ids.push("levelup");
    if (SKILLS.filter(s => s.id !== "puzzle").every(s => state.skills[s.id].level >= 3 || (state.skills[s.id].level === 2 && state.skills[s.id].mastery >= 70))) ids.push("year5");
    if (lv.some(l => l >= 3)) ids.push("year6");
    if (lv.every(l => l >= 3)) ids.push("allyear6");
    if (state.puzzlesSolved >= 10) ids.push("puzzle10");
    if (state.puzzlesSolved >= 50) ids.push("puzzle50");
    if (state.points >= 1000) ids.push("pts1000");
    if (state.points >= 5000) ids.push("pts5000");
    if (extra.finished) {
      ids.push("first");
      if (state.streak.count >= 3) ids.push("streak3");
      if (state.streak.count >= 7) ids.push("streak7");
      if (state.streak.count >= 14) ids.push("streak14");
      if (state.streak.count >= 30) ids.push("streak30");
      if (extra.perfect) ids.push("perfect");
      if (extra.nohelp) ids.push("nohelp");
      if (extra.speedy) ids.push("speedy");
    }
    return award(state, ids);
  }
  function finishDay(state, day) {
    const t = today();
    if (state.streak.last !== t) {
      const gap = state.streak.last ? dayNum(t) - dayNum(state.streak.last) : 99;
      state.streak.count = gap === 1 ? state.streak.count + 1 : 1;
      state.streak.last = t;
    }
    const acc = day.correct / day.total;
    day.stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
    let speedy = false;
    if (acc >= 0.8) { if (state.bestTime && day.timeSec < state.bestTime) speedy = true; if (!state.bestTime || day.timeSec < state.bestTime) state.bestTime = day.timeSec; }
    return checkBadges(state, { finished: true, perfect: day.correct === day.total, nohelp: day.helpUsed === 0, speedy });
  }
  // report for grown-ups
  function report(state) {
    return SKILLS.map(s => {
      const st = state.skills[s.id];
      const h = state.history.filter(x => x.s === s.id).slice(-20);
      const acc = h.length ? Math.round(100 * h.filter(x => x.ok).length / h.length) : null;
      let status;
      if (!h.length) status = "Not started";
      else if (st.level === 3 && st.mastery >= 60) status = "Extending (Year 6+)";
      else if (st.level === 3) status = "Achieved Year 5, working at Year 6";
      else if (st.level === 2 && st.mastery >= 70) status = "Achieved Year 5";
      else if (st.level === 2) status = "Working towards Year 5";
      else status = "Building Year 4 skills";
      return { ...s, level: st.level, year: YEAR[st.level], mastery: st.mastery, acc, attempts: st.seen, status };
    });
  }

  const API = { SKILLS, SKILL, LESSONS, YEAR, BADGES, RANKS, generate, check, answerText, fmt, newState, record, buildDaily, finishDay, checkBadges, rank, report, today, dayNum, PUZZLES };
  if (typeof module !== "undefined") module.exports = API; else root.MathsLab = API;
})(this);
