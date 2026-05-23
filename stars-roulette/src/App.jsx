import { useState, useRef, useEffect } from "react";
import "./App.css";

const tg = window.Telegram?.WebApp;

const SECTORS = [
  { label: "1",  stars: 1,  color: "#7F77DD", text: "#fff" },
  { label: "2",  stars: 2,  color: "#378ADD", text: "#fff" },
  { label: "3",  stars: 3,  color: "#1D9E75", text: "#fff" },
  { label: "5",  stars: 5,  color: "#BA7517", text: "#fff" },
  { label: "10", stars: 10, color: "#D4537E", text: "#fff" },
  { label: "15", stars: 15, color: "#D85A30", text: "#fff" },
  { label: "25", stars: 25, color: "#534AB7", text: "#fff" },
  { label: "50", stars: 50, color: "#185FA5", text: "#fff" },
];

const R = 160;
const CX = 170;
const CY = 170;
const LABEL_R = 108;

function polarToXY(angleDeg, r) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function sectorPath(startDeg, endDeg) {
  const start = polarToXY(startDeg, R);
  const end   = polarToXY(endDeg, R);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${start.x} ${start.y} A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y} Z`;
}

export default function App() {
  const [rotation, setRotation] = useState(0);
  const [result, setResult]     = useState(null);
  const [claimed, setClaimed]   = useState(false);
  const [debugMsg, setDebugMsg] = useState("");
  const spinning = useRef(false);
  const totalRef = useRef(0);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      setDebugMsg(`tg OK, initData: ${tg.initData ? tg.initData.slice(0, 20) + "..." : "ПУСТО"}`);
    } else {
      setDebugMsg("tg = undefined");
    }
  }, []);

  function spin() {
    if (spinning.current) return;
    spinning.current = true;
    setResult(null);
    setClaimed(false);

    const winIndex    = Math.floor(Math.random() * SECTORS.length);
    const sectorAngle = 360 / SECTORS.length;
    const extra = 360 * 7 + (360 - winIndex * sectorAngle - sectorAngle / 2);
    totalRef.current += extra;
    setRotation(totalRef.current);

    setTimeout(() => {
      spinning.current = false;
      setResult(SECTORS[winIndex]);
    }, 4300);
  }

  function claimReward(stars) {
    if (!tg) {
      setDebugMsg("ОШИБКА: tg = undefined");
      return;
    }
    if (!tg.sendData) {
      setDebugMsg("ОШИБКА: tg.sendData недоступен. initData: " + (tg.initData || "ПУСТО"));
      return;
    }
    try {
      tg.sendData(JSON.stringify({ result: stars }));
      setClaimed(true);
    } catch (e) {
      setDebugMsg("ОШИБКА sendData: " + e.message);
    }
  }

  const sectorAngle = 360 / SECTORS.length;

  return (
    <div className="app">
      <header className="header" role="banner">
        <span className="title" aria-label="Stars Roulette">★ Stars Roulette</span>
      </header>

      {debugMsg && (
        <div style={{
          margin: "8px 16px",
          padding: "8px 12px",
          background: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          fontSize: "12px",
          wordBreak: "break-all",
          color: "#333"
        }}>
          {debugMsg}
        </div>
      )}

      <p className="warning" role="note">
        Крутите барабан и выигрывайте звёзды!
      </p>

      <main className="center-block">
        <div className="pointer" aria-hidden="true" />

        <div className="wheel-wrap">
          <svg
            className="roulette-svg"
            viewBox="0 0 340 340"
            style={{ transform: `rotate(${rotation}deg)` }}
            aria-label="Колесо рулетки"
            role="img"
          >
            <circle cx={CX} cy={CY} r={R + 5} fill="rgba(0,0,0,0.08)" />
            <circle cx={CX} cy={CY} r={R + 3} fill="#fff" />

            {SECTORS.map((s, i) => {
              const startDeg = i * sectorAngle;
              const endDeg   = startDeg + sectorAngle;
              const midDeg   = startDeg + sectorAngle / 2;
              const lp       = polarToXY(midDeg, LABEL_R);
              const starPt   = polarToXY(midDeg, LABEL_R - 22);

              return (
                <g key={i}>
                  <path d={sectorPath(startDeg, endDeg)} fill={s.color} />
                  <line
                    x1={CX} y1={CY}
                    x2={polarToXY(startDeg, R).x}
                    y2={polarToXY(startDeg, R).y}
                    stroke="#fff" strokeWidth="2.5"
                  />
                  <text
                    x={starPt.x} y={starPt.y}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="13" fill="rgba(255,255,255,0.6)"
                    transform={`rotate(${midDeg}, ${starPt.x}, ${starPt.y})`}
                    aria-hidden="true"
                  >★</text>
                  <text
                    x={lp.x} y={lp.y}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="17" fontWeight="700"
                    fontFamily="Rajdhani, sans-serif"
                    fill={s.text}
                    transform={`rotate(${midDeg}, ${lp.x}, ${lp.y})`}
                    aria-hidden="true"
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}

            <circle cx={CX} cy={CY} r={20} fill="#fff" />
            <circle cx={CX} cy={CY} r={13} fill="#534AB7" />
          </svg>
        </div>

        {result && (
          <div
            className="result"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            🎉 Ты выиграл <strong>{result.label} ★</strong>!
          </div>
        )}
      </main>

      <div className="btn-row">
        {result && !claimed ? (
          <>
            <button
              className="btn btn-claim"
              onClick={() => claimReward(result.stars)}
              aria-label={`Забрать ${result.label} звёзд`}
            >
              ✅ Забрать выигрыш
            </button>
            <button
              className="btn btn-secondary"
              onClick={spin}
            >
              Крутить ещё
            </button>
          </>
        ) : (
          <button
            className="btn"
            onClick={spin}
            disabled={spinning.current}
            aria-label={spinning.current ? "Крутится..." : "Крутить колесо"}
          >
            {spinning.current ? "Крутится..." : "Крутить"}
          </button>
        )}
      </div>
    </div>
  );
}