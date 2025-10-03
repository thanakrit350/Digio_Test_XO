import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGame } from "../../lib/api";
import Board from "../../components/Board";
import useSWR from "swr";
import "../../styles/Replay.css";

export default function ReplayPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const { data: game } = useSWR(id ? ["game", id] : null, () => getGame(id));

  const [step, setStep] = useState(0);

  const moves = useMemo(() => game?.histories ?? [], [game]);

  useEffect(() => {
    setStep(0);
  }, [id, moves.length]);

  const board = useMemo(() => {
    if (!game) return [[]];
    const N = game.tableSize;
    const b = Array.from({ length: N }, () => Array(N).fill(null));
    moves.slice(0, step).forEach((m) => {
      b[m.row][m.column] = m.text; 
    });
    return b;
  }, [game, moves, step]);

  const winningPositions = useMemo(() => {
    console.log('🔍 Debug - game.positions:', game?.positions);
    console.log('🔍 Debug - step:', step, 'total:', moves.length);
    
    if (!game || !game.positions || game.positions.length === 0) {
      console.log('❌ No positions data');
      return [];
    }
    const total = moves.length;
    if (step === total) {
      const positions = game.positions.map(p => ({ 
        row: p.row, 
        col: p.col ?? p.column  
      }));
      console.log('✅ Winning positions:', positions);
      return positions;
    }
    console.log('⏸️ Not at final step yet');
    return [];
  }, [game, moves.length, step]);

  if (!game) return <div className="replay-loading">Loading...</div>;

  const total = moves.length;
  const canPrev = step > 0;
  const canNext = step < total;

  const onFirst = () => setStep(0);
  const onPrev = () => setStep((s) => Math.max(0, s - 1));
  const onNext = () => setStep((s) => Math.min(total, s + 1));
  const onLast = () => setStep(total);

  const playDateText = game.playDate 
    ? new Date(game.playDate).toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : "";

  const resultPill =
    game.endResult && game.endResult !== "IN_PROGRESS" ? (
      <span
        className={
          "pill result " +
          (game.endResult === "X_WIN"
            ? "result-x"
            : game.endResult === "O_WIN"
            ? "result-o"
            : "result-draw")
        }
      >
        {game.endResult}
      </span>
    ) : null;

  const getPlayerName = (symbol) => {
    if (symbol === "X") return game.playerX;
    if (symbol === "O") return game.playerO;
    return "Unknown";
  };

  return (
    <main className="replay-wrap">
      <div className="replay-header">
        <h2 className="replay-title">Replay</h2>
        <button className="btn-home" onClick={() => nav("/history")}>History</button>
      </div>

      <div className="replay-meta">
        <div className="players">
          <strong>{game.playerX}</strong> (X) vs <strong>{game.playerO}</strong> (O)
        </div>
        <div className="meta-right">
          <span className={`pill ${game.gameStatus === "HUMAN_VS_BOT" ? "pill-bot" : "pill-human"}`}>
            {game.gameStatus}
          </span>
          <span className="dot" />
          <span className="soft">ตาราง {game.tableSize}×{game.tableSize}</span>
          {resultPill && (<><span className="dot" />{resultPill}</>)}
          {playDateText && (<><span className="dot" /><span className="time">{playDateText}</span></>)}
        </div>
      </div>

      <div className="replay-controls">
        <button className="ctl-btn" onClick={onFirst} disabled={!canPrev}>⏮</button>
        <button className="ctl-btn" onClick={onPrev} disabled={!canPrev}>◀</button>

        <div className="slider-wrap">
          <input
            className="replay-slider"
            type="range"
            min={0}
            max={total}
            value={step}
            onChange={(e) => setStep(parseInt(e.target.value, 10))}
          />
        </div>

        <button className="ctl-btn" onClick={onNext} disabled={!canNext}>▶</button>
        <button className="ctl-btn" onClick={onLast} disabled={!canNext}>⏭</button>

        <div className="step-indicator">step {step}/{total}</div>
      </div>

      <div className="neon-board-frame">
        <Board 
          board={board} 
          onCellClick={() => {}} 
          disabled 
          winningPositions={winningPositions}
        />
      </div>

      <details className="moves-details">
        <summary>Show move list</summary>
        <div className="moves-scroll">
          <ol className="moves-list">
            {moves.map((m, idx) => (
              <li key={m.turnNum} className={step === idx + 1 ? "active" : ""}>
                {getPlayerName(m.text)} ({m.text}) ตำแหน่ง ({m.row}, {m.column})
              </li>
            ))}
          </ol>
        </div>
      </details>
    </main>
  );
}