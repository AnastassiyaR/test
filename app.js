const tg = window.Telegram.WebApp;
tg.expand();

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

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const CX = W / 2;
const CY = H / 2;
const R = W / 2 - 4;

let currentAngle = 0;
let spinning = false;
let animId = null;
let pendingStars = null;

function drawWheel(angle) {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < NUM; i++) {
        const startAngle = angle + i * ARC;
        const endAngle   = startAngle + ARC;

        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, R, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = SECTORS[i].color;
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

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

    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#333";
    ctx.fillText("🎡", CX, CY);
}

drawWheel(currentAngle);

function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
}

function spin() {
    if (spinning) return;
    spinning = true;
    pendingStars = null;

    const btn = document.getElementById("spin-btn");
    const resultBox = document.getElementById("result-box");
    const resultText = document.getElementById("result-text");

    btn.disabled = true;
    resultBox.classList.add("hidden");

    const winningSector = Math.floor(Math.random() * NUM);

    const fullRotations = (5 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
    const targetAngle =
        currentAngle +
        fullRotations +
        ((-Math.PI / 2 - currentAngle - winningSector * ARC - ARC / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    const totalDelta = targetAngle - currentAngle;
    const duration = 4000 + Math.random() * 1500;
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

            const won = SECTORS[winningSector];
            pendingStars = won.stars;

            resultText.textContent = `🎉 Ты выиграл ${won.label}!`;
            resultBox.classList.remove("hidden");

            spawnParticles(won.stars);

            setTimeout(() => {
                btn.textContent = "✅ Забрать выигрыш";
                btn.disabled = false;
                btn.onclick = null;
                btn.replaceWith(btn.cloneNode(true));
                const newBtn = document.getElementById("spin-btn");
                newBtn.textContent = "✅ Забрать выигрыш";
                newBtn.disabled = false;
                newBtn.onclick = claimReward;
            }, 1500);
        }
    }

    animId = requestAnimationFrame(animate);
}

function claimReward() {
    if (pendingStars === null) {
        alert("Ошибка: нет результата для отправки");
        return;
    }

    const payload = JSON.stringify({ result: pendingStars });

    if (!tg || typeof tg.sendData !== "function") {
        alert("Ошибка: Telegram WebApp недоступен");
        return;
    }

    try {
        tg.sendData(payload);
    } catch (e) {
        alert("Не удалось отправить: " + e.message + "\n\nВозможно WebApp открыт не через кнопку бота.");
    }
}

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

const btn = document.getElementById("spin-btn");
btn.addEventListener("click", spin);
