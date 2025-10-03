import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createGame } from "../../lib/api";
import Board from "../../components/Board";
import "../../styles/Game.css";
import { buildCreatePayload, toISODate } from "../../lib/gamePayload";

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden focusable="false">
    <circle cx="12" cy="7.5" r="4" />
    <path d="M4 20c1.8-3.4 5-5 8-5s6.2 1.6 8 5" />
  </svg>
);

function nextSymbol(firstTurn="X", n=0){
  const f = firstTurn === "O" ? "O" : "X";
  return n % 2 === 0 ? f : (f === "X" ? "O" : "X");
}
function checkWin(board,r,c,sym,K){
  const D=[[0,1],[1,0],[1,1],[1,-1]],N=board.length;
  const cnt=(dr,dc)=>{
    let k=1,i=r+dr,j=c+dc;
    while(i>=0&&i<N&&j>=0&&j<N&&board[i][j]===sym){k++;i+=dr;j+=dc}
    i=r-dr;j=c-dc;
    while(i>=0&&i<N&&j>=0&&j<N&&board[i][j]===sym){k++;i-=dr;j-=dc}
    return k
  };
  return D.some(([dr,dc])=>cnt(dr,dc)>=K);
}

function findWinningLine(board, r, c, sym, K) {
  const DIRS = [[0,1],[1,0],[1,1],[1,-1]];
  const N = board.length;

  for (const [dr, dc] of DIRS) {
    const cells = [[r, c]];
    let i = r + dr, j = c + dc;
    while (i>=0 && i<N && j>=0 && j<N && board[i][j] === sym) { cells.push([i,j]); i+=dr; j+=dc; }
    i = r - dr; j = c - dc;
    while (i>=0 && i<N && j>=0 && j<N && board[i][j] === sym) { cells.unshift([i,j]); i-=dr; j-=dc; }

    if (cells.length >= K) {
      const idx = cells.findIndex(([rr,cc]) => rr===r && cc===c);
      const startMin = Math.max(0, idx-(K-1));
      const startMax = Math.min(idx, cells.length - K);
      const start = Math.max(0, Math.min(startMin, startMax));
      const seg = cells.slice(start, start + K);
      return seg.map(([rr,cc]) => ({ row: rr, col: cc }));
    }
  }
  return [];
}

export default function PvpPage() {
  const { state } = useLocation();
  const nav = useNavigate();

  const tableSize = state?.tableSize ?? 3;
  const winNum    = state?.winNum ?? (tableSize >= 7 ? 5 : 3);
  const firstTurnInit = state?.firstTurn ?? "X";
  const playerX   = state?.playerX ?? "Player1";
  const playerO   = state?.playerO ?? "Player2";
  const playDate  = state?.playDate ?? toISODate();

  const [firstToMove, setFirstToMove] = useState(firstTurnInit);

  const [moves, setMoves] = useState([]); 
  const [endResult, setEndResult] = useState("IN_PROGRESS");
  const [winningPositions, setWinningPositions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const inProgress = endResult === "IN_PROGRESS";

  const board = useMemo(() => {
    const N = tableSize, b = Array.from({length:N},()=>Array(N).fill(null));
    moves.forEach(m => b[m.row][m.col] = m.text);
    return b;
  }, [moves, tableSize]);

  const moveCount = moves.length;
  const nextSym   = inProgress ? nextSymbol(firstToMove, moveCount) : null;

  const onCellClick = (r,c) => {
    if (!inProgress) return;
    if (board[r][c]) return;

    const turnNum = moves.length + 1;
    const sym = nextSym;
    const step = { turnNum, row:r, col:c, text: sym };

    const b2 = board.map(row => row.slice()); b2[r][c] = sym;

    if (checkWin(b2, r, c, sym, winNum)) {
      const winLine = findWinningLine(b2, r, c, sym, winNum);
      const nx = [...moves, step]; 
      setMoves(nx);
      finish(sym === "X" ? "X_WIN" : "O_WIN", nx, winLine);
      return;
    }
    if (turnNum === tableSize*tableSize) {
      const nx = [...moves, step]; 
      setMoves(nx);
      finish("DRAW", nx);
      return;
    }
    setMoves(prev => [...prev, step]);
  };

  async function finish(result, allMoves, winLine = []){
    setEndResult(result);
    
    if (winLine.length > 0) {
      setWinningPositions(winLine);
    }
    
    const modalDelay = 1500 + Math.floor(Math.random() * 500);
    setTimeout(() => {
      setShowModal(true);
    }, modalDelay);
    
    const payload = buildCreatePayload({
      tableSize, winNum, gameStatus: "HUMAN_VS_HUMAN",
      playerX, playerO, botLevel: undefined,
      firstTurn: firstToMove,            
      playDate,
      endResult: result,
      winText: result==="DRAW"? null : (result==="X_WIN"?"X":"O"),
      moves: allMoves,
      positions: result === "DRAW" ? [] : winLine 
    });
    await createGame(payload); 
  }

  const isDraw = endResult === "DRAW";
  const winnerToken = endResult === "X_WIN" ? "X" : (endResult === "O_WIN" ? "O" : null);
  const winnerName  = winnerToken === "X" ? playerX : winnerToken === "O" ? playerO : "-";

  const onPlayAgain = () => {
    setMoves([]);
    setEndResult("IN_PROGRESS");
    setFirstToMove(prev => (prev === "X" ? "O" : "X"));
    setWinningPositions([]);
    setShowModal(false);
  };

  return (
    <section className="game-wrap">
      <div className="versus-bar">
        <div className={`player-slot left ${nextSym==="X"&&inProgress?"active":""}`}>
          <div className="avatar-ring ring-pink"><PersonIcon/></div>
          <div className="player-meta">
            <div className="player-name pink">{playerX}</div>
            <div className="token-row"><span className="token token-x" aria-label="X">X</span></div>
          </div>
        </div>

        <div className={`player-slot right ${nextSym==="O"&&inProgress?"active":""}`}>
          <div className="player-meta right">
            <div className="player-name blue">{playerO}</div>
            <div className="token-row"><span className="token token-o" aria-label="O" /></div>
          </div>
          <div className="avatar-ring ring-blue"><PersonIcon/></div>
        </div>
      </div>

      {!inProgress && showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div
            className={`result-modal ${isDraw ? "draw" : winnerToken === "X" ? "x" : "o"}`}
            role="document"
          >
            <div className="result-title">
              {isDraw ? (
                "ผลการแข่งขัน: เสมอ"
              ) : (
                <>
                  ผู้ชนะ: <strong>{winnerName}</strong>{" "}
                  {winnerToken === "X"
                    ? <span className="token token-x" aria-label="X">X</span>
                    : <span className="token token-o" aria-label="O" />}
                </>
              )}
            </div>
            <div className="result-actions">
              <button className="btn-home" onClick={() => nav("/")}>Home</button>
              <button className="btn-minimal" onClick={onPlayAgain}>เริ่มเล่นใหม่</button>
            </div>
          </div>
        </div>
      )}

      <div className="neon-board-frame">
        <Board 
          board={board} 
          onCellClick={onCellClick} 
          disabled={!inProgress}
          winningPositions={!inProgress ? winningPositions : []}
        />
      </div>
    </section>
  );
}