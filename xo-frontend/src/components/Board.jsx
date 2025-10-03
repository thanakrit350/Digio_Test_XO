import React from "react";
import "../styles/Board.css";

export default function Board({ 
  board, 
  onCellClick, 
  disabled, 
  size = "min(92vw, 560px)", 
  gap = 8,
  winningPositions = [] 
}) {
  const N = Array.isArray(board) ? board.length : 0;

  const isWinningCell = (r, c) => {
    return winningPositions.some(pos => pos.row === r && pos.col === c);
  };

  return (
    <div
      className="board"
      style={{ "--n": N, "--size": size, "--gap": `${gap}px` }}
      role="grid"
      aria-disabled={disabled ? "true" : "false"}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const val = cell ?? "";
          const isTaken = !!val;
          const isWinning = isWinningCell(r, c); 
          
          const classes = [
            "cell",
            isTaken ? "taken" : "",
            val === "X" ? "cell-x" : "",
            val === "O" ? "cell-o" : "",
            isWinning ? "winning" : "", 
          ].filter(Boolean).join(" ");

          return (
            <button
              key={`${r}-${c}`}
              className={classes}
              onClick={() => onCellClick(r, c)}
              disabled={disabled || isTaken}
              role="gridcell"
              aria-label={`r${r + 1} c${c + 1} ${val || "empty"}`}
            >
              <span className="glyph">{val}</span>
            </button>
          );
        })
      )}
    </div>
  );
}