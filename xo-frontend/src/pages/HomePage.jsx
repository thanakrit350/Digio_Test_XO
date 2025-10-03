import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

const PRESET_SIZES = [3, 5, 7, 9];

function autoWinNum(size) {
  if (size === 3) return 3;
  if (size >= 6) return 5;
  return size === 4 ? 3 : 4; 
}

function BoardPreview({ size }) {
  return (
    <div className="preview-frame">
      <div className="preview-grid grid-only" style={{ "--n": size }} />
    </div>
  );
}

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

function ModeButtonIcon({ active, onClick, ariaLabel, leftIcon, rightIcon }) {
  return (
    <button
      type="button"
      className={`mode-btn icon-only ${active ? "active" : ""}`}
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span className="icon">{leftIcon}</span>
      <span className="vs-sep" aria-hidden>VS</span>
      <span className="icon">{rightIcon}</span>
    </button>
  );
}

export default function HomePage() {
  const nav = useNavigate();

  const [index, setIndex] = useState(0);
  const presetSize = PRESET_SIZES[index];

  const [customOffset, setCustomOffset] = useState(0); 
  
  const customSize = useMemo(() => {
    if (customOffset === 0) return null;
    const target = presetSize + customOffset;
    return Math.max(3, Math.min(target, 15));
  }, [presetSize, customOffset]);

  const size = customSize ?? presetSize;

  const [kChoice, setKChoice] = useState(null); 

  const K = useMemo(() => {
    if (size === 4) return kChoice ?? 3; 
    if (size === 5) return kChoice ?? 4; 
    return autoWinNum(size);
  }, [size, kChoice]);

  const [mode, setMode] = useState("HUMAN_VS_BOT");
  const [level, setLevel] = useState("NORMAL");

  const onPrev = () => {
    setIndex((i) => (i === 0 ? PRESET_SIZES.length - 1 : i - 1));
    setCustomOffset(0); 
  };
  
  const onNext = () => {
    setIndex((i) => (i === PRESET_SIZES.length - 1 ? 0 : i + 1));
    setCustomOffset(0);
  };

  const onCreate = () => {
    const state = {
      tableSize: size,
      winNum: K,
      gameStatus: mode,
      playerX: mode === "HUMAN_VS_BOT" ? "Player" : "Player1",
      playerO: mode === "HUMAN_VS_BOT" ? "AI"     : "Player2",
      botLevel: mode === "HUMAN_VS_BOT" ? level   : undefined,
      firstTurn: "X",
      playDate: new Date().toISOString().slice(0, 10),
    };
    nav(`/${mode === "HUMAN_VS_BOT" ? "pve" : "pvp"}`, { state });
  };

  React.useEffect(() => {
    if (size !== 4 && size !== 5) setKChoice(null);
  }, [size]);

  const canDecrease = size > 3;
  const canIncrease = size < 15;

  return (
    <main className="home-wrap">
      <h1 className="home-title">XO – Digio</h1>

      <div className="carousel">
        <button className="carousel-arrow left" onClick={onPrev} aria-label="Previous board">▸</button>
        <div className="carousel-stage">
          <div className="carousel-track" style={{ transform: "translateX(0%)" }}>
            <div className="carousel-item" key={`size-${size}`}>
              <BoardPreview size={size} />
              <div className="size-caption">{size} × {size}</div>

              {(size === 4 || size === 5) ? (
                <div className="k-selector">
                  <label className="k-label">จำนวนตัวเรียง</label>
                  <div className="k-button-group">
                    {size === 4 ? (
                      <>
                        <button
                          type="button"
                          className={`k-btn ${K === 3 ? "active" : ""}`}
                          onClick={() => setKChoice(3)}
                        >
                          3
                        </button>
                        <button
                          type="button"
                          className={`k-btn ${K === 4 ? "active" : ""}`}
                          onClick={() => setKChoice(4)}
                        >
                          4
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`k-btn ${K === 4 ? "active" : ""}`}
                          onClick={() => setKChoice(4)}
                        >
                          4
                        </button>
                        <button
                          type="button"
                          className={`k-btn ${K === 5 ? "active" : ""}`}
                          onClick={() => setKChoice(5)}
                        >
                          5
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="k-caption">จำนวนตัวเรียง {K} ตัว</div>
              )}

              <div className="custom-under-preview">
                <label className="custom-size-label">ปรับขนาดตาราง</label>
                <div className="size-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setCustomOffset(prev => prev - 1)}
                    disabled={!canDecrease}
                    aria-label="Decrease size"
                  >
                    −
                  </button>
                  <div className="stepper-display">{size}</div>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setCustomOffset(prev => prev + 1)}
                    disabled={!canIncrease}
                    aria-label="Increase size"
                  >
                    +
                  </button>
                </div>
                <div className="hint">ขนาด 3 – 15</div>
              </div>
            </div>
          </div>
        </div>
        <button className="carousel-arrow right" onClick={onNext} aria-label="Next board">▸</button>
      </div>

      <div className="mode-row">
        <ModeButtonIcon
          active={mode === "HUMAN_VS_BOT"}
          onClick={() => setMode("HUMAN_VS_BOT")}
          ariaLabel="Human vs Bot"
          leftIcon={<PersonIcon />} rightIcon={<MonitorIcon />}
        />
        <ModeButtonIcon
          active={mode === "HUMAN_VS_HUMAN"}
          onClick={() => setMode("HUMAN_VS_HUMAN")}
          ariaLabel="Human vs Human"
          leftIcon={<PersonIcon />} rightIcon={<PersonIcon />}
        />
      </div>

      {mode === "HUMAN_VS_BOT" && (
        <div className="bot-level">
          <label>
            Bot Level:
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>EASY</option><option>NORMAL</option><option>HARD</option>
            </select>
          </label>
        </div>
      )}

      <div className="start-row">
        <button className="start-btn" onClick={onCreate} disabled={!Number.isFinite(size) || size < 3}>
          Start Game
        </button>
      </div>
    </main>
  );
}