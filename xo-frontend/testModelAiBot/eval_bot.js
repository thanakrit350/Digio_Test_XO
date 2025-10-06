import { writeFileSync } from "fs";
import { PLAYER_SKILLS, humanMoveBySkill, listEmpties } from "./policies.js";

const args = Object.fromEntries(process.argv.slice(2).map(s=>{
  const [k,v] = s.split("="); return [k.replace(/^--/,""), v ?? true];
}));
const TRIALS = Number(args.trials ?? 30);     
const ALL = !!args.all;                       
const LEVELS = ["EASY","NORMAL","HARD"];      
const BOARD_SET = ALL ? Array.from({length:13},(_,i)=>i+3) : [3,5,7,9,15];

// ฟังก์ชัน BOT AI 
function chooseAIMove(board, K, botSymbol = "O", level = "NORMAL") {
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
          const v  = (rr===r && cc===c) ? s : b[rr][cc];
          if (v === s) cntSelf++; else if (v == null) cntEmpty++; else cntOpp++;
        }
        if (cntOpp === 0 && cntSelf === K-1 && cntEmpty === 1) return true;
      }
    }
    return false;
  }

  function rankedWeightedMoves() {
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
            else if (v === (botSymbol==="X"?"O":"X")) cntOpp++;
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
      if (CFG.jitter) score *= (1 + (Math.random()*2-1) * CFG.jitter);
      const mkNear = createsKminus1AfterPlace(r,c,botSymbol,K);
      ranks.push({ r, c, score, mkNear });
    }
    ranks.sort((a,b) => (b.score - a.score) || ((a.r-N/2)**2+(a.c-N/2)**2 - ((b.r-N/2)**2+(b.c-N/2)**2)));
    return ranks;
  }

  function pickFromTop(ranks, k = 3) {
    const size = Math.min(k, ranks.length);
    const weights = [0.7, 0.2, 0.1].slice(0, size);
    const sum = weights.reduce((a,b)=>a+b,0);
    let r = Math.random() * sum;
    for (let i=0;i<size;i++){ r-=weights[i]; if (r<=0) return i; }
    return 0;
  }
  const { L, required } = (K<=3)?{L:3,required:2}:(K===4?{L:4,required:2}:{L:5,required:3});
  const blk = (()=>{
    const counts = new Map();
    const add=(r,c)=>{const k=`${r},${c}`; const cur=counts.get(k); if(cur)cur.count++; else counts.set(k,{r,c,count:1});};
    for (const [dr,dc] of DIRS) for(let sr=0;sr<N;sr++) for(let sc=0;sc<N;sc++){
      const er=sr+(L-1)*dr, ec=sc+(L-1)*dc;
      if (er<0||er>=N||ec<0||ec>=N||sr<0||sr>=N||sc<0||sc>=N) continue;
      let cntSym=0,cntOpp=0; const blanks=[];
      for(let t=0;t<L;t++){
        const r=sr+t*dr, c=sc+t*dc, v=b[r][c];
        if(v===(botSymbol==="X"?"O":"X")) cntSym++;
        else if(v==null) blanks.push([r,c]); else cntOpp++;
      }
      if(cntOpp>0) continue;
      if(cntSym===required) blanks.forEach(([r,c])=>add(r,c));
    }
    let best=null;
    counts.forEach(v=>{
      if(!b[v.r][v.c]){
        if(!best||v.count>best.count||(v.count===best.count && d2(v.r,v.c)<d2(best.r,best.c))) best=v;
      }
    });
    return best?{r:best.r,c:best.c,count:best.count}:null;
  })();
  const ranks = rankedWeightedMoves();
  const bestOff = ranks[0];
  if (LVL==="HARD"){
    if(!blk) return [bestOff.r,bestOff.c];
    if(bestOff.mkNear) return [bestOff.r,bestOff.c];
    if(blk.count>=2) return [blk.r,blk.c];
    return [bestOff.r,bestOff.c];
  }
  if (LVL==="NORMAL"){
    if(blk && blk.count>=2 && !bestOff.mkNear) return [blk.r,blk.c];
    return [bestOff.r,bestOff.c];
  }
  if (LVL==="EASY"){
    if(blk && blk.count>=3 && !bestOff.mkNear) return [blk.r,blk.c];
    if(blk && blk.count===2 && !bestOff.mkNear && Math.random()<0.6) return [blk.r,blk.c];
    const idx = pickFromTop(ranks,3);
    const pick = ranks[idx] || bestOff;
    return [pick.r,pick.c];
  }
  return [bestOff.r,bestOff.c];
}

// ฟังก์ชันรันการทดลอง 
function cloneBoard(N){ return Array.from({length:N},()=>Array(N).fill(null)); }
function checkWin(board,K,s){
  const N=board.length, DIRS=[[0,1],[1,0],[1,1],[1,-1]];
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){
    if(board[r][c]!==s) continue;
    for(const [dr,dc] of DIRS){
      let ok=true;
      for(let t=1;t<K;t++){
        const rr=r+t*dr, cc=c+t*dc;
        if(rr<0||rr>=N||cc<0||cc>=N||board[rr][cc]!==s){ ok=false; break; }
      }
      if(ok) return true;
    }
  }
  return false;
}

function over(board,K){
  if(checkWin(board,K,"X")) return {over:true,winner:"X"};
  if(checkWin(board,K,"O")) return {over:true,winner:"O"};
  if(listEmpties(board).length===0) return {over:true,winner:null};
  return {over:false};
}

function KForN(N){
  if(N===3) return [3];
  if(N===4) return [4,5]; 
  if(N===5) return [4,5];
  return [5];
}

function playOne(N,K,r0,c0,skill,botLevel){
  const board=cloneBoard(N);
  const humanMove = humanMoveBySkill(skill);
  board[r0][c0]="X";
  let turn="O";
  while(true){
    const st = over(board,K);
    if(st.over) return st.winner;
    if(turn==="O"){
      const mv = chooseAIMove(board,K,"O",botLevel);
      if(!mv) return null;
      board[mv[0]][mv[1]]="O";
      turn="X";
    }else{
      const mv = humanMove(board,K,"X","O");
      if(!mv) return null;
      board[mv[0]][mv[1]]="X";
      turn="O";
    }
  }
}

function evaluate(N,K,skill,level,trialsPerCell){
  let win=0,lose=0,draw=0;
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){
    for(let t=0;t<trialsPerCell;t++){
      const w = playOne(N,K,r,c,skill,level);
      if(w==="O") win++; else if(w==="X") lose++; else draw++;
    }
  }
  const total = win+lose+draw;
  return {N,K,skill,level,win,lose,draw,total,winPct: total? (100*win/total):0};
}

const results=[];
for(const N of BOARD_SET){
  for(const K of KForN(N)){
    for(const skill of PLAYER_SKILLS){
      for(const level of LEVELS){
        const r = evaluate(N,K,skill,level,TRIALS);
        results.push(r);
        console.log(`N=${N} K=${K} | ${skill} vs ${level} | Win%=${r.winPct.toFixed(2)}  (W:${r.win} L:${r.lose} D:${r.draw})`);
      }
    }
  }
}

const csvHeader = "N,K,PLAYER_SKILL,BOT_LEVEL,TrialsPerCell,Cells,Total,Win,Lose,Draw,WinPct\n";
const csvLines = results.map(r=>{
  const cells=r.N*r.N;
  return [r.N,r.K,r.skill,r.level,TRIALS,cells,r.total,r.win,r.lose,r.draw,r.winPct.toFixed(2)].join(",");
});
writeFileSync("./results.json", JSON.stringify({generatedAt:new Date().toISOString(), trialsPerCell:TRIALS, rows:results}, null, 2));
writeFileSync("./results.csv", csvHeader + csvLines.join("\n"));
console.log("\nSaved -> eval/results.json & eval/results.csv");
