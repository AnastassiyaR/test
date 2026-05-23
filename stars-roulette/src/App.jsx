import { useState, useRef } from "react";
import "./App.css";

const SECTORS = [
  { label: "1",  color: "#7F77DD", text: "#fff", name: "фиолетовый" },
  { label: "2",  color: "#378ADD", text: "#fff", name: "синий" },
  { label: "3",  color: "#1D9E75", text: "#fff", name: "бирюзовый" },
  { label: "5",  color: "#BA7517", text: "#fff", name: "янтарный" },
  { label: "10", color: "#D4537E", text: "#fff", name: "розовый" },
  { label: "15", color: "#D85A30", text: "#fff", name: "коралловый" },
  { label: "25", color: "#534AB7", text: "#fff", name: "индиго" },
  { label: "50", color: "#185FA5", text: "#fff", name: "тёмно-синий" },
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
  const spinning = useRef(false);
  const totalRef = useRef(0);

  function spin() {
    if (spinning.current) return;
    spinning.current = true;
    setResult(null);

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

  const sectorAngle = 360 / SECTORS.length;

  return (
    <div className="app">
      <header className="header" role="banner">
        <span className="title" aria-label="Stars Roulette">★ Stars Roulette</span>
      </header>

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
            Вы выиграли{" "}
            <strong>{result.label} ★</strong>
          </div>
        )}
      </main>

      <div className="btn-row">
        <button
          className="btn"
          onClick={spin}
          disabled={spinning.current}
          aria-label={spinning.current ? "Крутится..." : "Крутить колесо"}
        >
          {spinning.current ? "Крутится..." : "Крутить"}
        </button>
      </div>
    </div>
  );
}