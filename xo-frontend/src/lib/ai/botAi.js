export function chooseAIMove(board, K, botSymbol = "O", level = "NORMAL") {
  const N = board.length;
  if (!Array.isArray(board) || N === 0) return null;

  const human = botSymbol === "X" ? "O" : "X";
  const b = board.map(row => row.slice());
  const LVL = String(level || "NORMAL").toUpperCase();

  const CFG_BY_LEVEL = {
    EASY:   { attackW: 0.80, defenseW: 1.00, nearWinOffBonus: 3,  nearLossDefBonus: 10, neutral: 0.15, jitter: 0.12, centerBias: 0.22 },
    NORMAL: { attackW: 1.00, defenseW: 1.30, nearWinOffBonus: 6,  nearLossDefBonus: 20, neutral: 0.15, jitter: 0.05, centerBias: 0.30 },
    HARD:   { attackW: 1.35, defenseW: 1.05, nearWinOffBonus: 10, nearLossDefBonus: 25, neutral: 0.20, jitter: 0.00, centerBias: 0.35 },
  };

  const CFG = CFG_BY_LEVEL[LVL] || CFG_BY_LEVEL.NORMAL;
  const DIRS = [[0,1],[1,0],[1,1],[1,-1]];
  const mid  = Math.floor(N / 2);
  const d2   = (r,c) => (r - mid) * (r - mid) + (c - mid) * (c - mid);

  const empties = [];
  for (let i=0;i<N;i++) for (let j=0;j<N;j++) if (!b[i][j]) empties.push([i,j]);
  if (!empties.length) return null;

  const countDir = (r, c, dr, dc, s) => {
    let i=r+dr, j=c+dc, k=0;
    while (i>=0 && i<N && j>=0 && j<N && b[i][j] === s) { k++; i+=dr; j+=dc; }
    return k;
  };

  const isWinIfPlace = (r, c, s) => {
    if (b[r][c]) return false;
    b[r][c] = s;
    const ok = DIRS.some(([dr,dc]) => 1 + countDir(r,c,dr,dc,s) + countDir(r,c,-dr,-dc,s) >= K);
    b[r][c] = null;
    return ok;
  };

  for (const [r,c] of empties) if (isWinIfPlace(r,c,botSymbol)) return [r,c];
  for (const [r,c] of empties) if (isWinIfPlace(r,c,human)) return [r,c];

  function getSoftBlockPattern(K) {
    if (K <= 3) return { L: 3, required: 2 };
    if (K === 4) return { L: 4, required: 2 };
    return { L: 5, required: 3 };
  }

  function intersectionBlock(sym, L, required) {
    const counts = new Map();
    const add = (r,c) => {
      const key = `${r},${c}`;
      const cur = counts.get(key);
      if (cur) cur.count += 1; else counts.set(key, { r, c, count: 1 });
    };
    for (const [dr,dc] of DIRS) {
      for (let sr=0; sr<N; sr++) for (let sc=0; sc<N; sc++) {
        const er = sr + (L-1)*dr, ec = sc + (L-1)*dc;
        if (er<0 || er>=N || ec<0 || ec>=N || sr<0 || sr>=N || sc<0 || sc>=N) continue;
        let cntSym = 0, cntOpp = 0;
        const blanks = [];
        for (let t=0; t<L; t++) {
          const r = sr + t*dr, c = sc + t*dc;
          const v = b[r][c];
          if (v === sym) cntSym++;
          else if (v == null) blanks.push([r,c]);
          else cntOpp++;
        }
        if (cntOpp > 0) continue;
        if (cntSym === required) blanks.forEach(([r,c]) => add(r,c));
      }
    }
    if (!counts.size) return null;
    let best = null;
    counts.forEach(v => {
      if (!b[v.r][v.c]) {
        if (!best
          || v.count > best.count
          || (v.count === best.count && d2(v.r,v.c) < d2(best.r,best.c))) best = v;
      }
    });
    return best ? { r:best.r, c:best.c, count:best.count } : null;
  }

  function createsKminus1AfterPlace(r, c, s, K) {
    if (b[r][c]) return false;
    for (const [dr,dc] of DIRS) {
      for (let t=0; t<K; t++) {
        const sr = r - t*dr, sc = c - t*dc;
        const er = sr + (K-1)*dr, ec = sc + (K-1)*dc;
        if (sr<0 || sr>=N || sc<0 || sc>=N || er<0 || er>=N || ec<0 || ec>=N) continue;
        let cntSelf = 0, cntOpp = 0, cntEmpty = 0;
        for (let w=0; w<K; w++) {
          const rr = sr + w*dr, cc = sc + w*dc;
          const v = (rr===r && cc===c) ? s : b[rr][cc];
          if (v === s) cntSelf++; else if (v == null) cntEmpty++; else cntOpp++;
        }
        if (cntOpp === 0 && cntSelf === K-1 && cntEmpty === 1) return true;
      }
    }
    return false;
  }

  function rankedWeightedMoves() {
    const jitter = () => (CFG.jitter ? (Math.random()*2-1) * CFG.jitter : 0);
    const ranks = [];
    for (const [r,c] of empties) {
      let score = 0;
      for (const [dr,dc] of DIRS) {
        for (let t=0; t<K; t++) {
          const sr = r - t*dr, sc = c - t*dc;
          const er = sr + (K-1)*dr, ec = sc + (K-1)*dc;
          if (sr<0 || sr>=N || sc<0 || sc>=N || er<0 || er>=N || ec<0 || ec>=N) continue;

          let cntSelf = 0, cntOpp = 0, cntEmpty = 0;
          for (let w=0; w<K; w++) {
            const rr = sr + w*dr, cc = sc + w*dc;
            const v  = (rr===r && cc===c) ? botSymbol : b[rr][cc];
            if (v === botSymbol) cntSelf++;
            else if (v === human) cntOpp++;
            else cntEmpty++;
          }

          if (cntSelf > 0 && cntOpp > 0) {
          } else if (cntSelf > 0 && cntOpp === 0) {
            let w = 1 + (cntSelf / K);
            if (cntSelf === K-1) w += CFG.nearWinOffBonus;
            score += w * CFG.attackW;
          } else if (cntOpp > 0 && cntSelf === 0) {
            let w = 1 + (cntOpp / K);
            if (cntOpp === K-1) w += CFG.nearLossDefBonus;
            score += w * CFG.defenseW;
          } else {
            score += CFG.neutral;
          }
        }
      }
      const centerBonus = CFG.centerBias / (1 + Math.sqrt(d2(r,c)));
      score += centerBonus;
      score *= (1 + (CFG.jitter ? jitter() : 0));
      const mkNear = createsKminus1AfterPlace(r,c,botSymbol,K);
      ranks.push({ r, c, score, mkNear });
    }
    ranks.sort((a,b) => (b.score - a.score) || (d2(a.r,a.c) - d2(b.r,b.c)));
    return ranks;
  }

  const { L, required } = getSoftBlockPattern(K);
  const blk = intersectionBlock(human, L, required);
  const ranks = rankedWeightedMoves();
  const bestOff = ranks[0];

  function pickFromTop(ranks, k = 3) {
    const size = Math.min(k, ranks.length);
    const weights = [0.7, 0.2, 0.1].slice(0, size);
    const sum = weights.reduce((a,b)=>a+b,0);
    let r = Math.random() * sum;
    for (let i=0;i<size;i++){ r-=weights[i]; if (r<=0) return i; }
    return 0;
  }

  if (LVL === "HARD") {
    if (!blk) return [bestOff.r, bestOff.c];
    if (bestOff.mkNear) return [bestOff.r, bestOff.c];
    if (blk.count >= 2) return [blk.r, blk.c];
    return [bestOff.r, bestOff.c];
  }

  if (LVL === "NORMAL") {
    if (blk && blk.count >= 2 && !bestOff.mkNear) return [blk.r, blk.c];
    return [bestOff.r, bestOff.c];
  }

  if (LVL === "EASY") {
    if (blk && blk.count >= 3 && !bestOff.mkNear) return [blk.r, blk.c];

    if (blk && blk.count === 2 && !bestOff.mkNear && Math.random() < 0.6) {
      return [blk.r, blk.c];
    }

    const idx = pickFromTop(ranks, 3);
    const pick = ranks[idx] || bestOff;
    return [pick.r, pick.c];
  }

  return [bestOff.r, bestOff.c];
}
