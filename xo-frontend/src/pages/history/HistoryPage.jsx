import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listGames } from "../../lib/api";
import useSWR from "swr";
import "../../styles/History.css";

const PAGE_SIZE = 6;

function whoPlaysWithWho(g) {
  if (!g) return "-";
  return `${g.playerX} (X) vs ${g.playerO} (O)`;
}

function dateOnly(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return isNaN(+dt) ? "-" : dt.toLocaleDateString('th-TH', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function ts(d) {
  const t = new Date(d).getTime();
  return isNaN(t) ? 0 : t;
}

export default function HistoryPage() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const [page, setPage] = useState(initialPage);

  const { data: gamesRes, error } = useSWR(["games-list"], () =>
    listGames({ limit: 100, offset: 0 })
  );

  const games = (gamesRes ?? []).filter(Boolean);

  const finishedGames = useMemo(
    () => games.filter((g) => g.endResult && g.endResult !== "IN_PROGRESS"),
    [games]
  );
  
  const finishedSorted = useMemo(
    () =>
      [...finishedGames].sort((a, b) => {
        const tB = ts(b.playDate);
        const tA = ts(a.playDate);
        if (tB !== tA) return tB - tA;
        return (b.gameId || 0) - (a.gameId || 0);
      }),
    [finishedGames]
  );

  const totalPages = Math.max(1, Math.ceil((finishedSorted.length || 0) / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  useEffect(() => {
    setSearchParams({ page: String(page) }, { replace: true });
  }, [page, setSearchParams]);

  const start = (page - 1) * PAGE_SIZE;
  const pageItems = finishedSorted.slice(start, start + PAGE_SIZE);

  const goto = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <main className="hist-wrap">
      <div className="hist-header">
        <h2 className="hist-title">Game History</h2>
        <button className="btn-home" onClick={() => nav("/")}>Home</button>
      </div>

      {error && (
        <div className="hist-alert error">
          โหลดรายการเกมไม่สำเร็จ — ตรวจ API <code>GET /games</code>
        </div>
      )}
      {!gamesRes && !error && <div className="hist-alert">Loading games…</div>}

      {gamesRes && (
        <>
          {pageItems.length === 0 ? (
            <div className="hist-empty">
              หน้านี้ยังไม่มีประวัติการเล่น ลองเปลี่ยนหน้าอื่นด้านล่าง
            </div>
          ) : (
            <div className="hist-grid">
              {pageItems.map((g) => (
                <div key={g.gameId} className="hist-card">
                  <div className="card-preview">
                    <div className="hist-preview-grid" style={{ "--n": g.tableSize }} />
                  </div>

                  <div className="card-body">
                    <div className="card-title">{whoPlaysWithWho(g)}</div>

                    <div className="card-meta">
                      <span className={`pill ${g.gameStatus === "HUMAN_VS_BOT" ? "pill-bot" : "pill-human"}`}>
                        {g.gameStatus}
                      </span>
                      {g.gameStatus === "HUMAN_VS_BOT" && (
                        <>
                          <span className="dot" />
                          <span className="pill pill-level">Level: {g.botLevel || "NORMAL"}</span>
                        </>
                      )}
                      <span className="soft">• ตาราง {g.tableSize} × {g.tableSize}</span>
                      <span className="soft">• ตัวเรียง {g.winNum} แถว</span>
                    </div>

                    <div className="card-result">
                      <span className={`pill result ${
                        g.endResult === "X_WIN" ? "result-x" :
                        g.endResult === "O_WIN" ? "result-o" : "result-draw"
                      }`}>
                        {g.endResult}
                      </span>
                      {g.playDate && (
                        <>
                          <span className="dot" />
                          <span className="time">{dateOnly(g.playDate)}</span>
                        </>
                      )}
                    </div>

                    <div className="card-actions">
                      <button className="btn-replay" onClick={() => nav(`/replay/${g.gameId}`)}>
                        ▶ Replay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pager">
            <button className="page-btn" onClick={() => goto(page - 1)} disabled={page <= 1}>‹</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPages <= 7) return true;
                return (
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1 ||
                  (page <= 3 && p <= 4) ||
                  (page >= totalPages - 2 && p >= totalPages - 3)
                );
              })
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const needEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {needEllipsis && <span className="page-ellipsis">…</span>}
                    <button className={`page-num ${p === page ? "active" : ""}`} onClick={() => goto(p)}>
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button className="page-btn" onClick={() => goto(page + 1)} disabled={page >= totalPages}>›</button>
          </div>
        </>
      )}
    </main>
  );
}
