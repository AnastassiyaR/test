const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// ── Секторы колеса ──────────────────────────────────────────────────────────
const SECTORS = [
    { label: "1⭐",  stars: 1,  color: "#e74c3c" },
    { label: "2⭐",  stars: 2,  color: "#e67e22" },
    { label: "3⭐",  stars: 3,  color: "#f1c40f" },
    { label: "5⭐",  stars: 5,  color: "#2ecc71" },
    { label: "10⭐", stars: 10, color: "#1abc9c" },
    { label: "15⭐", stars: 15, color: "#3498db" },
    { label: "25⭐", stars: 25, color: "#9b59b6" },
    { label: "50⭐", stars: 50, color: "#e91e8c" },
];

const NUM = SECTORS.length;
const ARC = (2 * Math.PI) / NUM;

// ── Canvas ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const CX = W / 2;
const CY = H / 2;
const R = W / 2 - 4;

// ── Состояние ────────────────────────────────────────────────────────────────
let currentAngle = 0;   // текущий угол (рад)
let spinning = false;
let animId = null;

// ── Рисуем колесо ────────────────────────────────────────────────────────────
function drawWheel(angle) {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < NUM; i++) {
        const startAngle = angle + i * ARC;
        const endAngle   = startAngle + ARC;

        // Сектор
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, R, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = SECTORS[i].color;
        ctx.fill();

        // Граница
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Текст
        ctx.save();
        ctx.translate(CX, CY);
        ctx.rotate(startAngle + ARC / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${i < 5 ? 16 : 14}px Arial`;
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 4;
        ctx.fillText(SECTORS[i].label, R - 10, 5);
        ctx.restore();
    }

    // Центральный круг
    const grad = ctx.createRadialGradient(CX, CY, 6, CX, CY, 28);
    grad.addColorStop(0, "#fff");
    grad.addColorStop(1, "#FFD700");
    ctx.beginPath();
    ctx.arc(CX, CY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "#b8860b";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Центральный значок
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#333";
    ctx.fillText("🎡", CX, CY);
}

// Начальная отрисовка
drawWheel(currentAngle);

// ── Easing ────────────────────────────────────────────────────────────────────
function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
}

// ── Спин ─────────────────────────────────────────────────────────────────────
function spin() {
    if (spinning) return;
    spinning = true;

    const btn = document.getElementById("spin-btn");
    const resultBox = document.getElementById("result-box");
    const resultText = document.getElementById("result-text");

    btn.disabled = true;
    resultBox.classList.add("hidden");

    // Случайный победный сектор
    const winningSector = Math.floor(Math.random() * NUM);

    // Сколько полных оборотов + выравнивание на победный сектор
    const fullRotations = (5 + Math.floor(Math.random() * 5)) * 2 * Math.PI;

    // Угол, при котором стрелка (сверху, т.е. -π/2) попадает на центр сектора
    // Центр сектора i: currentAngle + i*ARC + ARC/2
    // Хотим: startAngle + winningSector*ARC + ARC/2 = -π/2  (mod 2π)
    // → startAngle = -π/2 - winningSector*ARC - ARC/2
    const targetAngle =
        currentAngle +
        fullRotations +
        ((-Math.PI / 2 - currentAngle - winningSector * ARC - ARC / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    const totalDelta = targetAngle - currentAngle;
    const duration = 4000 + Math.random() * 1500; // 4–5.5 с
    const startTime = performance.now();
    const startAngle = currentAngle;

    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        currentAngle = startAngle + totalDelta * easeOut(progress);
        drawWheel(currentAngle);

        if (progress < 1) {
            animId = requestAnimationFrame(animate);
        } else {
            currentAngle = targetAngle;
            drawWheel(currentAngle);
            spinning = false;

            // Показываем результат
            const won = SECTORS[winningSector];
            resultText.textContent = `🎉 Ты выиграл ${won.label}!`;
            resultBox.classList.remove("hidden");

            // Эффект частиц
            spawnParticles(won.stars);

            // Кнопка «Забрать» через 1.5 сек
            setTimeout(() => {
                btn.textContent = "✅ Забрать выигрыш";
                btn.disabled = false;
                btn.removeEventListener("click", spin);
                btn.onclick = () => claimReward(won.stars);
            }, 1500);
        }
    }

    animId = requestAnimationFrame(animate);
}

// ── Отправка результата в бот ────────────────────────────────────────────────
function claimReward(stars) {
    tg.sendData(JSON.stringify({ result: stars }));
}

// ── Частицы-звёзды ───────────────────────────────────────────────────────────
function spawnParticles(count) {
    const n = Math.min(count, 20);
    for (let i = 0; i < n; i++) {
        setTimeout(() => {
            const el = document.createElement("div");
            el.className = "star-particle";
            el.textContent = "⭐";
            el.style.left = 20 + Math.random() * 60 + "vw";
            el.style.top  = 40 + Math.random() * 30 + "vh";
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1300);
        }, i * 80);
    }
}

// ── Кнопка ───────────────────────────────────────────────────────────────────
const btn = document.getElementById("spin-btn");
btn.addEventListener("click", spin);