export const PLAYER_SKILLS = ["NOVICE", "AMATEUR", "PRO"];

export function listEmpties(board){
  const N = board.length, out=[];
  for (let r=0;r<N;r++) for (let c=0;c<N;c++) if (!board[r][c]) out.push([r,c]);
  return out;
}

function randPick(arr){ return arr[Math.floor(Math.random()*arr.length)] || null; }

function countDir(b,r,c,dr,dc,s){
  const N=b.length; let i=r+dr,j=c+dc,k=0;
  while(i>=0&&i<N&&j>=0&&j<N&&b[i][j]===s){k++;i+=dr;j+=dc;}
  return k;
}
function hasKInRowIfPlace(board,K,r,c,s){
  if(board[r][c]) return false;
  const DIRS=[[0,1],[1,0],[1,1],[1,-1]];
  board[r][c]=s;
  const ok = DIRS.some(([dr,dc]) => 1+countDir(board,r,c,dr,dc,s)+countDir(board,r,c,-dr,-dc,s)>=K);
  board[r][c]=null;
  return ok;
}
function findWinningMove(board,K,s){
  for(const [r,c] of listEmpties(board)) if(hasKInRowIfPlace(board,K,r,c,s)) return [r,c];
  return null;
}
function findBlockKminus1(board,K,opp){
  for(const [r,c] of listEmpties(board)){
    if(hasKInRowIfPlace(board,K,r,c,opp)) return [r,c];
  }
  return null;
}
function centerBiasPick(board, weight=0.35){
  const N=board.length, mid=Math.floor(N/2);
  const d2=(r,c)=> (r-mid)*(r-mid)+(c-mid)*(c-mid);
  const xs=listEmpties(board);
  if(!xs.length) return null;
  let best=null, bestScore=-1e9;
  for(const [r,c] of xs){
    const sc = (1 - Math.sqrt(d2(r,c))/N) + (Math.random()*weight);
    if(sc>bestScore){ bestScore=sc; best=[r,c]; }
  }
  return best;
}
/** ผู้เล่น: NOVICE = สุ่มล้วน */
export function moveNOVICE(board){ return randPick(listEmpties(board)); }

/** ผู้เล่น: AMATEUR = ชนะก่อน, 50% block, ช่องกลาง, สุ่ม */
export function moveAMATEUR(board,K,my="X",opp="O"){
  const win = findWinningMove(board,K,my); if(win) return win;
  const block = findBlockKminus1(board,K,opp);
  if(block && Math.random()<0.5) return block;
  const c = centerBiasPick(board, 0.25); if(c) return c;
  return moveNOVICE(board);
}
/** ผู้เล่น: PRO = ชนะก่อน, บล็อกเสมอ, ช่องกลาง, สุ่ม */
export function movePRO(board,K,my="X",opp="O"){
  const win = findWinningMove(board,K,my); if(win) return win;
  const block = findBlockKminus1(board,K,opp); if(block) return block;
  const c = centerBiasPick(board, 0.15); if(c) return c;
  return moveNOVICE(board);
}

export function humanMoveBySkill(skill){
  if(skill==="NOVICE") return (b,K,my,opp)=>moveNOVICE(b);
  if(skill==="AMATEUR")return (b,K,my,opp)=>moveAMATEUR(b,K,my,opp);
  return (b,K,my,opp)=>movePRO(b,K,my,opp);
}
