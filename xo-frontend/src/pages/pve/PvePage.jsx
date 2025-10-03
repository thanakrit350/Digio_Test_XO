import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createGame } from "../../lib/api";
import Board from "../../components/Board";
import "../../styles/Game.css";
import { chooseAIMove } from "../../lib/ai/botAi";
import { buildCreatePayload, toISODate } from "../../lib/gamePayload";

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden focusable="false">
    <circle cx="12" cy="7.5" r="4" />
    <path d="M4 20c1.8-3.4 5-5 8-5s6.2 1.6 8 5" />
  </svg>
);
const MonitorIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden focusable="false">
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);

function nextSymbol(firstTurn = "X", n = 0) {
  const f = firstTurn === "O" ? "O" : "X";
  return n % 2 === 0 ? f : f === "X" ? "O" : "X";
}
function checkWin(board, r, c, sym, K) {
  const D = [[0, 1],[1, 0],[1, 1],[1, -1]], N = board.length;
  const cnt = (dr, dc) => {
    let k = 1, i = r + dr, j = c + dc;
    while (i>=0 && i<N && j>=0 && j<N && board[i][j] === sym) { k++; i+=dr; j+=dc; }
    i = r - dr; j = c - dc;
    while (i>=0 && i<N && j>=0 && j<N && board[i][j] === sym) { k++; i-=dr; j-=dc; }
    return k;
  };
  return D.some(([dr, dc]) => cnt(dr, dc) >= K);
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

export default function PvePage() {
  const { state } = useLocation();
  const nav = useNavigate();

  const tableSize = state?.tableSize ?? 3;
  const winNum    = state?.winNum ?? (tableSize >= 7 ? 5 : 3);
  const firstTurnInit = state?.firstTurn ?? "X";
  const playerX   = state?.playerX ?? "Player";
  const playerO   = state?.playerO ?? "AI";
  const botLevel  = (state?.botLevel || "NORMAL").toUpperCase();
  const playDate  = state?.playDate ?? toISODate();

  const [firstToMove, setFirstToMove] = useState(firstTurnInit);

  const [moves, setMoves] = useState([]);
  const [endResult, setEndResult] = useState("IN_PROGRESS");
  const [saving, setSaving] = useState(false);
  const [winningPositions, setWinningPositions] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [aiThinking, setAiThinking] = useState(false);
  const aiGuardRef  = useRef(-1);
  const aiTimerRef  = useRef(null);

  const board = useMemo(() => {
    const N = tableSize, b = Array.from({ length: N }, () => Array(N).fill(null));
    moves.forEach(m => b[m.row][m.col ?? m.column] = m.text);
    return b;
  }, [moves, tableSize]);

  const humanSymbol = "X";
  const aiSymbol    = "O";
  const inProgress  = endResult === "IN_PROGRESS";
  const moveCount   = moves.length;
  const nextSym     = inProgress ? nextSymbol(firstToMove, moveCount) : null;

  useEffect(() => {
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }

    if (!inProgress) { setAiThinking(false); return; }
    if (saving) return;
    if (nextSym !== aiSymbol) { setAiThinking(false); return; }

    if (aiGuardRef.current === moves.length) return;
    aiGuardRef.current = moves.length;

    setAiThinking(true);
    const delay = 1000 + Math.floor(Math.random() * 1000);
    aiTimerRef.current = setTimeout(() => {
      const b2 = board.map(r => r.slice());
      const spot = chooseAIMove(b2, winNum, aiSymbol, botLevel);

      if (!spot) {
        setAiThinking(false);
        finish("DRAW", moves);
        return;
      }

      const [r, c]   = spot;
      const turnNum  = moves.length + 1;
      const step     = { turnNum, row: r, col: c, text: aiSymbol };
      const nx       = [...moves, step];

      const b3 = b2.map(row => row.slice()); b3[r][c] = aiSymbol;

      if (checkWin(b3, r, c, aiSymbol, winNum)) {
        const winLine = findWinningLine(b3, r, c, aiSymbol, winNum);
        setAiThinking(false);
        setMoves(nx);
        finish("O_WIN", nx, winLine);
        return;
      }
      if (turnNum === tableSize * tableSize) {
        setAiThinking(false);
        setMoves(nx);
        finish("DRAW", nx);
        return;
      }

      setAiThinking(false);
      setMoves(nx);
    }, delay);

    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };
  }, [inProgress, saving, nextSym, aiSymbol, moves, board, winNum, tableSize, botLevel]);

  const onCellClick = (r, c) => {
    if (!inProgress || saving || aiThinking) return;
    if (board[r][c]) return;
    if (nextSym !== humanSymbol) return;

    const turnNum = moves.length + 1;
    const step = { turnNum, row: r, col: c, text: humanSymbol };
    const b2 = board.map(row => row.slice()); b2[r][c] = humanSymbol;

    if (checkWin(b2, r, c, humanSymbol, winNum)) {
      const winLine = findWinningLine(b2, r, c, humanSymbol, winNum);
      const nx = [...moves, step];
      setMoves(nx);
      finish("X_WIN", nx, winLine);
      return;
    }
    if (turnNum === tableSize * tableSize) {
      const nx = [...moves, step];
      setMoves(nx);
      finish("DRAW", nx);
      return;
    }

    setMoves(prev => [...prev, step]);
  };

  async function finish(result, allMoves, winLine = []) {
    setEndResult(result);

    if (winLine.length > 0) {
      setWinningPositions(winLine);
    }

    const modalDelay = 1500 + Math.floor(Math.random() * 500);
    setTimeout(() => {
      setShowModal(true);
    }, modalDelay);

    setSaving(true);
    try {
      const payload = buildCreatePayload({
        tableSize, winNum, gameStatus: "HUMAN_VS_BOT",
        playerX, playerO, botLevel,
        firstTurn: firstToMove,
        playDate,
        endResult: result,
        winText: result === "DRAW" ? null : (result === "X_WIN" ? "X" : "O"),
        moves: allMoves,
        positions: result === "DRAW" ? [] : winLine
      });
      await createGame(payload);
    } finally { setSaving(false); }
  }

  const isDraw      = endResult === "DRAW";
  const winnerToken = endResult === "X_WIN" ? "X" : endResult === "O_WIN" ? "O" : null;
  const winnerName  = winnerToken === "X" ? playerX : winnerToken === "O" ? playerO : "-";

  const onPlayAgain = () => {
    setMoves([]);
    setEndResult("IN_PROGRESS");
    setFirstToMove(prev => (prev === "X" ? "O" : "X"));
    aiGuardRef.current = -1;
    setAiThinking(false);
    setWinningPositions([]);
    setShowModal(false);
    if (aiTimerRef.current) { clearTimeout(aiTimerRef.current); aiTimerRef.current = null; }
  };

  return (
    <section className="game-wrap">
      <div className="versus-bar">
        <div className={`player-slot left ${nextSym==="X" && inProgress ? "active" : ""}`}>
          <div className="avatar-ring ring-pink"><PersonIcon /></div>
          <div className="player-meta">
            <div className="player-name pink">{playerX}</div>
            <div className="token-row"><span className="token token-x" aria-label="X">X</span></div>
          </div>
        </div>

        <div className={`player-slot right ${nextSym==="O" && inProgress ? "active" : ""}`}>
          <div className="player-meta right">
            <div className="player-name blue">{playerO}</div>
            <div className="token-row"><span className="token token-o" aria-label="O" /></div>
          </div>
          <div className="avatar-ring ring-blue"><MonitorIcon /></div>
        </div>
      </div>

      {!inProgress && showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className={`result-modal ${isDraw ? "draw" : winnerToken === "X" ? "x" : "o"}`} role="document">
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
              <button className="btn-minimal" onClick={onPlayAgain} disabled={saving}>เริ่มเล่นใหม่</button>
            </div>
          </div>
        </div>
      )}

      <div className="neon-board-frame">
        <Board
          board={board}
          onCellClick={onCellClick}
          disabled={!inProgress || saving || aiThinking || nextSym === aiSymbol}
          winningPositions={!inProgress ? winningPositions : []}
        />
      </div>
    </section>
  );
}