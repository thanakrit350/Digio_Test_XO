// ฟังก์ชันเลือกตาที่บอทจะลง
// board : กระดาน NxN (array 2 มิติ) ที่ตำแหน่งเป็น null/"X"/"O"
// K     : ต้องเรียงกี่ตัวถึงจะชนะ (3/4/5)
// botSymbol : สัญลักษณ์ของบอท ("X" หรือ "O")
// level : ระดับความยาก "EASY" | "NORMAL" | "HARD"
export function chooseAIMove(board, K, botSymbol = "O", level = "NORMAL") {
  const N = board.length;                                  // N = ขนาดบอร์ด (NxN)
  if (!Array.isArray(board) || N === 0) return null;       // ถ้าบอร์ดไม่ถูกต้อง ให้ยกเลิก

  const human = botSymbol === "X" ? "O" : "X";             // ฝั่งมนุษย์ = สัญลักษณ์ตรงข้ามกับบอท
  const b = board.map(row => row.slice());                 // b = สำเนาบอร์ด (ป้องกันแก้ของเดิมเวลาทดลองวาง)

  const LVL = String(level || "NORMAL").toUpperCase();     // แปลงระดับให้เป็นตัวพิมพ์ใหญ่
  // ค่าคอนฟิกต่อระดับบอท
  // attackW          : น้ำหนักคะแนนฝั่งบุก (เรา)
  // defenseW         : น้ำหนักคะแนนฝั่งรับ (กันคู่แข่ง)
  // nearWinOffBonus  : โบนัสถ้า "ในหน้าต่างนั้นเรามี K-1" (จ่อชนะ)
  // nearLossDefBonus : โบนัสถ้า "ในหน้าต่างนั้นคู่แข่งมี K-1" (จ่อแพ้ ต้องกันด่วน)
  // neutral          : แต้มพื้นฐานสำหรับหน้าต่างที่ยังโล่ง
  // jitter           : สุ่มแกว่งคะแนนเล็กน้อยให้ดูไม่เป็นบอทแข็งทื่อ (HARD=0)
  // centerBias       : ค่าบวกเพิ่มสำหรับช่องที่อยู่ใกล้ "จุดกึ่งกลาง" กระดาน (center bonus)
  const CFG_BY_LEVEL = {
    EASY:   { attackW: 1.0,  defenseW: 0.85, nearWinOffBonus: 4,  nearLossDefBonus: 10, neutral: 0.10, jitter: 0.15, centerBias: 0.25 },
    NORMAL: { attackW: 1.0,  defenseW: 1.30, nearWinOffBonus: 6,  nearLossDefBonus: 20, neutral: 0.15, jitter: 0.05, centerBias: 0.30 },
    HARD:   { attackW: 1.35, defenseW: 1.05, nearWinOffBonus: 10, nearLossDefBonus: 25, neutral: 0.20, jitter: 0.00, centerBias: 0.35 },
  };
  const CFG = CFG_BY_LEVEL[LVL] || CFG_BY_LEVEL.NORMAL;    // CFG = เซ็ตพารามิเตอร์ของระดับที่เลือก

  // เวกเตอร์ทิศทาง 4 ทิศที่ต้องตรวจ (dr, dc)
  // [0,1]  = แนวนอนขวา
  // [1,0]  = แนวตั้งลง
  // [1,1]  = ทแยงลงขวา
  // [1,-1] = ทแยงลงซ้าย
  const DIRS = [[0,1],[1,0],[1,1],[1,-1]];

  const mid  = Math.floor(N / 2);                          // mid = index กึ่งกลางกระดาน (ใช้คำนวณระยะจากศูนย์กลาง)
  // d2(r,c) = ระยะกำลังสองจากจุดกลาง -> (r-mid)^2 + (c-mid)^2
  // ใช้ทั้งสำหรับ "center bonus" และ "tie-break ใกล้กลาง"
  const d2   = (r,c) => (r - mid) * (r - mid) + (c - mid) * (c - mid);

  const empties = [];                                       // รายการตำแหน่งที่ยังว่างทั้งหมด
  for (let i=0;i<N;i++) for (let j=0;j<N;j++) if (!b[i][j]) empties.push([i,j]);
  if (!empties.length) return null;                         // ถ้าไม่มีช่องว่างเลย → วนไปก็ไร้ค่า

  // ตัวช่วยนับจำนวนหมากสัญลักษณ์ s ต่อเนื่องจาก (r,c) ไปทิศ (dr,dc) (ไม่นับ (r,c) เอง)
  // r,c : ตำแหน่งอ้างอิงบนกระดาน
  // dr,dc : เดลตาทิศทางที่ขยับทีละก้าว (เช่น 0,1 / 1,0 / 1,1 / 1,-1)
  // s : สัญลักษณ์ ("X" หรือ "O") ที่ต้องการนับ
  const countDir = (r, c, dr, dc, s) => {
    let i=r+dr, j=c+dc, k=0;                                // i,j = พิกัดที่เลื่อนไปทีละก้าว, k = ตัวนับ
    while (i>=0 && i<N && j>=0 && j<N && b[i][j] === s) {   // เดินไปจนกว่าจะชนขอบหรือเจอสัญลักษณ์อื่น
      k++; i+=dr; j+=dc;
    }
    return k;                                               // ส่งกลับจำนวนต่อเนื่องในทิศนั้น
  };

  // ลอง "วาง" สัญลักษณ์ s ที่ (r,c) แล้วตรวจว่าชนะไหม
  // แนวคิด: 1(ช่องที่วางเอง) + นับต่อเนื่องไป/ย้อนกลับในทิศทางเดียวกัน >= K ?
  const isWinIfPlace = (r, c, s) => {
    if (b[r][c]) return false;                              // ถ้าช่องไม่ว่าง หยุด
    b[r][c] = s;                                            // ลองวาง
    const ok = DIRS.some(([dr,dc]) =>                      // ตรวจทั้ง 4 ทิศ
      1 + countDir(r,c,dr,dc,s) + countDir(r,c,-dr,-dc,s) >= K );
    b[r][c] = null;                                         // ย้อนคืน
    return ok;                                              // true = ชนะ
  };

  // ---------- 1) ถ้าชนะได้เลย ให้ชนะ ----------
  // วนช่องว่างทั้งหมด หากวางแล้วชนะทันที → เลือกช่องนั้น
  for (const [r,c] of empties) if (isWinIfPlace(r,c,botSymbol)) return [r,c];

  // ---------- 2) กันชนะทันทีของคู่ต่อสู้ ----------
  // วนช่องว่างทั้งหมด หากฝั่งมนุษย์วางแล้วชนะได้ → เราต้องลงบล็อกช่องนั้น
  for (const [r,c] of empties) if (isWinIfPlace(r,c,human)) return [r,c];

  // ===== soft-block rule (นับ "จุดตัด") ตาม pattern ที่กำหนดจาก K =====
  // คืนค่ารูปแบบหน้าต่าง (window) ที่ต้องกัน:
  // - K<=3 : L=3 ต้องกันกรณี 2-in-3
  // - K=4  : L=4 ต้องกันกรณี 2-in-4
  // - K>=5 : L=5 ต้องกันกรณี 3-in-5
  function getSoftBlockPattern(K) {
    if (K <= 3) return { L: 3, required: 2 };               // 2 ใน 3
    if (K === 4) return { L: 4, required: 2 };              // 2 ใน 4
    return { L: 5, required: 3 };                           // 3 ใน 5
  }

  // intersectionBlock(sym, L, required)
  // หา "จุดตัด" ที่โดนหน้าต่างของฝ่าย sym (ฝั่งที่เราจะกัน) ทับซ้อนมากที่สุด
  // sym      : สัญลักษณ์ฝั่งที่ต้องกัน (มนุษย์)
  // L        : ความยาวหน้าต่าง (เช่น 3/4/5)
  // required : จำนวนหมากของ sym ที่ต้องมีพอดีในหน้าต่างนั้น (เช่น 2 สำหรับ L=3/4 หรือ 3 สำหรับ L=5)
  function intersectionBlock(sym, L, required) {
    const counts = new Map();                                // key:"r,c" → {r,c,count} จำนวนครั้งที่ช่องนี้อยู่ในหน้าต่างที่ต้องกัน
    const add = (r,c) => {                                   // ฟังก์ชันเพิ่มตัวนับให้ช่องว่าง (r,c)
      const key = `${r},${c}`;
      const cur = counts.get(key);
      if (cur) cur.count += 1; else counts.set(key, { r, c, count: 1 });
    };
    // เลื่อน "หน้าต่างยาว L" ไปตามทุกทิศ (dr,dc)
    for (const [dr,dc] of DIRS) {
      // sr,sc = start row/col (ตำแหน่งเริ่มหน้าต่าง)
      for (let sr=0; sr<N; sr++) for (let sc=0; sc<N; sc++) {
        // er,ec = end row/col (ตำแหน่งสุดท้ายของหน้าต่าง)
        const er = sr + (L-1)*dr, ec = sc + (L-1)*dc;
        // ถ้าเลยขอบบอร์ด → ข้าม
        if (er<0 || er>=N || ec<0 || ec>=N || sr<0 || sr>=N || sc<0 || sc>=N) continue;

        let cntSym = 0, cntOpp = 0;                          // cntSym = จำนวนหมากของ sym, cntOpp = จำนวนหมากของฝั่งตรงข้ามในหน้าต่าง
        const blanks = [];                                    // เก็บช่องว่างในหน้าต่าง
        // t = offset 0..L-1 เดินไปตามหน้าต่าง
        for (let t=0; t<L; t++) {
          const r = sr + t*dr, c = sc + t*dc;                 // r,c = จุดปัจจุบันในหน้าต่าง
          const v = b[r][c];                                  // v = ค่าหมากในบอร์ดตำแหน่งนั้น
          if (v === sym) cntSym++;                            // พบหมากของฝั่งที่เราจะกัน
          else if (v == null) blanks.push([r,c]);             // ช่องว่าง
          else cntOpp++;                                      // โดนฝั่งอื่นคั่น → หน้าต่างนี้ใช้ทำเส้นของ sym ไม่ได้
        }
        if (cntOpp > 0) continue;                             // ถ้ามีคู่แข่งคั่น → ข้าม
        if (cntSym === required) blanks.forEach(([r,c]) => add(r,c)); // ถ้าเข้า pattern → ให้เครดิตกับ "ทุกช่องว่าง" ในหน้าต่างนี้
      }
    }
    if (!counts.size) return null;                            // ไม่มีจุดที่ต้องกัน

    // เลือกช่องที่มี count สูงสุด (จุดตัดเยอะ) และ "ว่างจริง" บนบอร์ด
    // ถ้า count เท่ากัน → tie-break ด้วย "ใกล้ศูนย์กลาง" (ดู d2 ต่ำกว่า)
    let best = null;
    counts.forEach(v => {
      if (!b[v.r][v.c]) {
        if (!best
            || v.count > best.count
            || (v.count === best.count && d2(v.r,v.c) < d2(best.r,best.c))) best = v;
      }
    });
    return best ? { r:best.r, c:best.c, count:best.count } : null;  // {r,c,count} หรือ null
  }

  // ตรวจว่า ถ้าลงที่ (r,c) แล้วจะ "สร้างหน้าต่างที่เรามี K-1 และเหลือว่าง 1" (one-move-to-win) ไหม
  // ใช้แยกแยะว่าเป็น "near-win" ของเรา → ให้บอทโหมด HARD กล้าบุกมากขึ้น
  function createsKminus1AfterPlace(r, c, s, K) {
    if (b[r][c]) return false;                               // ต้องเป็นช่องว่างก่อน
    for (const [dr,dc] of DIRS) {
      // เราจะสไลด์หน้าต่างยาว K โดย "บังคับให้หน้าต่างนั้นต้องครอบ (r,c)" เสมอ
      for (let t=0; t<K; t++) {
        const sr = r - t*dr, sc = c - t*dc;                   // sr,sc = จุดเริ่มหน้าต่างที่ทำให้ (r,c) ตกอยู่ภายใน
        const er = sr + (K-1)*dr, ec = sc + (K-1)*dc;         // er,ec = จุดจบหน้าต่าง
        if (sr<0 || sr>=N || sc<0 || sc>=N || er<0 || er>=N || ec<0 || ec>=N) continue;

        let cntSelf = 0, cntOpp = 0, cntEmpty = 0;            // นับจำนวนเรา/เขา/ว่าง ในหน้าต่างนี้
        for (let w=0; w<K; w++) {
          const rr = sr + w*dr, cc = sc + w*dc;               // rr,cc = จุดที่กำลังเช็คภายในหน้าต่าง
          // v = ค่าที่จุดนั้น โดย treat ว่า (r,c) จะเป็นของเรา s
          const v = (rr===r && cc===c) ? s : b[rr][cc];
          if (v === s) cntSelf++;
          else if (v == null) cntEmpty++;
          else cntOpp++;
        }
        // เงื่อนไข near-win: ไม่มีคู่แข่ง, เรามี K-1, และยังเหลือว่าง 1 เพื่อปิดเกมในตาถัดไป
        if (cntOpp === 0 && cntSelf === K-1 && cntEmpty === 1) {
          return true;
        }
      }
    }
    return false;
  }

  // ---------- 3) ประเมินคะแนน (weight) แบบรุก/รับ → หาช่องบุกที่คุ้มสุด ----------
  function bestWeightedMove() {
    // สุ่มแกว่งคะแนนเล็กน้อย ตาม CFG.jitter (โหมด HARD = 0 ไม่สุ่ม)
    const jitter = () => (CFG.jitter ? (Math.random()*2-1) * CFG.jitter : 0);

    let best = null;                                         // best = ช่องคะแนนรวมดีที่สุดในบรรดาช่องว่างทั้งหมด
    for (const [r,c] of empties) {                           // r,c = พิกัดผู้สมัคร (ช่องว่าง)
      let score = 0;                                         // score = คะแนนรวมของช่อง (r,c)

      // สำหรับทุกทิศ (dr,dc) และสำหรับ "ทุกหน้าต่างยาว K" ที่ครอบ (r,c)
      for (const [dr,dc] of DIRS) {
        for (let t=0; t<K; t++) {
          const sr = r - t*dr, sc = c - t*dc;                 // sr,sc = จุดเริ่มหน้าต่าง
          const er = sr + (K-1)*dr, ec = sc + (K-1)*dc;       // er,ec = จุดจบหน้าต่าง
          if (sr<0 || sr>=N || sc<0 || sc>=N || er<0 || er>=N || ec<0 || ec>=N) continue;

          let cntSelf = 0, cntOpp = 0, cntEmpty = 0;          // นับเรา/เขา/ว่างในหน้าต่างนี้ (สมมุติว่า r,c เป็นของเรา)
          for (let w=0; w<K; w++) {
            const rr = sr + w*dr, cc = sc + w*dc;             // rr,cc = จุดภายในหน้าต่าง
            const v  = (rr===r && cc===c) ? botSymbol : b[rr][cc]; // treat ที่ (r,c) เป็นหมากของเรา
            if (v === botSymbol) cntSelf++;
            else if (v === human) cntOpp++;
            else cntEmpty++;
          }

          // ให้คะแนนตามสถานะในหน้าต่าง
          if (cntSelf > 0 && cntOpp > 0) {
            // ถ้ามีทั้งเราและเขาปะปน → หน้าต่างนี้ไม่สามารถต่อเส้นตรงยาวได้ → ไม่คิดคะแนน
          } else if (cntSelf > 0 && cntOpp === 0) {
            // มีแต่เรา → แต้มเชิงรุก
            let w = 1 + (cntSelf / K);                        // พื้นฐาน = 1 + สัดส่วนความคืบหน้าของเรา
            if (cntSelf === K-1) w += CFG.nearWinOffBonus;    // ถ้าจ่อชนะ → โบนัสใหญ่
            score += w * CFG.attackW;                         // คูณน้ำหนักฝั่งรุกตามระดับ
          } else if (cntOpp > 0 && cntSelf === 0) {
            // มีแต่เขา → แต้มเชิงรับ (กัน)
            let w = 1 + (cntOpp / K);                         // พื้นฐาน = 1 + สัดส่วนความคืบหน้าของเขา
            if (cntOpp === K-1) w += CFG.nearLossDefBonus;    // ถ้าเขาจ่อชนะ → โบนัสกันใหญ่
            score += w * CFG.defenseW;                        // คูณน้ำหนักฝั่งรับตามระดับ
          } else {
            // ว่างล้วน → ให้คะแนนกลาง ๆ
            score += CFG.neutral;
          }
        }
      }

      // -------- center bonus: เพิ่มคะแนนให้ช่องที่ใกล้ "ศูนย์กลาง" --------
      // สูตร: CFG.centerBias / (1 + sqrt(d2(r,c)))
      //  - d2(r,c) = ระยะกำลังสองจากศูนย์กลาง (ยิ่งใกล้กลาง → d2 น้อย → โบนัสมาก)
      const centerBonus = CFG.centerBias / (1 + Math.sqrt(d2(r,c)));
      score += centerBonus;

      // สุ่มแกว่งคะแนนเล็กน้อย (เฉพาะโหมดที่เปิด jitter)
      score *= (1 + (CFG.jitter ? jitter() : 0));

      // mkNear = ถ้าลงที่ (r,c) แล้ว "สร้าง K-1 ของเรา" (ปากประตู) หรือไม่
      const mkNear = createsKminus1AfterPlace(r,c,botSymbol,K);

      // -------- tie-break ด้วย "ใกล้กลาง" --------
      // ถ้า score เท่ากัน ให้เลือกอันที่ d2(r,c) น้อยกว่า (ใกล้จุดกลางมากกว่า)
      if (!best || score > best.score || (score === best.score && d2(r,c)<d2(best.r,best.c))) {
        best = { r, c, score, mkNear };                      // เก็บตัวเลือกที่ดีที่สุดตอนนี้
      }
    }
    return best;                                             // ส่งกลับ {r,c,score,mkNear}
  }

  const bestOff = bestWeightedMove();                        // ประเมินทุกช่อง → ได้ช่องบุกที่คุ้มสุด

  // ---------- 4) หา soft-block (จุดตัดเยอะสุด) ตาม pattern ----------
  const { L, required } = getSoftBlockPattern(K);            // เลือก L/required ตาม K
  const blk = intersectionBlock(human, L, required);         // blk = {r,c,count} | null (จุดตัดเพื่อกัน)

  // ---------- 5) ตัดสินใจขั้นสุดท้ายตามระดับ ----------
  if (LVL === "HARD") {
    if (!blk) return [bestOff.r, bestOff.c];                 // ถ้าไม่มีจุดต้องกันชัดเจน → บุก
    if (bestOff.mkNear) return [bestOff.r, bestOff.c];       // ถ้าบุกแล้วเกิด "K-1 ของเรา" → บุก
    if (blk.count >= 2) return [blk.r, blk.c];               // ถ้าจุดตัดแรง (>=2) และเราไม่ได้ near-win → กันก่อน
    return [bestOff.r, bestOff.c];                           // อื่น ๆ เน้นบุก
  }

  if (LVL === "NORMAL") {
    if (blk && blk.count >= 2 && !bestOff.mkNear) return [blk.r, blk.c]; // ปกติ: ถ้าเขามีจุดตัดแรง และเราไม่ได้ near-win → กัน
    return [bestOff.r, bestOff.c];                          // ไม่งั้นบุก
  }

  // EASY: ถ้ามีจุดต้องกันใด ๆ → กันก่อน, ไม่งั้นบุก
  if (blk) return [blk.r, blk.c];
  return [bestOff.r, bestOff.c];
}
